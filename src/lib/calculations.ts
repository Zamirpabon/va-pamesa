import type { NivelRentabilidad, Resumen } from '../types'

// ───────────────────────────────────────────────────────────
// Funciones base (acordadas con el equipo)
// ───────────────────────────────────────────────────────────

export function costoTotal(costos: number[]): number {
  return costos.reduce((a, b) => a + b, 0)
}

export function costoKg(costo: number, kilos: number): number {
  if (kilos <= 0) return 0
  return costo / kilos
}

export function ingresos(kilos: number, precio: number): number {
  return kilos * precio
}

export function utilidad(ingresos: number, costos: number): number {
  return ingresos - costos
}

export function roi(utilidad: number, costo: number): number {
  if (costo <= 0) return 0
  return (utilidad / costo) * 100
}

export function precioSugerido(costoKg: number, margen: number): number {
  return costoKg * (1 + margen)
}

// ───────────────────────────────────────────────────────────
// Derivados para el resumen
// ───────────────────────────────────────────────────────────

export function gananciaKg(precioVentaKg: number, costoKg: number): number {
  return precioVentaKg - costoKg
}

export function margenUtilidad(utilidad: number, ingresos: number): number {
  if (ingresos <= 0) return 0
  return (utilidad / ingresos) * 100
}

// El punto de equilibrio ($/kg) es el precio mínimo de venta para no perder:
// coincide con el costo por kilo.
export function puntoEquilibrio(costoKg: number): number {
  return costoKg
}

// Umbrales del semáforo, basados en el ROI. Ajústalos a gusto del equipo.
export const UMBRAL_ROI_ALTA = 50
export const UMBRAL_ROI_MEDIA = 20

export function nivelRentabilidad(
  roiPct: number,
  utilidadValor: number,
): NivelRentabilidad {
  if (utilidadValor <= 0 || roiPct < UMBRAL_ROI_MEDIA) return 'baja'
  if (roiPct < UMBRAL_ROI_ALTA) return 'media'
  return 'alta'
}

// Margen objetivo por defecto para el precio sugerido (30 %).
export const MARGEN_OBJETIVO = 0.3

// Calcula todo el resumen a partir de los costos, los kilos y el precio.
export function calcularResumen(
  costos: number[],
  kilos: number,
  precioVentaKg: number,
  margenObjetivo: number = MARGEN_OBJETIVO,
): Resumen {
  const cTotal = costoTotal(costos)
  const ing = ingresos(kilos, precioVentaKg)
  const cKg = costoKg(cTotal, kilos)
  const util = utilidad(ing, cTotal)
  const roiPct = roi(util, cTotal)

  return {
    kilos,
    precioVentaKg,
    costoTotal: cTotal,
    ingresos: ing,
    costoKg: cKg,
    gananciaKg: gananciaKg(precioVentaKg, cKg),
    utilidad: util,
    margen: margenUtilidad(util, ing),
    roi: roiPct,
    puntoEquilibrio: puntoEquilibrio(cKg),
    precioSugerido: precioSugerido(cKg, margenObjetivo),
    nivel: nivelRentabilidad(roiPct, util),
    rentable: util > 0,
  }
}
