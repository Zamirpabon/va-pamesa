import { useMemo, useState } from 'react'
import { CAMPOS_COSTO, CATEGORIAS } from '../lib/costos'
import { calcularResumen } from '../lib/calculations'
import { analizar, type CostoConcepto } from '../lib/analisis'
import type { DatosCultivo } from '../types'
import { CampoNumero } from './CampoNumero'
import { Resumen } from './Resumen'
import { AnalisisPanel } from './AnalisisPanel'
import { PreciosReferencia } from './PreciosReferencia'
import { VerdictoHero } from './VerdictoHero'
import { DesgloseCostos } from './DesgloseCostos'

interface Props {
  // Guarda el cultivo en la base de datos. Lanza si algo falla.
  onGuardar: (datos: DatosCultivo) => Promise<unknown>
}

type Modo = 'detallado' | 'rapido'
type Estado = 'idle' | 'guardando' | 'ok' | 'error'

const costosIniciales = (): Record<string, number> =>
  Object.fromEntries(CAMPOS_COSTO.map((c) => [c.id, 0]))

export function Calculadora({ onGuardar }: Props) {
  const [producto, setProducto] = useState('')
  const [areaM2, setAreaM2] = useState(0)
  const [cicloSemanas, setCicloSemanas] = useState(0)
  const [unidades, setUnidades] = useState(0)
  const [kilos, setKilos] = useState(0)
  const [precioVentaKg, setPrecioVentaKg] = useState(0)
  const [costos, setCostos] = useState<Record<string, number>>(costosIniciales)
  const [modo, setModo] = useState<Modo>('detallado')
  const [costoRapido, setCostoRapido] = useState(0)
  const [estado, setEstado] = useState<Estado>('idle')

  const listaCostos = useMemo(
    () => (modo === 'rapido' ? [costoRapido] : CAMPOS_COSTO.map((c) => costos[c.id] ?? 0)),
    [modo, costoRapido, costos],
  )

  const resumen = useMemo(
    () => calcularResumen(listaCostos, kilos, precioVentaKg),
    [listaCostos, kilos, precioVentaKg],
  )

  const costosDetalle = useMemo<CostoConcepto[]>(
    () =>
      modo === 'rapido'
        ? [{ concepto: 'Costo total', valor: costoRapido }]
        : CAMPOS_COSTO.map((c) => ({ concepto: c.concepto, valor: costos[c.id] ?? 0 })),
    [modo, costoRapido, costos],
  )

  const analisis = useMemo(
    () => analizar(resumen, costosDetalle, producto),
    [resumen, costosDetalle, producto],
  )

  // Costos agrupados por categoría (para el desglose). En modo rápido no aplica.
  const grupos = useMemo(() => {
    if (modo === 'rapido') return { insumos: 0, mano: 0, otros: 0 }
    let insumos = 0
    let mano = 0
    let otros = 0
    for (const c of CAMPOS_COSTO) {
      const v = costos[c.id] ?? 0
      if (c.categoria === 'insumos') insumos += v
      else if (c.categoria === 'mano_obra') mano += v
      else otros += v
    }
    return { insumos, mano, otros }
  }, [modo, costos])

  const setCosto = (id: string, v: number) =>
    setCostos((prev) => ({ ...prev, [id]: v }))

  const puedeGuardar = producto.trim() !== '' && kilos > 0

  const guardar = async () => {
    const datos: DatosCultivo = {
      producto: producto.trim(),
      area_m2: areaM2,
      ciclo_semanas: cicloSemanas,
      unidades,
      kilos,
      precio_venta_kg: precioVentaKg,
      costos: modo === 'rapido' ? { total: costoRapido } : costos,
      costo_total: resumen.costoTotal,
      ingresos: resumen.ingresos,
      utilidad: resumen.utilidad,
      margen: resumen.margen,
      roi: resumen.roi,
      nivel: resumen.nivel,
    }
    setEstado('guardando')
    try {
      await onGuardar(datos)
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  const etiquetaBoton =
    estado === 'guardando'
      ? 'Guardando…'
      : estado === 'ok'
        ? '✓ Guardado en tu registro'
        : 'Guardar en mi registro'

  return (
    <div className="calculadora">
      <form
        className="formulario"
        onChange={() => setEstado('idle')}
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Datos del cultivo */}
        <section className="bloque">
          <h3 className="bloque-titulo">Datos del cultivo</h3>

          <label className="campo">
            <span className="campo-etiqueta">Producto</span>
            <div className="campo-input">
              <input
                type="text"
                placeholder="Ej: Tomate"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
              />
            </div>
          </label>

          <div className="grid-2">
            <CampoNumero etiqueta="Peso cosechado" valor={kilos} onChange={setKilos} sufijo="kg" decimales />
            <CampoNumero
              etiqueta="Precio de venta"
              valor={precioVentaKg}
              onChange={setPrecioVentaKg}
              prefijo="$"
              sufijo="/kg"
            />
          </div>

          <details className="opcionales">
            <summary>Datos adicionales (opcional)</summary>
            <div className="grid-2">
              <CampoNumero etiqueta="Área" valor={areaM2} onChange={setAreaM2} sufijo="m²" decimales />
              <CampoNumero
                etiqueta="Ciclo"
                valor={cicloSemanas}
                onChange={setCicloSemanas}
                sufijo="sem."
              />
              <CampoNumero
                etiqueta="Cantidad producida"
                valor={unidades}
                onChange={setUnidades}
                sufijo="unid."
              />
            </div>
          </details>
        </section>

        {/* Costos */}
        <section className="bloque">
          <div className="bloque-cabecera">
            <h3 className="bloque-titulo">Costos de producción</h3>
            <div className="conmutador" role="group" aria-label="Modo de costos">
              <button
                type="button"
                className={modo === 'detallado' ? 'on' : ''}
                onClick={() => setModo('detallado')}
              >
                Detallado
              </button>
              <button
                type="button"
                className={modo === 'rapido' ? 'on' : ''}
                onClick={() => setModo('rapido')}
              >
                Rápido
              </button>
            </div>
          </div>

          {modo === 'rapido' ? (
            <CampoNumero
              etiqueta="Costo total de producción"
              valor={costoRapido}
              onChange={setCostoRapido}
              prefijo="$"
            />
          ) : (
            CATEGORIAS.map((cat) => (
              <div key={cat.id} className="subbloque">
                <h4>{cat.titulo}</h4>
                <div className="grid-2">
                  {CAMPOS_COSTO.filter((c) => c.categoria === cat.id).map((c) => (
                    <CampoNumero
                      key={c.id}
                      etiqueta={c.concepto}
                      valor={costos[c.id] ?? 0}
                      onChange={(v) => setCosto(c.id, v)}
                      prefijo="$"
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <div className="acciones">
          <button
            type="button"
            className={estado === 'ok' ? 'btn-guardar ok' : 'btn-guardar'}
            disabled={!puedeGuardar || estado === 'guardando' || estado === 'ok'}
            onClick={guardar}
          >
            {etiquetaBoton}
          </button>
          {!puedeGuardar && (
            <span className="ayuda">Escribe el producto y los kilos para poder guardar.</span>
          )}
          {estado === 'error' && (
            <span className="ayuda malo">No se pudo guardar. Revisa tu conexión e intenta otra vez.</span>
          )}
        </div>
      </form>

      <div className="panel-derecho">
        <VerdictoHero resumen={resumen} analisis={analisis} />
        <Resumen resumen={resumen} />
        <DesgloseCostos insumos={grupos.insumos} mano={grupos.mano} otros={grupos.otros} />
        <AnalisisPanel analisis={analisis} />
        <PreciosReferencia />
      </div>
    </div>
  )
}
