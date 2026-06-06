// Nivel del semáforo de rentabilidad.
export type NivelRentabilidad = 'alta' | 'media' | 'baja'

// Grupos de costos, siguiendo la plantilla del productor (Excel ARAC).
export type CategoriaCosto = 'insumos' | 'mano_obra' | 'otros'

// Resultado calculado que se muestra en el panel de resumen.
export interface Resumen {
  kilos: number
  precioVentaKg: number
  costoTotal: number
  ingresos: number
  costoKg: number
  gananciaKg: number
  utilidad: number
  margen: number // %
  roi: number // %
  puntoEquilibrio: number // $/kg para no perder
  precioSugerido: number // $/kg para alcanzar el margen objetivo
  nivel: NivelRentabilidad
  rentable: boolean
}

// Un cultivo guardado en el registro local (localStorage).
export interface CultivoGuardado {
  id: string
  fecha: string // ISO
  producto: string
  kilos: number
  costoTotal: number
  precioVentaKg: number
  ingresos: number
  utilidad: number
  roi: number
  nivel: NivelRentabilidad
}
