import type { Analisis, MercadoInfo, RazonAnalisis, Resumen, Veredicto } from '../types'
import { MARGEN_OBJETIVO } from './calculations'
import { formatoCOP, formatoPorcentaje } from './format'
import { buscarReferencia, precioReferencia } from './mercado'

// Un concepto de costo con su valor (para detectar el costo más grande).
export interface CostoConcepto {
  concepto: string
  valor: number
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

// Motor de análisis: a partir del resumen, los costos y el producto, arma una
// lectura "tipo asesor" con el porqué, comparación de mercado y recomendaciones.
export function analizar(
  resumen: Resumen,
  costos: CostoConcepto[],
  producto: string,
): Analisis {
  const r = resumen
  const ref = buscarReferencia(producto)
  const precioRefKg = ref ? precioReferencia(ref) : null

  // Comparación con el mercado.
  let posicion: MercadoInfo['posicion'] = null
  let difPorcentaje: number | null = null
  if (precioRefKg && r.precioVentaKg > 0) {
    difPorcentaje = ((r.precioVentaKg - precioRefKg) / precioRefKg) * 100
    posicion = difPorcentaje > 10 ? 'arriba' : difPorcentaje < -10 ? 'abajo' : 'enlinea'
  }
  const mercado: MercadoInfo = {
    encontrado: !!ref,
    nombre: ref?.nombre ?? null,
    precioRefKg,
    precioRefMin: ref?.precioKgMin ?? null,
    precioRefMax: ref?.precioKgMax ?? null,
    posicion,
    difPorcentaje,
  }

  // Precio "justo" sugerido: piso por margen objetivo, anclado al mercado.
  const piso = r.puntoEquilibrio * (1 + MARGEN_OBJETIVO)
  let precioJustoMin = piso
  let precioJustoMax = piso * 1.3
  if (ref) {
    precioJustoMin = Math.max(piso, ref.precioKgMin)
    precioJustoMax = Math.max(ref.precioKgMax, precioJustoMin)
  }
  precioJustoMin = Math.round(precioJustoMin)
  precioJustoMax = Math.round(precioJustoMax)

  // Caso datos incompletos: faltan kilos, precio o costos. Sin costos no se
  // puede juzgar la rentabilidad (el ROI colapsaría a 0 dando un veredicto falso).
  if (r.kilos <= 0 || r.precioVentaKg <= 0 || r.costoTotal <= 0) {
    const explicacion =
      r.kilos <= 0 || r.precioVentaKg <= 0
        ? 'Ingresa los kilos cosechados y el precio de venta para generar el análisis de tu cultivo.'
        : 'Ya casi: ingresa los costos de producción para evaluar la rentabilidad.'
    return {
      veredicto: 'incompleto',
      titulo: 'Faltan datos',
      indice: 0,
      explicacion,
      razones: [],
      precioJustoMin,
      precioJustoMax,
      mercado,
      recomendaciones: [],
    }
  }

  // Veredicto e índice (0–100, basado en el ROI).
  let veredicto: Veredicto
  let titulo: string
  if (r.utilidad < 0) {
    veredicto = 'perdida'
    titulo = 'No es rentable: estás perdiendo'
  } else if (r.roi < 20) {
    veredicto = 'ajustado'
    titulo = 'Rentable, pero ajustado'
  } else if (r.roi < 50) {
    veredicto = 'rentable'
    titulo = 'Cultivo rentable'
  } else {
    veredicto = 'excelente'
    titulo = 'Cultivo muy rentable'
  }
  const indice = clamp(Math.round(r.roi), 0, 100)

  // Razones (los "porqués").
  const razones: RazonAnalisis[] = []

  razones.push({
    etiqueta: 'Costo por kilo',
    detalle: `Producir cada kilo te cuesta ${formatoCOP(r.costoKg)}.`,
    tono: 'neutro',
  })

  razones.push({
    etiqueta: 'Ganancia por kilo',
    detalle:
      r.gananciaKg >= 0
        ? `Vendiendo a ${formatoCOP(r.precioVentaKg)} ganas ${formatoCOP(r.gananciaKg)} por cada kilo.`
        : `Vendiendo a ${formatoCOP(r.precioVentaKg)} pierdes ${formatoCOP(Math.abs(r.gananciaKg))} por cada kilo.`,
    tono: r.gananciaKg >= 0 ? 'bueno' : 'malo',
  })

  razones.push({
    etiqueta: 'Margen de utilidad',
    detalle:
      r.margen >= 0
        ? `De cada $100 que vendes, te quedan unos ${formatoCOP(Math.round(r.margen))} de ganancia (margen ${formatoPorcentaje(r.margen)}).`
        : `Tu margen es negativo (${formatoPorcentaje(r.margen)}): estás vendiendo por debajo de lo que te cuesta producir.`,
    tono: r.margen >= 25 ? 'bueno' : r.margen >= 0 ? 'neutro' : 'malo',
  })

  razones.push({
    etiqueta: 'Punto de equilibrio',
    detalle: `Necesitas vender a mínimo ${formatoCOP(r.puntoEquilibrio)}/kg para no perder.`,
    tono: 'neutro',
  })

  if (mercado.encontrado && precioRefKg) {
    if (posicion === 'arriba') {
      razones.push({
        etiqueta: 'Frente al mercado',
        detalle: `Vendes por encima de la referencia mayorista (${formatoCOP(precioRefKg)}/kg). Buen precio.`,
        tono: 'bueno',
      })
    } else if (posicion === 'abajo') {
      razones.push({
        etiqueta: 'Frente al mercado',
        detalle: `Vendes por debajo de la referencia mayorista (${formatoCOP(precioRefKg)}/kg): podrías estar dejando plata sobre la mesa.`,
        tono: 'malo',
      })
    } else {
      razones.push({
        etiqueta: 'Frente al mercado',
        detalle: `Tu precio está en línea con la referencia mayorista (${formatoCOP(precioRefKg)}/kg).`,
        tono: 'neutro',
      })
    }

    // Competitividad en costos: producir más caro que el precio de mercado.
    if (r.costoKg > precioRefKg) {
      razones.push({
        etiqueta: 'Alerta de costos',
        detalle: `Producir te cuesta ${formatoCOP(r.costoKg)}/kg, más de lo que paga el mercado (${formatoCOP(precioRefKg)}/kg). Hay que bajar costos o producir más kilos.`,
        tono: 'malo',
      })
    }
  }

  // Explicación (párrafo, "tipo IA").
  const explicacion = construirExplicacion(r, veredicto, mercado)

  // Recomendaciones accionables.
  const recomendaciones = construirRecomendaciones(r, veredicto, mercado, costos, {
    precioJustoMin,
    precioJustoMax,
  })

  return {
    veredicto,
    titulo,
    indice,
    explicacion,
    razones,
    precioJustoMin,
    precioJustoMax,
    mercado,
    recomendaciones,
  }
}

function construirExplicacion(r: Resumen, veredicto: Veredicto, mercado: MercadoInfo): string {
  const partes: string[] = []

  if (veredicto === 'perdida') {
    partes.push(
      `Con un costo de ${formatoCOP(r.costoTotal)} y ventas por ${formatoCOP(r.ingresos)}, estás perdiendo ${formatoCOP(Math.abs(r.utilidad))}.`,
    )
    partes.push(
      `El problema es que vendes cada kilo a ${formatoCOP(r.precioVentaKg)}, pero producirlo te cuesta ${formatoCOP(r.costoKg)}.`,
    )
  } else if (veredicto === 'ajustado') {
    partes.push(
      `Sí ganas (${formatoCOP(r.utilidad)}), pero la ganancia es ajustada: tu retorno es de ${formatoPorcentaje(r.roi)} sobre lo invertido.`,
    )
    partes.push(`Cualquier subida de costos o bajada de precio podría dejarte sin utilidad.`)
  } else if (veredicto === 'rentable') {
    partes.push(
      `Tu cultivo deja una buena ganancia de ${formatoCOP(r.utilidad)}, con un retorno de ${formatoPorcentaje(r.roi)} sobre lo invertido.`,
    )
    partes.push(
      `Por cada ${formatoCOP(1000)} que pones, recuperas ${formatoCOP(1000 * (1 + r.roi / 100))}.`,
    )
  } else if (veredicto === 'excelente') {
    partes.push(
      `Excelente: ganas ${formatoCOP(r.utilidad)} con un retorno de ${formatoPorcentaje(r.roi)}. Es un cultivo muy rentable.`,
    )
    partes.push(
      `Por cada ${formatoCOP(1000)} invertidos, recuperas ${formatoCOP(1000 * (1 + r.roi / 100))}.`,
    )
  }

  if (mercado.encontrado && mercado.precioRefKg) {
    if (mercado.posicion === 'abajo') {
      partes.push(
        `Además, el mercado mayorista paga alrededor de ${formatoCOP(mercado.precioRefKg)}/kg por ${mercado.nombre?.toLowerCase()}, así que tienes margen para vender más caro.`,
      )
    } else if (mercado.posicion === 'arriba') {
      partes.push(
        `Tu precio ya está por encima del promedio de mercado (${formatoCOP(mercado.precioRefKg)}/kg): buen trabajo, pero cuida no quedar caro frente a la competencia.`,
      )
    } else {
      partes.push(
        `Tu precio va en línea con el mercado mayorista (${formatoCOP(mercado.precioRefKg)}/kg).`,
      )
    }
  }

  return partes.join(' ')
}

function construirRecomendaciones(
  r: Resumen,
  veredicto: Veredicto,
  mercado: MercadoInfo,
  costos: CostoConcepto[],
  precios: { precioJustoMin: number; precioJustoMax: number },
): string[] {
  const recs: string[] = []

  // Texto del precio sugerido: rango, o un solo valor si min == max.
  const rango =
    precios.precioJustoMin === precios.precioJustoMax
      ? `${formatoCOP(precios.precioJustoMin)}/kg`
      : `entre ${formatoCOP(precios.precioJustoMin)} y ${formatoCOP(precios.precioJustoMax)}/kg`

  if (veredicto === 'perdida') {
    recs.push(`Vende a mínimo ${formatoCOP(r.puntoEquilibrio)}/kg para no perder; lo ideal es ${rango}.`)
  } else {
    recs.push(`Apunta a vender ${rango} para una ganancia sana.`)
  }

  // Costo más grande: solo cuando hay desglose real (no en modo rápido).
  const conValor = costos.filter((c) => c.valor > 0)
  if (conValor.length > 1 && r.costoTotal > 0) {
    const mayor = conValor.reduce((a, b) => (b.valor > a.valor ? b : a))
    const pct = (mayor.valor / r.costoTotal) * 100
    if (pct >= 25 && mayor.concepto !== 'Costo total') {
      recs.push(
        `Tu mayor costo es "${mayor.concepto}" (${formatoCOP(mayor.valor)}, ${formatoPorcentaje(pct)} del total). Reducirlo es lo que más sube tu ganancia.`,
      )
    }
  }

  if (mercado.encontrado && mercado.precioRefKg && mercado.posicion === 'abajo') {
    recs.push(
      `El mercado paga ~${formatoCOP(mercado.precioRefKg)}/kg: negocia un mejor precio o busca compradores que paguen más (directo, no intermediarios).`,
    )
  }

  if (mercado.encontrado && mercado.precioRefKg && r.costoKg > mercado.precioRefKg) {
    recs.push(
      `Estás produciendo más caro que el precio de mercado. Sube el rendimiento (más kilos por la misma inversión) o reduce insumos/mano de obra.`,
    )
  }

  if (veredicto === 'excelente') {
    recs.push(`Vas muy bien. Considera ampliar el área o repetir este cultivo la próxima temporada.`)
  }

  return recs.slice(0, 4)
}
