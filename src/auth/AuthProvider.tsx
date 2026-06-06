import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { obtenerPerfil } from '../lib/db'
import type { Perfil } from '../types'

export interface DatosRegistro {
  nombre: string
  finca: string
  telefono: string
}

interface AuthCtx {
  session: Session | null
  perfil: Perfil | null
  cargando: boolean
  esAdmin: boolean
  iniciarSesion: (email: string, password: string) => Promise<string | null>
  registrarse: (
    email: string,
    password: string,
    datos: DatosRegistro,
  ) => Promise<{ error: string | null; necesitaConfirmar: boolean }>
  cerrarSesion: () => Promise<void>
  refrescarPerfil: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

// Traduce los errores más comunes de Supabase al español.
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('user already registered')) return 'Ese correo ya está registrado.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'El correo no es válido.'
  if (m.includes('email not confirmed')) return 'Debes confirmar tu correo antes de entrar.'
  return mensaje
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

  // Contador para descartar respuestas obsoletas (evita condiciones de carrera
  // y actualizaciones tras desmontar): solo se aplica la última petición.
  const peticionPerfil = useRef(0)

  async function cargarPerfil(userId: string | null) {
    const ticket = ++peticionPerfil.current
    if (!userId) {
      setPerfil(null)
      return
    }
    try {
      const p = await obtenerPerfil(userId)
      if (ticket === peticionPerfil.current) setPerfil(p)
    } catch {
      if (ticket === peticionPerfil.current) setPerfil(null)
    }
  }

  useEffect(() => {
    if (!supabase) {
      setCargando(false)
      return
    }
    let activo = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!activo) return
        setSession(data.session)
        await cargarPerfil(data.session?.user?.id ?? null)
      })
      .catch(() => {})
      .finally(() => {
        // Pase lo que pase, apaga el spinner para no quedar atascados.
        if (activo) setCargando(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      if (!activo) return
      setSession(s)
      cargarPerfil(s?.user?.id ?? null)
    })

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function iniciarSesion(email: string, password: string): Promise<string | null> {
    if (!supabase) return 'Supabase no está configurado.'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? traducirError(error.message) : null
  }

  async function registrarse(
    email: string,
    password: string,
    datos: DatosRegistro,
  ): Promise<{ error: string | null; necesitaConfirmar: boolean }> {
    if (!supabase) return { error: 'Supabase no está configurado.', necesitaConfirmar: false }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: datos.nombre,
          finca: datos.finca,
          telefono: datos.telefono,
        },
      },
    })
    if (error) return { error: traducirError(error.message), necesitaConfirmar: false }
    // Si no hay sesión tras registrarse, Supabase pide confirmar el correo.
    return { error: null, necesitaConfirmar: !data.session }
  }

  async function cerrarSesion() {
    if (!supabase) return
    await supabase.auth.signOut()
    setPerfil(null)
  }

  async function refrescarPerfil() {
    await cargarPerfil(session?.user?.id ?? null)
  }

  const value: AuthCtx = {
    session,
    perfil,
    cargando,
    esAdmin: perfil?.rol === 'admin',
    iniciarSesion,
    registrarse,
    cerrarSesion,
    refrescarPerfil,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
