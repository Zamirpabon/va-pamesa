import type { Resumen as ResumenT } from '../types'
import { formatoCOP, formatoNumero, formatoPorcentaje } from '../lib/format'
import { Semaforo } from './Semaforo'

interface Props {
  resumen: ResumenT
  producto: string
}

export function Resumen({ resumen, producto }: Props) {
  const r = resumen

  return (
    <aside className="resumen">
      <div className="resumen-cabecera">
        <h2>Resumen{producto ? ` · ${producto}` : ''}</h2>
        <Semaforo nivel={r.nivel} />
      </div>

      <Mensaje resumen={r} />

      <div className="metricas">
        <Metrica titulo="Costo total" valor={formatoCOP(r.costoTotal)} destacado />
        <Metrica
          titulo="Utilidad total"
          valor={formatoCOP(r.utilidad)}
          tono={r.utilidad >= 0 ? 'bueno' : 'malo'}
          destacado
        />
        <Metrica titulo="Producción" valor={`${formatoNumero(r.kilos)} kg`} />
        <Metrica titulo="Precio venta / kg" valor={formatoCOP(r.precioVentaKg)} />
        <Metrica titulo="Ingresos" valor={formatoCOP(r.ingresos)} />
        <Metrica titulo="Costo por kg" valor={formatoCOP(r.costoKg)} />
        <Metrica
          titulo="Ganancia por kg"
          valor={formatoCOP(r.gananciaKg)}
          tono={r.gananciaKg >= 0 ? 'bueno' : 'malo'}
        />
        <Metrica titulo="Margen de utilidad" valor={formatoPorcentaje(r.margen)} />
        <Metrica
          titulo="Rentabilidad (ROI)"
          valor={formatoPorcentaje(r.roi)}
          tono={r.roi >= 0 ? 'bueno' : 'malo'}
        />
        <Metrica titulo="Punto de equilibrio" valor={`${formatoCOP(r.puntoEquilibrio)}/kg`} />
      </div>

      <p className="sugerencia">
        💡 Para ganar un 30 % vende a mínimo <strong>{formatoCOP(r.precioSugerido)}/kg</strong>.
      </p>
    </aside>
  )
}

function Mensaje({ resumen: r }: { resumen: ResumenT }) {
  if (r.kilos <= 0 || r.precioVentaKg <= 0) {
    return (
      <p className="mensaje neutro">
        Ingresa los <strong>kilos cosechados</strong> y el <strong>precio de venta</strong> para
        saber si tu cultivo es rentable.
      </p>
    )
  }

  if (!r.rentable) {
    return (
      <p className="mensaje malo">
        🔴 <strong>Por ahora no es rentable.</strong> Estás perdiendo{' '}
        {formatoCOP(Math.abs(r.utilidad))}. Para no perder, vende a mínimo{' '}
        <strong>{formatoCOP(r.puntoEquilibrio)}/kg</strong>; para ganar bien, apunta a{' '}
        <strong>{formatoCOP(r.precioSugerido)}/kg</strong>.
      </p>
    )
  }

  if (r.nivel === 'media') {
    return (
      <p className="mensaje medio">
        🟡 <strong>Sí es rentable, pero la ganancia es ajustada.</strong> Ganas{' '}
        {formatoCOP(r.utilidad)} ({formatoPorcentaje(r.roi)} de retorno). Si bajas costos o vendes a{' '}
        {formatoCOP(r.precioSugerido)}/kg, mejoras bastante.
      </p>
    )
  }

  return (
    <p className="mensaje bueno">
      🟢 <strong>¡Tu cultivo es rentable!</strong> Ganas {formatoCOP(r.utilidad)} con un retorno del{' '}
      {formatoPorcentaje(r.roi)}. Por cada {formatoCOP(1000)} invertidos recuperas{' '}
      <strong>{formatoCOP(1000 * (1 + r.roi / 100))}</strong>.
    </p>
  )
}

interface MetricaProps {
  titulo: string
  valor: string
  tono?: 'bueno' | 'malo'
  destacado?: boolean
}

function Metrica({ titulo, valor, tono, destacado }: MetricaProps) {
  const clases = ['metrica']
  if (destacado) clases.push('destacada')
  if (tono) clases.push(`tono-${tono}`)
  return (
    <div className={clases.join(' ')}>
      <span className="metrica-titulo">{titulo}</span>
      <span className="metrica-valor">{valor}</span>
    </div>
  )
}
