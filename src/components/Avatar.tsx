// Muestra la foto de perfil; si no hay, muestra la inicial del nombre.
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
  const estilo = { width: size, height: size }
  const clase = `avatar ${className}`.trim()

  if (foto) {
    return <img className={clase} style={estilo} src={foto} alt={nombre || 'Foto de perfil'} />
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
