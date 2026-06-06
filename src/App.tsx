import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { hayConfigSupabase } from './lib/supabase'
import { useMisCultivos } from './hooks/useMisCultivos'
import { Auth } from './components/Auth'
import { Cargando } from './components/Cargando'
import { ConfigFaltante } from './components/ConfigFaltante'
import { Calculadora } from './components/Calculadora'
import { Registro } from './components/Registro'
import { Perfil } from './components/Perfil'
import { AdminDashboard } from './components/AdminDashboard'

type Seccion = 'calculadora' | 'registro' | 'perfil' | 'admin'

export default function App() {
  if (!hayConfigSupabase) return <ConfigFaltante />
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

function Shell() {
  const { session, perfil, cargando, esAdmin, cerrarSesion } = useAuth()
  const [seccion, setSeccion] = useState<Seccion>('calculadora')

  if (cargando) return <Cargando texto="Entrando…" />
  if (!session) return <Auth />

  return (
    <div className="app">
      <header className="encabezado">
        <div className="encabezado-top">
          <div className="marca">
            <span className="logo" aria-hidden="true">🌱</span>
            <div>
              <h1>
                va<span className="marca-acento">·</span>pa<span className="marca-acento">·</span>mesa
              </h1>
              <p>Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''} 👋</p>
            </div>
          </div>
          <button type="button" className="btn-salir" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>

        <nav className="tabs" aria-label="Secciones">
          <Tab actual={seccion} valor="calculadora" onClick={setSeccion}>Calculadora</Tab>
          <Tab actual={seccion} valor="registro" onClick={setSeccion}>Mi registro</Tab>
          <Tab actual={seccion} valor="perfil" onClick={setSeccion}>Perfil</Tab>
          {esAdmin && (
            <Tab actual={seccion} valor="admin" onClick={setSeccion}>Admin</Tab>
          )}
        </nav>
      </header>

      <main className="contenido">
        {seccion === 'admin' && esAdmin ? (
          <AdminDashboard />
        ) : seccion === 'perfil' ? (
          <Perfil />
        ) : (
          <PanelProductor
            seccion={seccion === 'registro' ? 'registro' : 'calculadora'}
            userId={session.user.id}
          />
        )}
      </main>

      <footer className="pie">
        <p>Hecho para el campo 🇨🇴 · Tus cultivos se guardan en tu cuenta.</p>
      </footer>
    </div>
  )
}

function PanelProductor({
  seccion,
  userId,
}: {
  seccion: 'calculadora' | 'registro'
  userId: string
}) {
  const { cultivos, cargando, error, agregar, eliminar } = useMisCultivos(userId)
  return seccion === 'calculadora' ? (
    <Calculadora onGuardar={agregar} />
  ) : (
    <Registro cultivos={cultivos} cargando={cargando} error={error} onEliminar={eliminar} />
  )
}

function Tab({
  actual,
  valor,
  onClick,
  children,
}: {
  actual: Seccion
  valor: Seccion
  onClick: (s: Seccion) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={actual === valor ? 'tab activa' : 'tab'}
      onClick={() => onClick(valor)}
    >
      {children}
    </button>
  )
}
