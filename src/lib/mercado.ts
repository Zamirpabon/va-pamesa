// Precios de referencia del mercado mayorista colombiano (COP por kg).
// Niveles aproximados basados en el comportamiento de SIPSA/DANE 2024–2025.
// Son una REFERENCIA para orientar al productor, no una cotización en vivo.

export const FUENTE_MERCADO = 'Referencia mayorista aprox. (base SIPSA/DANE 2024–2025)'

export interface RefMercado {
  nombre: string
  categoria: 'Hortalizas' | 'Frutas' | 'Tubérculos y plátanos' | 'Granos y otros'
  alias: string[]
  precioKgMin: number
  precioKgMax: number
}

// Tabla de referencia. precioKgMin/Max = rango típico mayorista por kg.
export const REFERENCIAS: RefMercado[] = [
  // Hortalizas
  { nombre: 'Tomate', categoria: 'Hortalizas', alias: ['tomate', 'tomate chonto', 'tomate larga vida'], precioKgMin: 1800, precioKgMax: 3500 },
  { nombre: 'Cebolla cabezona', categoria: 'Hortalizas', alias: ['cebolla cabezona', 'cebolla blanca', 'cebolla bulbo', 'cebolla'], precioKgMin: 1200, precioKgMax: 2800 },
  { nombre: 'Cebolla larga', categoria: 'Hortalizas', alias: ['cebolla larga', 'cebolla junca', 'cebollin', 'cebollín'], precioKgMin: 1500, precioKgMax: 3200 },
  { nombre: 'Zanahoria', categoria: 'Hortalizas', alias: ['zanahoria'], precioKgMin: 900, precioKgMax: 2000 },
  { nombre: 'Lechuga', categoria: 'Hortalizas', alias: ['lechuga'], precioKgMin: 1200, precioKgMax: 2600 },
  { nombre: 'Repollo', categoria: 'Hortalizas', alias: ['repollo', 'col'], precioKgMin: 700, precioKgMax: 1600 },
  { nombre: 'Pimentón', categoria: 'Hortalizas', alias: ['pimenton', 'pimentón', 'pimiento'], precioKgMin: 2000, precioKgMax: 4500 },
  { nombre: 'Pepino', categoria: 'Hortalizas', alias: ['pepino', 'pepino cohombro', 'cohombro'], precioKgMin: 1000, precioKgMax: 2200 },
  { nombre: 'Habichuela', categoria: 'Hortalizas', alias: ['habichuela'], precioKgMin: 1800, precioKgMax: 3800 },
  { nombre: 'Arveja verde', categoria: 'Hortalizas', alias: ['arveja', 'arveja verde', 'guisante'], precioKgMin: 2500, precioKgMax: 5500 },
  { nombre: 'Ahuyama', categoria: 'Hortalizas', alias: ['ahuyama', 'auyama', 'calabaza', 'zapallo'], precioKgMin: 700, precioKgMax: 1600 },
  { nombre: 'Cilantro', categoria: 'Hortalizas', alias: ['cilantro'], precioKgMin: 3000, precioKgMax: 9000 },
  { nombre: 'Brócoli', categoria: 'Hortalizas', alias: ['brocoli', 'brócoli'], precioKgMin: 1800, precioKgMax: 3800 },
  { nombre: 'Remolacha', categoria: 'Hortalizas', alias: ['remolacha'], precioKgMin: 900, precioKgMax: 2000 },
  // Tubérculos y plátanos
  { nombre: 'Papa común', categoria: 'Tubérculos y plátanos', alias: ['papa', 'papa pastusa', 'papa comun', 'papa común', 'papa parda'], precioKgMin: 1000, precioKgMax: 2200 },
  { nombre: 'Papa criolla', categoria: 'Tubérculos y plátanos', alias: ['papa criolla', 'criolla'], precioKgMin: 1800, precioKgMax: 3800 },
  { nombre: 'Yuca', categoria: 'Tubérculos y plátanos', alias: ['yuca'], precioKgMin: 1000, precioKgMax: 2400 },
  { nombre: 'Plátano hartón', categoria: 'Tubérculos y plátanos', alias: ['platano', 'plátano', 'platano harton', 'plátano hartón', 'platano verde'], precioKgMin: 1200, precioKgMax: 2600 },
  { nombre: 'Banano', categoria: 'Tubérculos y plátanos', alias: ['banano', 'guineo'], precioKgMin: 1000, precioKgMax: 2200 },
  // Frutas
  { nombre: 'Aguacate común', categoria: 'Frutas', alias: ['aguacate', 'aguacate comun', 'aguacate común'], precioKgMin: 2000, precioKgMax: 4500 },
  { nombre: 'Aguacate Hass', categoria: 'Frutas', alias: ['aguacate hass', 'hass'], precioKgMin: 3500, precioKgMax: 7500 },
  { nombre: 'Mango', categoria: 'Frutas', alias: ['mango', 'mango tommy'], precioKgMin: 1500, precioKgMax: 3500 },
  { nombre: 'Maracuyá', categoria: 'Frutas', alias: ['maracuya', 'maracuyá'], precioKgMin: 2000, precioKgMax: 4800 },
  { nombre: 'Naranja', categoria: 'Frutas', alias: ['naranja', 'naranja valencia'], precioKgMin: 800, precioKgMax: 2000 },
  { nombre: 'Mandarina', categoria: 'Frutas', alias: ['mandarina'], precioKgMin: 1200, precioKgMax: 2800 },
  { nombre: 'Limón Tahití', categoria: 'Frutas', alias: ['limon', 'limón', 'limon tahiti', 'limón tahití'], precioKgMin: 1500, precioKgMax: 4500 },
  { nombre: 'Papaya', categoria: 'Frutas', alias: ['papaya'], precioKgMin: 1000, precioKgMax: 2400 },
  { nombre: 'Piña', categoria: 'Frutas', alias: ['pina', 'piña', 'piña oro miel'], precioKgMin: 1200, precioKgMax: 2800 },
  { nombre: 'Fresa', categoria: 'Frutas', alias: ['fresa', 'fresas'], precioKgMin: 4000, precioKgMax: 9000 },
  { nombre: 'Mora', categoria: 'Frutas', alias: ['mora', 'mora de castilla'], precioKgMin: 3000, precioKgMax: 6500 },
  { nombre: 'Lulo', categoria: 'Frutas', alias: ['lulo'], precioKgMin: 2500, precioKgMax: 5500 },
  { nombre: 'Tomate de árbol', categoria: 'Frutas', alias: ['tomate de arbol', 'tomate de árbol'], precioKgMin: 1800, precioKgMax: 4000 },
  { nombre: 'Guayaba', categoria: 'Frutas', alias: ['guayaba'], precioKgMin: 1200, precioKgMax: 3000 },
  // Granos y otros
  { nombre: 'Maíz (mazorca)', categoria: 'Granos y otros', alias: ['maiz', 'maíz', 'choclo', 'mazorca'], precioKgMin: 1200, precioKgMax: 2600 },
  { nombre: 'Fríjol', categoria: 'Granos y otros', alias: ['frijol', 'fríjol', 'frijol seco'], precioKgMin: 5000, precioKgMax: 9000 },
  { nombre: 'Arroz', categoria: 'Granos y otros', alias: ['arroz', 'arroz paddy'], precioKgMin: 1800, precioKgMax: 2800 },
  { nombre: 'Café', categoria: 'Granos y otros', alias: ['cafe', 'café', 'cafe pergamino', 'café pergamino'], precioKgMin: 11000, precioKgMax: 16000 },
  { nombre: 'Cacao', categoria: 'Granos y otros', alias: ['cacao', 'cacao grano'], precioKgMin: 9000, precioKgMax: 14000 },
  { nombre: 'Panela', categoria: 'Granos y otros', alias: ['panela'], precioKgMin: 2500, precioKgMax: 4500 },
]

