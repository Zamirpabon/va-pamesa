// Formateo de valores en pesos colombianos y porcentajes (locale es-CO).

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatoCOP(valor: number): string {
  if (!isFinite(valor)) return '$ 0'
  return pesos.format(Math.round(valor))
}

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

export function formatoNumero(valor: number): string {
  if (!isFinite(valor)) return '0'
  return numero.format(valor)
}

const porcentaje = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatoPorcentaje(valor: number): string {
  if (!isFinite(valor)) return '0,00 %'
  return `${porcentaje.format(valor)} %`
}
