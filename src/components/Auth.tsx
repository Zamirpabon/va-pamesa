import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from './Logo'

type Modo = 'login' | 'registro'

export function Auth() {
  const { iniciarSesion, registrarse } = useAuth()
  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [finca, setFinca] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAviso(null)

    if (modo === 'registro' && nombre.trim() === '') {
      setError('Escribe tu nombre.')
      return
    }

    setEnviando(true)
    try {
      if (modo === 'login') {
        const err = await iniciarSesion(email.trim(), password)
        if (err) setError(err)
      } else {
        const { error: err, necesitaConfirmar } = await registrarse(email.trim(), password, {
          nombre: nombre.trim(),
          finca: finca.trim(),
          telefono: telefono.trim(),
        })
        if (err) setError(err)
        else if (necesitaConfirmar) {
          setAviso('¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.')
          setModo('login')
        }
      }
    } catch {
      setError('Algo salió mal. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-tarjeta">
        <Logo className="marca-logo" />
        <p className="auth-sub">
          {modo === 'login'
            ? 'Entra a tu cuenta para ver tus cultivos.'
            : 'Crea tu cuenta para guardar tus cultivos.'}
        </p>

        {aviso && <p className="mensaje bueno">{aviso}</p>}
        {error && <p className="mensaje malo">{error}</p>}

        <form className="auth-form" onSubmit={enviar}>
          {modo === 'registro' && (
            <>
              <label className="campo">
                <span className="campo-etiqueta">Nombre *</span>
                <div className="campo-input">
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </label>
              <div className="grid-2">
                <label className="campo">
                  <span className="campo-etiqueta">Finca</span>
                  <div className="campo-input">
                    <input
                      type="text"
                      placeholder="Nombre de la finca"
                      value={finca}
                      onChange={(e) => setFinca(e.target.value)}
                    />
                  </div>
                </label>
                <label className="campo">
                  <span className="campo-etiqueta">Teléfono</span>
                  <div className="campo-input">
                    <input
                      type="tel"
                      placeholder="Celular"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </label>
              </div>
            </>
          )}

          <label className="campo">
            <span className="campo-etiqueta">Correo</span>
            <div className="campo-input">
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="campo">
            <span className="campo-etiqueta">Contraseña</span>
            <div className="campo-input">
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
            </div>
          </label>

          <button type="submit" className="btn-guardar" disabled={enviando}>
            {enviando
              ? 'Un momento…'
              : modo === 'login'
                ? 'Ingresar'
                : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-cambio">
          {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            className="enlace"
            onClick={() => {
              setModo(modo === 'login' ? 'registro' : 'login')
              setError(null)
              setAviso(null)
            }}
          >
            {modo === 'login' ? 'Crear una' : 'Iniciar sesión'}
          </button>
        </p>

        <p className="credito">Desarrollado por <strong>zamge</strong></p>
      </div>
    </div>
  )
}