// Normaliza un texto: minúsculas, sin tildes, sin espacios extra.
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // quita tildes/diacríticos
    .trim()
}

// Busca la mejor referencia para el producto que escribió el campesino.
// Prefiere la coincidencia más específica (alias más largo que calce).
export function buscarReferencia(producto: string): RefMercado | null {
  const p = normalizar(producto)
  if (p.length < 3) return null // ignora entradas demasiado cortas (una letra, etc.)
  const palabras = p.split(/\s+/).filter(Boolean)

  let mejor: RefMercado | null = null
  let mejorPuntaje = 0

  for (const ref of REFERENCIAS) {
    for (const alias of ref.alias) {
      const a = normalizar(alias)
      const aPalabras = a.split(/\s+/).filter(Boolean)

      let puntaje = 0
      if (p === a) {
        // coincidencia exacta producto = alias (la más fuerte)
        puntaje = 1000 + a.length
      } else if (aPalabras.every((w) => palabras.includes(w))) {
        // todas las palabras del alias están como palabras COMPLETAS en la entrada.
        // Evita falsos positivos por substring (p. ej. "papayuela" NO calza con "papa").
        puntaje = 100 + a.length
      }

      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje
        mejor = ref
      }
    }
  }
  return mejor
}

// Precio de referencia (punto medio del rango) para una referencia.
export function precioReferencia(ref: RefMercado): number {
  return Math.round((ref.precioKgMin + ref.precioKgMax) / 2)
}
