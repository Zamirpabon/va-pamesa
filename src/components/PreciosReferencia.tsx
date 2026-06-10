import { FUENTE_MERCADO, REFERENCIAS } from '../lib/mercado'
import { formatoCOP } from '../lib/format'

// Productos destacados para mostrar como referencia rápida de mercado.
const DESTACADOS = [
  'Tomate',
  'Papa común',
  'Cebolla cabezona',
  'Zanahoria',
  'Plátano hartón',
  'Aguacate común',
  'Mango',
  'Naranja',
  'Fresa',
  'Maíz (mazorca)',
]

export function PreciosReferencia() {
  const items = REFERENCIAS.filter((r) => DESTACADOS.includes(r.nombre))

  return (
    <details className="precios-ref">
      <summary>
        <span>Precios de referencia del mercado</span>
        <span className="pr-chevron" aria-hidden="true">▾</span>
      </summary>
      <ul>
        {items.map((r) => (
          <li key={r.nombre}>
            <span className="pr-nombre">{r.nombre}</span>
            <span className="pr-precio">
              {formatoCOP(r.precioKgMin)} – {formatoCOP(r.precioKgMax)}/kg
            </span>
          </li>
        ))}
      </ul>
      <p className="fuente">{FUENTE_MERCADO}</p>
    </details>
  )
}
