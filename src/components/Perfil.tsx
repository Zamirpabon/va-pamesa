import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { actualizarPerfil } from '../lib/db'

type Estado = 'idle' | 'guardando' | 'ok' | 'error'

export function Perfil() {
  const { perfil, session, refrescarPerfil } = useAuth()
  const [nombre, setNombre] = useState(perfil?.nombre ?? '')
  const [finca, setFinca] = useState(perfil?.finca ?? '')
  const [telefono, setTelefono] = useState(perfil?.telefono ?? '')
  const [estado, setEstado] = useState<Estado>('idle')

  // Re-sincroniza el formulario cuando cambia el perfil del contexto
  // (p. ej. tras guardar y volver a leerlo de la base de datos).
  useEffect(() => {
    setNombre(perfil?.nombre ?? '')
    setFinca(perfil?.finca ?? '')
    setTelefono(perfil?.telefono ?? '')
  }, [perfil?.id, perfil?.nombre, perfil?.finca, perfil?.telefono])

  if (!perfil) return null

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado('guardando')
    try {
      await actualizarPerfil(perfil.id, {
        nombre: nombre.trim(),
        finca: finca.trim() || null,
        telefono: telefono.trim() || null,
      })
      await refrescarPerfil()
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="perfil">
      <div className="bloque">
        <h2 className="bloque-titulo">Mi perfil</h2>

        <form className="formulario" onChange={() => setEstado('idle')} onSubmit={guardar}>
          <label className="campo">
            <span className="campo-etiqueta">Correo</span>
            <div className="campo-input">
              <input type="email" value={session?.user?.email ?? ''} disabled />
            </div>
          </label>

          <label className="campo">
            <span className="campo-etiqueta">Nombre</span>
            <div className="campo-input">
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </label>

          <div className="grid-2">
            <label className="campo">
              <span className="campo-etiqueta">Finca</span>
              <div className="campo-input">
                <input type="text" value={finca} onChange={(e) => setFinca(e.target.value)} />
              </div>
            </label>
            <label className="campo">
              <span className="campo-etiqueta">Teléfono</span>
              <div className="campo-input">
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
            </label>
          </div>

          {perfil.rol === 'admin' && (
            <p className="ayuda">Tu cuenta es de tipo <strong>administrador</strong>.</p>
          )}

          <div className="acciones">
            <button
              type="submit"
              className={estado === 'ok' ? 'btn-guardar ok' : 'btn-guardar'}
              disabled={estado === 'guardando'}
            >
              {estado === 'guardando'
                ? 'Guardando…'
                : estado === 'ok'
                  ? '✓ Guardado'
                  : 'Guardar cambios'}
            </button>
            {estado === 'error' && (
              <span className="ayuda malo">No se pudo guardar. Intenta otra vez.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
