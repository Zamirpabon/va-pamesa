import { useEffect, useMemo, useState } from 'react'
import { listarTodosCultivos, listarTodosPerfiles } from '../lib/db'
import { formatoCOP, formatoNumero, formatoPorcentaje } from '../lib/format'
import type { CultivoRow, Perfil } from '../types'
import { Cargando } from './Cargando'

export function AdminDashboard() {
  const [perfiles, setPerfiles] = useState<Perfil[] | null>(null)
  const [cultivos, setCultivos] = useState<CultivoRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    Promise.all([listarTodosPerfiles(), listarTodosCultivos()])
      .then(([p, c]) => {
        if (!activo) return
        setPerfiles(p)
        setCultivos(c)
      })
      .catch(() => {
        if (activo) setError('No pudimos cargar el panel.')
      })
    return () => {
      activo = false
    }
  }, [])

  const datos = useMemo(() => {
    if (!perfiles || !cultivos) return null

    const totalCosto = cultivos.reduce((a, c) => a + c.costo_total, 0)
    const totalIngresos = cultivos.reduce((a, c) => a + c.ingresos, 0)
    const totalUtilidad = cultivos.reduce((a, c) => a + c.utilidad, 0)
    const totalKilos = cultivos.reduce((a, c) => a + c.kilos, 0)
    const roiGlobal = totalCosto > 0 ? (totalUtilidad / totalCosto) * 100 : 0

    const niveles: Record<string, number> = { alta: 0, media: 0, baja: 0 }
    for (const c of cultivos) niveles[c.nivel] = (niveles[c.nivel] ?? 0) + 1

    const porId = new Map<string, { kilos: number; costo: number; utilidad: number; n: number }>()
    for (const c of cultivos) {
      const e = porId.get(c.productor_id) ?? { kilos: 0, costo: 0, utilidad: 0, n: 0 }
      e.kilos += c.kilos
      e.costo += c.costo_total
      e.utilidad += c.utilidad
      e.n += 1
      porId.set(c.productor_id, e)
    }

    const productores = perfiles
      .map((p) => {
        const e = porId.get(p.id)
        return {
          perfil: p,
          n: e?.n ?? 0,
          kilos: e?.kilos ?? 0,
          costo: e?.costo ?? 0,
          utilidad: e?.utilidad ?? 0,
          roi: e && e.costo > 0 ? (e.utilidad / e.costo) * 100 : 0,
        }
      })
      .sort((a, b) => b.utilidad - a.utilidad)

    return {
      totalCosto,
      totalIngresos,
      totalUtilidad,
      totalKilos,
      roiGlobal,
      niveles,
      productores,
      nProductores: perfiles.length,
      nCultivos: cultivos.length,
    }
  }, [perfiles, cultivos])

  if (error) return <p className="mensaje malo">{error}</p>
  if (!datos) return <Cargando texto="Cargando panel de administración…" />

  return (
    <div className="admin">
      <div className="registro-cabecera">
        <h2>Panel de administración</h2>
        <p>Resumen de todos los productores y sus cultivos.</p>
      </div>

      <div className="admin-cards">
        <Tarjeta titulo="Productores" valor={formatoNumero(datos.nProductores)} />
        <Tarjeta titulo="Cultivos registrados" valor={formatoNumero(datos.nCultivos)} />
        <Tarjeta titulo="Kilos totales" valor={`${formatoNumero(datos.totalKilos)} kg`} />
        <Tarjeta titulo="Costo total" valor={formatoCOP(datos.totalCosto)} />
        <Tarjeta titulo="Ingresos totales" valor={formatoCOP(datos.totalIngresos)} />
        <Tarjeta
          titulo="Utilidad total"
          valor={formatoCOP(datos.totalUtilidad)}
          tono={datos.totalUtilidad >= 0 ? 'bueno' : 'malo'}
        />
        <Tarjeta
          titulo="ROI global"
          valor={formatoPorcentaje(datos.roiGlobal)}
          tono={datos.roiGlobal >= 0 ? 'bueno' : 'malo'}
        />
        <Tarjeta
          titulo="Semáforo (A/M/B)"
          valor={`${datos.niveles.alta} / ${datos.niveles.media} / ${datos.niveles.baja}`}
        />
      </div>

      <h3 className="admin-subtitulo">Productores</h3>
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Productor</th>
              <th>Finca</th>
              <th>Cultivos</th>
              <th>Kilos</th>
              <th>Costo total</th>
              <th>Utilidad</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {datos.productores.map((p) => (
              <tr key={p.perfil.id}>
                <td data-label="Productor">
                  {p.perfil.nombre || '(sin nombre)'}
                  {p.perfil.rol === 'admin' && <span className="etiqueta-admin">admin</span>}
                </td>
                <td data-label="Finca">{p.perfil.finca || '—'}</td>
                <td data-label="Cultivos">{p.n}</td>
                <td data-label="Kilos">{formatoNumero(p.kilos)} kg</td>
                <td data-label="Costo total">{formatoCOP(p.costo)}</td>
                <td data-label="Utilidad" className={p.utilidad >= 0 ? 'bueno' : 'malo'}>
                  {formatoCOP(p.utilidad)}
                </td>
                <td data-label="ROI" className={p.utilidad >= 0 ? 'bueno' : 'malo'}>
                  {p.n > 0 ? formatoPorcentaje(p.roi) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tarjeta({
  titulo,
  valor,
  tono,
}: {
  titulo: string
  valor: string
  tono?: 'bueno' | 'malo'
}) {
  return (
    <div className={`metrica destacada ${tono ? `tono-${tono}` : ''}`}>
      <span className="metrica-titulo">{titulo}</span>
      <span className="metrica-valor">{valor}</span>
    </div>
  )
}
