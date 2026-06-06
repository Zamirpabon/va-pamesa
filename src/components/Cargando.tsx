export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="cargando">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}
