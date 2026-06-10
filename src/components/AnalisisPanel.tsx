import type { Analisis, Veredicto } from '../types'
import { formatoCOP } from '../lib/format'
import { FUENTE_MERCADO } from '../lib/mercado'

const CLASE: Record<Veredicto, string> = {
  excelente: 'exc',
  rentable: 'bien',
  ajustado: 'medio',
  perdida: 'mal',
  incompleto: 'neutro',
}

export function AnalisisPanel({ analisis }: { analisis: Analisis }) {
  const a = analisis

  if (a.veredicto === 'incompleto') return null

  return (
    <aside className={`analisis nivel-${CLASE[a.veredicto]}`}>
      <span className="analisis-tag">Análisis y consejos</span>

      <p className="analisis-explica">{a.explicacion}</p>

      {a.mercado.encontrado && a.mercado.precioRefKg !== null && (
        <div className="mercado-box">
          <div className="mercado-fila">
            <span>Precio de mercado ({a.mercado.nombre})</span>
            <strong>{formatoCOP(a.mercado.precioRefKg)}/kg</strong>
          </div>
          {a.mercado.precioRefMin !== null && a.mercado.precioRefMax !== null && (
            <div className="mercado-rango">
              Rango mayorista típico: {formatoCOP(a.mercado.precioRefMin)} –{' '}
              {formatoCOP(a.mercado.precioRefMax)}/kg
            </div>
          )}
        </div>
      )}

      <div className="precio-justo">
        <span>Precio justo sugerido</span>
        <strong>
          {a.precioJustoMin === a.precioJustoMax
            ? `${formatoCOP(a.precioJustoMin)}/kg`
            : `${formatoCOP(a.precioJustoMin)} – ${formatoCOP(a.precioJustoMax)}/kg`}
        </strong>
      </div>

      <div className="razones">
        {a.razones.map((rz, i) => (
          <div key={i} className={`razon tono-${rz.tono}`}>
            <span className="razon-et">{rz.etiqueta}</span>
            <span className="razon-de">{rz.detalle}</span>
          </div>
        ))}
      </div>

      {a.recomendaciones.length > 0 && (
        <div className="recos">
          <h3>Recomendaciones</h3>
          <ul>
            {a.recomendaciones.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {a.mercado.encontrado && <p className="fuente">{FUENTE_MERCADO}</p>}
    </aside>
  )
}
