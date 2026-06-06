import type { CultivoGuardado } from '../types'

// Persistencia local (sin base de datos todavía). Guarda el registro de
// cultivos en el navegador del productor, en este dispositivo.

const CLAVE = 'va-pamesa:registro'

export function leerRegistro(): CultivoGuardado[] {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? (data as CultivoGuardado[]) : []
  } catch {
    return []
  }
}

export function guardarRegistro(items: CultivoGuardado[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items))
  } catch {
    // Ignora errores de cuota o modo privado.
  }
}

export function agregarCultivo(item: CultivoGuardado): CultivoGuardado[] {
  const items = [item, ...leerRegistro()]
  guardarRegistro(items)
  return items
}

export function eliminarCultivo(id: string): CultivoGuardado[] {
  const items = leerRegistro().filter((c) => c.id !== id)
  guardarRegistro(items)
  return items
}
