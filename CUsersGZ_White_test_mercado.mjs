const REFERENCIAS = [
  { nombre: 'Tomate', alias: ['tomate', 'tomate chonto', 'tomate larga vida'] },
  { nombre: 'Cebolla cabezona', alias: ['cebolla cabezona', 'cebolla blanca', 'cebolla bulbo'] },
  { nombre: 'Cebolla larga', alias: ['cebolla larga', 'cebolla junca', 'cebollin', 'cebollín'] },
  { nombre: 'Zanahoria', alias: ['zanahoria'] },
  { nombre: 'Lechuga', alias: ['lechuga'] },
  { nombre: 'Repollo', alias: ['repollo', 'col'] },
  { nombre: 'Pimentón', alias: ['pimenton', 'pimentón', 'pimiento'] },
  { nombre: 'Pepino', alias: ['pepino', 'pepino cohombro', 'cohombro'] },
  { nombre: 'Habichuela', alias: ['habichuela'] },
  { nombre: 'Arveja verde', alias: ['arveja', 'arveja verde', 'guisante'] },
  { nombre: 'Ahuyama', alias: ['ahuyama', 'auyama', 'calabaza', 'zapallo'] },
  { nombre: 'Cilantro', alias: ['cilantro'] },
  { nombre: 'Brócoli', alias: ['brocoli', 'brócoli'] },
  { nombre: 'Remolacha', alias: ['remolacha'] },
  { nombre: 'Papa común', alias: ['papa', 'papa pastusa', 'papa comun', 'papa común', 'papa parda'] },
  { nombre: 'Papa criolla', alias: ['papa criolla', 'criolla'] },
  { nombre: 'Yuca', alias: ['yuca'] },
  { nombre: 'Plátano hartón', alias: ['platano', 'plátano', 'platano harton', 'plátano hartón', 'platano verde'] },
  { nombre: 'Banano', alias: ['banano', 'guineo'] },
  { nombre: 'Aguacate común', alias: ['aguacate', 'aguacate comun', 'aguacate común'] },
  { nombre: 'Aguacate Hass', alias: ['aguacate hass', 'hass'] },
  { nombre: 'Mango', alias: ['mango', 'mango tommy'] },
  { nombre: 'Maracuyá', alias: ['maracuya', 'maracuyá'] },
  { nombre: 'Naranja', alias: ['naranja', 'naranja valencia'] },
  { nombre: 'Mandarina', alias: ['mandarina'] },
  { nombre: 'Limón Tahití', alias: ['limon', 'limón', 'limon tahiti', 'limón tahití'] },
  { nombre: 'Papaya', alias: ['papaya'] },
  { nombre: 'Piña', alias: ['pina', 'piña', 'piña oro miel'] },
  { nombre: 'Fresa', alias: ['fresa', 'fresas'] },
  { nombre: 'Mora', alias: ['mora', 'mora de castilla'] },
  { nombre: 'Lulo', alias: ['lulo'] },
  { nombre: 'Tomate de árbol', alias: ['tomate de arbol', 'tomate de árbol'] },
  { nombre: 'Guayaba', alias: ['guayaba'] },
  { nombre: 'Maíz (mazorca)', alias: ['maiz', 'maíz', 'choclo', 'mazorca'] },
  { nombre: 'Fríjol', alias: ['frijol', 'fríjol', 'frijol seco'] },
  { nombre: 'Arroz', alias: ['arroz', 'arroz paddy'] },
  { nombre: 'Café', alias: ['cafe', 'café', 'cafe pergamino', 'café pergamino'] },
  { nombre: 'Cacao', alias: ['cacao', 'cacao grano'] },
  { nombre: 'Panela', alias: ['panela'] },
]

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

function buscarReferencia(producto) {
  const p = normalizar(producto)
  if (!p) return null
  let mejor = null
  let mejorPuntaje = 0
  let detalle = null
  for (const ref of REFERENCIAS) {
    for (const alias of ref.alias) {
      const a = normalizar(alias)
      if (p.includes(a) || a.includes(p)) {
        const puntaje = Math.min(a.length, p.length)
        if (puntaje > mejorPuntaje) {
          mejorPuntaje = puntaje
          mejor = ref
          detalle = {alias: a, dir: p.includes(a) ? 'p.includes(a)' : 'a.includes(p)', puntaje}
        }
      }
    }
  }
  return mejor ? {nombre: mejor.nombre, ...detalle} : null
}

const tests = ['papayuela', 'pa', 'tomatera', 'papa criolla del altiplano', 'papa', 'col', 'mora', 'pina']
for (const t of tests) {
  console.log(JSON.stringify(t) + ' -> ' + JSON.stringify(buscarReferencia(t)))
}
