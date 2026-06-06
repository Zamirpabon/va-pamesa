import type { NivelRentabilidad } from '../types'

const ETIQUETAS: Record<NivelRentabilidad, string> = {
  alta: 'Rentabilidad alta',
  media: 'Rentabilidad media',
  baja: 'Rentabilidad baja',
}

export function Semaforo({
  nivel,
  incompleto = false,
}: {
  nivel: NivelRentabilidad
  incompleto?: boolean
}) {
  if (incompleto) {
    return (
      <div className="semaforo incompleto">
        <div className="luces" aria-hidden="true">
          <span className="luz" />
          <span className="luz" />
          <span className="luz" />
        </div>
        <span className="semaforo-texto">Sin datos</span>
      </div>
    )
  }

  return (
    <div className={`semaforo nivel-${nivel}`}>
      <div className="luces" aria-hidden="true">
        <span className={`luz roja ${nivel === 'baja' ? 'on' : ''}`} />
        <span className={`luz amarilla ${nivel === 'media' ? 'on' : ''}`} />
        <span className={`luz verde ${nivel === 'alta' ? 'on' : ''}`} />
      </div>
      <span className="semaforo-texto">{ETIQUETAS[nivel]}</span>
    </div>
  )
}
