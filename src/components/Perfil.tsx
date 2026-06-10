import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { actualizarPerfil, guardarFotoPerfil, subirAvatar } from '../lib/db'
import { Avatar } from './Avatar'

type Estado = 'idle' | 'guardando' | 'ok' | 'error'

export function Perfil() {
  const { perfil, session, refrescarPerfil } = useAuth()
  const [nombre, setNombre] = useState(perfil?.nombre ?? '')
  const [finca, setFinca] = useState(perfil?.finca ?? '')
  const [telefono, setTelefono] = useState(perfil?.telefono ?? '')
  const [estado, setEstado] = useState<Estado>('idle')
  const [foto, setFoto] = useState<'idle' | 'subiendo' | 'error'>('idle')
  const [fotoMsg, setFotoMsg] = useState('')

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

  const cambiarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFoto('error')
      setFotoMsg('El archivo debe ser una imagen (PNG, JPG o WEBP).')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setFoto('error')
      setFotoMsg('La imagen es muy pesada (máximo 3 MB).')
      return
    }
    setFoto('subiendo')
    try {
      const url = await subirAvatar(perfil.id, file)
      await guardarFotoPerfil(perfil.id, url)
      await refrescarPerfil()
      setFoto('idle')
    } catch {
      setFoto('error')
      setFotoMsg('No se pudo subir la foto. Intenta otra vez.')
    }
  }

  return (
    <div className="perfil">
      <div className="bloque perfil-card">
        <div className="perfil-cabecera">
          <Avatar foto={perfil.foto} nombre={perfil.nombre} size={104} className="avatar-grande" />
          <label className="btn-foto">
            {foto === 'subiendo' ? 'Subiendo…' : 'Cambiar foto'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={cambiarFoto}
              disabled={foto === 'subiendo'}
            />
          </label>
          <h2>{perfil.nombre || 'Mi perfil'}</h2>
          {perfil.rol === 'admin' && <span className="badge-rol">Administrador</span>}
          {foto === 'error' && <span className="ayuda malo">{fotoMsg}</span>}
        </div>

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
