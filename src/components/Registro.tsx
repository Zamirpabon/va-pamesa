import { formatoCOP, formatoNumero, formatoPorcentaje } from '../lib/format'
import type { CultivoRow } from '../types'
import { Cargando } from './Cargando'

interface Props {
  cultivos: CultivoRow[]
  cargando: boolean
  error?: string | null
  onEliminar: (id: string) => Promise<void>
}

export function Registro({ cultivos, cargando, error, onEliminar }: Props) {
  if (cargando) return <Cargando texto="Cargando tus cultivos…" />

  const banner = error ? <p className="mensaje malo">{error}</p> : null

  if (cultivos.length === 0) {
    return (
      <div className="vacio">
        {banner}
        <p className="vacio-emoji" aria-hidden="true">📋</p>
        <h2>Aún no tienes cultivos guardados</h2>
        <p>
          Usa la calculadora y toca <strong>“Guardar en mi registro”</strong> para llevar el control
          de tus cultivos mes a mes y compararlos.
        </p>
      </div>
    )
  }

  const totalUtilidad = cultivos.reduce((a, c) => a + c.utilidad, 0)

  return (
    <div className="registro">
      {banner}
      <div className="registro-cabecera">
        <h2>Mi registro de cultivos</h2>
        <p>
          Utilidad acumulada:{' '}
          <strong className={totalUtilidad >= 0 ? 'bueno' : 'malo'}>
            {formatoCOP(totalUtilidad)}
          </strong>
        </p>
      </div>

      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Cultivo</th>
              <th>Producción</th>
              <th>Costo total</th>
              <th>Precio/kg</th>
              <th>Ingresos</th>
              <th>Utilidad</th>
              <th>ROI</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {cultivos.map((c) => (
              <tr key={c.id}>
                <td data-label="Cultivo">
                  <span className={`punto nivel-${c.nivel}`} aria-hidden="true" /> {c.producto}
                </td>
                <td data-label="Producción">{formatoNumero(c.kilos)} kg</td>
                <td data-label="Costo total">{formatoCOP(c.costo_total)}</td>
                <td data-label="Precio/kg">{formatoCOP(c.precio_venta_kg)}</td>
                <td data-label="Ingresos">{formatoCOP(c.ingresos)}</td>
                <td data-label="Utilidad" className={c.utilidad >= 0 ? 'bueno' : 'malo'}>
                  {formatoCOP(c.utilidad)}
                </td>
                <td data-label="ROI" className={c.utilidad >= 0 ? 'bueno' : 'malo'}>
                  {formatoPorcentaje(c.roi)}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={() => onEliminar(c.id)}
                    aria-label={`Eliminar ${c.producto}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
