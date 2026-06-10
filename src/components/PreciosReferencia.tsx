import { FUENTE_MERCADO, REFERENCIAS } from '../lib/mercado'
import { formatoCOP } from '../lib/format'

// Productos destacados (con emoji) para la referencia rápida de mercado.
const DESTACADOS: Record<string, string> = {
  Tomate: '🍅',
  'Papa común': '🥔',
  'Cebolla cabezona': '🧅',
  Zanahoria: '🥕',
  'Plátano hartón': '🍌',
  'Aguacate común': '🥑',
  Mango: '🥭',
  Naranja: '🍊',
  Fresa: '🍓',
  'Maíz (mazorca)': '🌽',
}

export function PreciosReferencia() {
  const items = REFERENCIAS.filter((r) => r.nombre in DESTACADOS)

  return (
    <details className="precios-ref">
      <summary>
        <span>Precios de referencia del mercado</span>
        <span className="pr-chevron" aria-hidden="true">▾</span>
      </summary>
      <ul>
        {items.map((r) => (
          <li key={r.nombre}>
            <span className="pr-nombre">
              <span className="pr-emoji" aria-hidden="true">{DESTACADOS[r.nombre]}</span>
              {r.nombre}
            </span>
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
