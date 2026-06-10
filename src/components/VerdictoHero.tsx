import type { Analisis, Resumen, Veredicto } from '../types'
import { formatoCOP, formatoPorcentaje } from '../lib/format'

const NOTA: Record<Veredicto, string> = {
  excelente: 'Buen retorno sobre la inversión',
  rentable: 'Buen retorno sobre la inversión',
  ajustado: 'Retorno ajustado, revisa tus costos',
  perdida: 'Tus costos superan los ingresos',
  incompleto: 'Ingresa kilos y precio para ver el resultado',
}

// Tarjeta "héroe" con el veredicto grande + barra de ingresos vs costos.
export function VerdictoHero({ resumen, analisis }: { resumen: Resumen; analisis: Analisis }) {
  const r = resumen
  const v = analisis.veredicto
  const estado = v === 'incompleto' ? 'empty' : v === 'perdida' ? 'lose' : 'win'
  const eyebrow =
    estado === 'empty'
      ? 'Esperando datos'
      : estado === 'lose'
        ? 'Pérdida en esta cosecha'
        : 'Ganancia de la cosecha'

  const base = Math.max(r.ingresos, r.costoTotal, 1)
  const anchoCosto = (r.costoTotal / base) * 100
  const anchoUtil = (Math.max(r.utilidad, 0) / base) * 100

  return (
    <div className={`verdicto ${estado}`}>
      <div className="v-top">
        <div className="v-eyebrow">
          <span className="v-dot" />
          {eyebrow}
        </div>
        <div className="v-amount">{estado === 'empty' ? '—' : formatoCOP(r.utilidad)}</div>
        <div className="v-sub">
          {estado !== 'empty' && (
            <>
              <span className="v-chip">Margen {formatoPorcentaje(r.margen)}</span>
              <span className="v-chip">ROI {formatoPorcentaje(r.roi)}</span>
            </>
          )}
          <span>{NOTA[v]}</span>
        </div>
      </div>

      {estado !== 'empty' && (
        <div className="v-bar">
          <div className="bl">
            <span>Ingresos vs. costos</span>
            <span>{formatoCOP(r.ingresos)}</span>
          </div>
          <div className="barwrap">
            <span className="seg cost" style={{ width: `${anchoCosto}%` }} />
            <span className="seg profit" style={{ width: `${anchoUtil}%` }} />
          </div>
          <div className="v-legend">
            <span>
              <span className="sw sw-cost" /> Costos <strong>{formatoCOP(r.costoTotal)}</strong>
            </span>
            <span>
              <span className="sw sw-profit" /> Utilidad{' '}
              <strong>{formatoCOP(Math.max(r.utilidad, 0))}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
