// Nivel del semáforo de rentabilidad.
export type NivelRentabilidad = 'alta' | 'media' | 'baja'

// Grupos de costos, siguiendo la plantilla del productor (Excel ARAC).
export type CategoriaCosto = 'insumos' | 'mano_obra' | 'otros'

// Rol del usuario.
export type Rol = 'productor' | 'admin'

// Perfil de un usuario (tabla perfiles).
export interface Perfil {
  id: string
  nombre: string
  telefono: string | null
  finca: string | null
  rol: Rol
  created_at: string
}

// Datos de un cultivo (columnas que coinciden 1:1 con la tabla cultivos).
export interface DatosCultivo {
  producto: string
  area_m2: number
  ciclo_semanas: number
  unidades: number
  kilos: number
  precio_venta_kg: number
  costos: Record<string, number>
  costo_total: number
  ingresos: number
  utilidad: number
  margen: number
  roi: number
  nivel: NivelRentabilidad
}

// Una fila de cultivo tal como vive en la base de datos.
export interface CultivoRow extends DatosCultivo {
  id: string
  productor_id: string
  created_at: string
}

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

// ── Análisis inteligente ───────────────────────────────────

export type Veredicto = 'excelente' | 'rentable' | 'ajustado' | 'perdida' | 'incompleto'

export interface RazonAnalisis {
  etiqueta: string
  detalle: string
  tono: 'bueno' | 'neutro' | 'malo'
}

export interface MercadoInfo {
  encontrado: boolean
  nombre: string | null
  precioRefKg: number | null
  precioRefMin: number | null
  precioRefMax: number | null
  posicion: 'arriba' | 'enlinea' | 'abajo' | null
  difPorcentaje: number | null // % del precio de venta vs. la referencia
}

export interface Analisis {
  veredicto: Veredicto
  titulo: string
  indice: number // 0–100 (índice de rentabilidad)
  explicacion: string
  razones: RazonAnalisis[]
  precioJustoMin: number
  precioJustoMax: number
  mercado: MercadoInfo
  recomendaciones: string[]
}
