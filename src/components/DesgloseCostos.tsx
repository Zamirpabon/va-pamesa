import { formatoPorcentaje } from '../lib/format'

interface Props {
  insumos: number
  mano: number
  otros: number
}

// "¿En qué se va el dinero?" — barras por categoría de costo.
export function DesgloseCostos({ insumos, mano, otros }: Props) {
  const total = insumos + mano + otros
  if (total <= 0) return null

  const pct = (v: number) => (v / total) * 100

  return (
    <section className="desglose">
      <h3>¿En qué se va el dinero?</h3>
      <div className="desglose-bars">
        <Barra etiqueta="Insumos" valor={pct(insumos)} clase="insumos" />
        <Barra etiqueta="Mano de obra" valor={pct(mano)} clase="mano" />
        <Barra etiqueta="Otros costos" valor={pct(otros)} clase="otros" />
      </div>
    </section>
  )
}

function Barra({ etiqueta, valor, clase }: { etiqueta: string; valor: number; clase: string }) {
  return (
    <div className="brk">
      <div className="brk-top">
        <span>{etiqueta}</span>
        <span className="pct">{formatoPorcentaje(valor)}</span>
      </div>
      <div className="brk-track">
        <div className={`brk-fill ${clase}`} style={{ width: `${valor}%` }} />
      </div>
    </div>
  )
}
