import type { CategoriaCosto } from '../types'

// Catálogo de campos de costo, agrupados como en la plantilla del productor.

export interface DefCosto {
  id: string
  concepto: string
  categoria: CategoriaCosto
}

export const CATEGORIAS: { id: CategoriaCosto; titulo: string }[] = [
  { id: 'insumos', titulo: 'Costos de insumos' },
  { id: 'mano_obra', titulo: 'Mano de obra' },
  { id: 'otros', titulo: 'Otros costos' },
]

export const CAMPOS_COSTO: DefCosto[] = [
  { id: 'semillas', concepto: 'Semillas', categoria: 'insumos' },
  { id: 'abonos', concepto: 'Abonos / Fertilizantes', categoria: 'insumos' },
  { id: 'control', concepto: 'Control biológico / plagas', categoria: 'insumos' },
  { id: 'otros_insumos', concepto: 'Otros insumos', categoria: 'insumos' },
  { id: 'siembra', concepto: 'Siembra', categoria: 'mano_obra' },
  { id: 'mantenimiento', concepto: 'Mantenimiento', categoria: 'mano_obra' },
  { id: 'cosecha', concepto: 'Cosecha', categoria: 'mano_obra' },
  { id: 'empaque', concepto: 'Empaque / Clasificación', categoria: 'mano_obra' },
  { id: 'transporte', concepto: 'Transporte', categoria: 'otros' },
  { id: 'servicios', concepto: 'Servicios', categoria: 'otros' },
  { id: 'administracion', concepto: 'Administración', categoria: 'otros' },
  { id: 'otros_costos', concepto: 'Otros', categoria: 'otros' },
]
