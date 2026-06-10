import { useState } from 'react'

// Muestra el logo (public/portada.jpg). Si no existe, cae a un emoji.
export function Logo({ className }: { className?: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <span className={className} aria-hidden="true">
        🌱
      </span>
    )
  }

  return (
    <img
      className={className}
      src="/ARAC.jpg"
      alt="ARAC"
      onError={() => setError(true)}
    />
  )
}
