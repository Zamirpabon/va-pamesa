import { useEffect, useState } from 'react'

// Muestra la foto de perfil; si no hay (o la URL falla), muestra la inicial.
export function Avatar({
  foto,
  nombre,
  size = 40,
  className = '',
}: {
  foto?: string | null
  nombre?: string | null
  size?: number
  className?: string
}) {
  const [error, setError] = useState(false)
  useEffect(() => setError(false), [foto])

  const estilo = { width: size, height: size }
  const clase = `avatar ${className}`.trim()

  if (foto && !error) {
    return (
      <img
        className={clase}
        style={estilo}
        src={foto}
        alt={nombre || 'Foto de perfil'}
        onError={() => setError(true)}
      />
    )
  }

  const inicial = (nombre?.trim()?.[0] || '?').toUpperCase()
  return (
    <span
      className={`${clase} avatar-inicial`}
      style={{ ...estilo, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {inicial}
    </span>
  )
}
