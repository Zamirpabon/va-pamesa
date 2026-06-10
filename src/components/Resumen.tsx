import type { Resumen as ResumenT } from '../types'
import { formatoCOP, formatoNumero, formatoPorcentaje } from '../lib/format'

interface Props {
  resumen: ResumenT
}

export function Resumen({ resumen }: Props) {
  const r = resumen

  return (
    <aside className="resumen">
      <div className="resumen-cabecera">
        <h2>Indicadores</h2>
      </div>

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
    </aside>
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
