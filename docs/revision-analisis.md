# Revisión del análisis de va-pamesa

Síntesis de la revisión del motor de análisis (`src/lib/analisis.ts`, `src/lib/mercado.ts`, `src/lib/calculations.ts`). Se confirmaron **7 hallazgos reales** verificados contra el código fuente y por simulación de la lógica. Ninguno es un crash ni un problema de seguridad: son defectos funcionales y de calidad de los veredictos/recomendaciones que ve el usuario final (pequeños productores que confían en el resultado). Están ordenados por severidad.

| # | Severidad | Hallazgo | Archivo |
|---|-----------|----------|---------|
| 1 | Alta | Costo total = 0 produce ROI 0, veredicto y explicación falsos | `src/lib/analisis.ts` |
| 2 | Alta | Sin longitud mínima: una sola letra devuelve un producto con precio de referencia | `src/lib/mercado.ts` |
| 3 | Media | Falsos positivos por substring: un producto distinto se empareja | `src/lib/mercado.ts` |
| 4 | Media | "Precio justo sugerido" degenera a un rango $0–$0 o min=max | `src/lib/analisis.ts` |
| 5 | Baja | "papa" vs "papaya": el resultado correcto depende del orden de la tabla | `src/lib/mercado.ts` |
| 6 | Baja | El tono del margen marca como "malo" (rojo) el punto de equilibrio (margen = 0) | `src/lib/analisis.ts` |
| 7 | Baja | En modo rápido, la recomendación del "mayor costo" es tautológica | `src/lib/analisis.ts` |

---

## 1. Costo total = 0 produce ROI 0 y veredicto/explicación falsos — Severidad: ALTA

**Archivo:** `src/lib/analisis.ts` (apoyado en `src/lib/calculations.ts`)

**Problema.** `roi(util, costo)` en `calculations.ts` (líneas 24-27) devuelve `0` cuando `costo <= 0`. En `analizar()`, la guarda de "datos incompletos" (línea 56) solo verifica `kilos <= 0` o `precioVentaKg <= 0`, **no** `costoTotal <= 0`. Como todos los costos arrancan en 0 (estado inicial de la calculadora) y el panel se recalcula reactivamente en cada tecla, apenas el campesino escribe kilos y precio (antes de cargar costos) ocurre lo siguiente:

- `utilidad = ingresos > 0`, pero `r.roi = 0`.
- El veredicto cae en la rama `r.roi < 20` → `'ajustado'`, título "Rentable, pero ajustado".
- `indice = clamp(round(0), 0, 100) = 0` → "Índice de rentabilidad: 0/100".
- `construirExplicacion('ajustado')` afirma literalmente (líneas 185-189): *"Sí ganas (...), pero la ganancia es ajustada: tu retorno es de 0,00% sobre lo invertido. Cualquier subida de costos o bajada de precio podría dejarte sin utilidad."*

Esto es engañoso: con costo 0 el retorno real es infinito (es el caso **más** rentable, no el más ajustado), y la advertencia "podría dejarte sin utilidad" es falsa porque no hay costos en el snapshot. Además `nivelRentabilidad(0, util>0)` retorna `'baja'`, así que el semáforo enciende la luz **roja** "Rentabilidad baja" junto a una utilidad **verde** positiva visible en el Resumen. Contradicción directa ante el usuario.

Ejemplo concreto: Tomate, kilos=10, precio=5000, costos=0 → ingresos=50.000, utilidad=50.000, roi=0 → veredicto "ajustado", índice 0/100, texto "podría dejarte sin utilidad".

**Corrección.** En `analizar()`, ampliar la guarda de la línea 56 para tratar `costoTotal <= 0` como dato incompleto:

```ts
if (r.kilos <= 0 || r.precioVentaKg <= 0 || r.costoTotal <= 0) {
  // veredicto 'incompleto' con mensaje: 'Ingresa los costos de producción para evaluar la rentabilidad'
}
```

Alternativa: manejar explícitamente costo 0 como rentabilidad máxima en vez de mapearlo a ROI 0, y no derivar el índice de un ROI que colapsa a 0. Aplicar lo mismo a `nivelRentabilidad()` en `calculations.ts` para que el semáforo no muestre "baja" con utilidad positiva.

---

## 2. Sin longitud mínima: una sola letra devuelve un producto con precio de referencia — Severidad: ALTA

**Archivo:** `src/lib/mercado.ts`

**Problema.** `buscarReferencia` no exige longitud mínima ni puntaje mínimo. La condición de match (líneas 83-85) es `p.includes(a) || a.includes(p)` con `puntaje = Math.min(a.length, p.length)` y gate `puntaje > mejorPuntaje` partiendo de 0. Por eso cualquier carácter que sea subcadena de algún alias produce match. Verificado por simulación:

- `'a'` → Tomate, `'i'` → Tomate, `'o'` → Tomate
- `'pa'` → Ahuyama, `'co'` → Repollo
- `'t'`, `'m'`, `'e'` → Tomate; `'u'`, `'ca'` → Cebolla cabezona

Como `buscarReferencia` alimenta todo el análisis (`mercado.encontrado`, `precioRefKg`, comparación arriba/abajo, recomendaciones), y `Calculadora.tsx` ejecuta `analizar()` en un `useMemo` dependiente de `producto` (recalcula en cada tecla, sin debounce ni validación de longitud), un campesino que apenas escribió la primera letra ya recibe un veredicto de mercado con un precio de referencia falso (p. ej. "Precio de mercado (Tomate) — 2.650/kg") ajeno a su cultivo. El único early-return del análisis (línea 56) valida kilos y precio, nunca la calidad del match.

**Corrección.** Exigir una coincidencia significativa: dentro del bucle, descartar matches donde `Math.min(a.length, p.length) < 3` (es decir, solo considerar el match si `puntaje >= 3`), tratando las cadenas muy cortas como "sin referencia" (devolver `null`). Opcionalmente reforzar exigiendo coincidencia de palabra completa para entradas cortas. No afecta entradas legítimas como "papa", "yuca", "maiz".

---

## 3. Falsos positivos por substring: un producto distinto se empareja — Severidad: MEDIA

**Archivo:** `src/lib/mercado.ts`

**Problema.** El emparejamiento por substring de la línea 83 (`p.includes(a) || a.includes(p)`) produce falsos positivos que llegan al usuario. Verificado por simulación:

- `buscarReferencia('papayuela')` → **"Papa común"** (la papayuela es una fruta de tierra fría, no un tubérculo).
- `'tomatera'` → Tomate.

Ese match equivocado fija `mercado.nombre`, `precioRefKg`, la posición de mercado y el rango de "precio justo" (analisis.ts líneas 24-50), generando un veredicto y precio engañosos.

**Matiz importante sobre la causa raíz** (por esto la severidad baja de "alta" a "media"): el título original culpa a la rama `a.includes(p)`, pero los dos ejemplos estrella en realidad los produce la **otra** rama, `p.includes(a)`. Verificado: `'papayuela' → 'Papa común'` ocurre por `p.includes('papa')`, y `'tomatera' → 'Tomate'` por `p.includes('tomate')`. El único caso que ejercita `a.includes(p)` es `'pa' → Ahuyama` (vía "zapallo"), que requiere una entrada de 2 caracteres improbable como nombre de producto. Por tanto, **eliminar solo `a.includes(p)` NO arreglaría el caso principal `papayuela`.**

**Corrección.** La causa raíz de `papayuela → Papa común` es el substring crudo contra alias muy cortos ("papa", "col", "mora") en la rama `p.includes(a)`. La solución correcta es **tokenizar por palabras y exigir coincidencia de palabra/alias completo** en lugar de substring crudo en **cualquiera** de las dos direcciones. Restringir solo `a.includes(p)` dejaría intacto el falso positivo principal.

---

## 4. "Precio justo sugerido" degenera a un rango $0–$0 o min=max — Severidad: MEDIA

**Archivo:** `src/lib/analisis.ts`

**Problema.** El precio justo se ancla a `puntoEquilibrio = costoKg`. En `analizar()` (líneas 44-53), `piso = puntoEquilibrio * 1.3`; si no hay referencia de mercado, `precioJustoMin = piso` y `precioJustoMax = piso * 1.3`.

- **Caso $0–$0:** como la guarda de la línea 56 no exige `costoTotal > 0`, con kilos>0, precio>0 y costos en 0 → `costoKg=0` → `piso=0`. Como `utilidad>0` pero `roi=0`, el veredicto es "ajustado" (no "incompleto"), así que `AnalisisPanel` renderiza *"Precio justo sugerido: $ 0 – $ 0/kg"* y `construirRecomendaciones` (línea 240) emite *"Apunta a vender entre $ 0 y $ 0/kg para una ganancia sana."* (Requiere que el cultivo no calce con ninguna referencia, p. ej. "espinaca", "rábano", "apio", "uchuva", que no están en la tabla.)
- **Caso min=max:** con referencia presente y `costoKg` alto tal que `piso > ref.precioKgMax`, las líneas 49-50 dan `precioJustoMin = piso` y `precioJustoMax = max(precioKgMax, piso) = piso`, colapsando a un "rango" de un solo valor (p. ej. "$13.000 – $13.000/kg").

**Corrección.**
1. Tratar `piso <= 0` (costoKg no cargado) como caso sin precio justo: setear `precioJustoMin/Max` a `null` o un flag, y ocultar el bloque `.precio-justo` en `AnalisisPanel` cuando no haya piso válido.
2. En `construirRecomendaciones`, cuando `piso <= 0` omitir la frase "Apunta a vender entre X y Y" (o sustituirla por una guía de cargar costos).
3. Cuando `precioJustoMin === precioJustoMax`, emitir un único valor ("Apunta a $X/kg") en vez de un rango degenerado.
4. Opcional: ampliar la guarda de la línea 56 para exigir `costoTotal > 0` antes de calcular el rango.

---

## 5. "papa" vs "papaya": el resultado correcto depende del orden de la tabla — Severidad: BAJA

**Archivo:** `src/lib/mercado.ts`

**Problema.** Para la consulta `'papa'`, tanto "Papa común" (alias exacto `'papa'`, score `min(4,4)=4`) como "Papaya" (alias `'papaya'` que CONTIENE 'papa' vía `a.includes(p)`, score `min(6,4)=4`) son candidatos con el **mismo** puntaje 4. "Papa común" solo gana porque aparece antes en `REFERENCIAS` (línea 33 vs. línea 46) y la comparación es estricta (`puntaje > mejorPuntaje`, conserva el primero en empate). Si se reordena la tabla, `'papa'` devolvería "Papaya". La causa raíz: `Math.min(a.length, p.length)` no premia la igualdad exacta, así que una coincidencia exacta empata con una parcial contra un alias más largo.

Con el orden **actual** de la tabla, `'papa'` devuelve el resultado correcto; es una fragilidad/robustez latente (un reordenamiento benigno rompería la corrección sin ningún test que lo proteja), no un defecto funcional activo hoy. Por eso severidad baja.

**Corrección.** Priorizar explícitamente la coincidencia exacta de alias. Opción simple (línea 84):

```ts
const puntaje = (p === a ? 1000 : 0) + Math.min(a.length, p.length)
```

O dos fases: primero buscar igualdad exacta de alias en toda la tabla y, solo si no hay, caer a coincidencia por substring. Así `'papa'` siempre resuelve a "Papa común" independientemente del orden. Añadir tests `'papa' → Papa común` y `'papaya' → Papaya`.

---

## 6. El tono del margen marca como "malo" (rojo) el punto de equilibrio (margen = 0) — Severidad: BAJA

**Archivo:** `src/lib/analisis.ts`

**Problema.** Línea 113: `tono = r.margen >= 25 ? 'bueno' : r.margen > 0 ? 'neutro' : 'malo'`. Con margen exactamente 0 (venta justo en el punto de equilibrio) ambas condiciones son falsas (`0 >= 25` y `0 > 0`), así que el tono resulta **'malo' (rojo)**, sugiriendo pérdida cuando no se pierde ni se gana. El detalle de texto (líneas 110-111) usa `r.margen >= 0` y muestra correctamente "te quedan unos $0 de ganancia (margen 0,00 %)". Contradicción texto/color, e inconsistencia interna: la razón hermana "Ganancia por kilo" (línea 104) usa `r.gananciaKg >= 0 ? 'bueno' : 'malo'`, y en el mismo break-even da **verde**; y el veredicto general es "ajustado", no "pérdida". El escenario es realista con enteros que cuadran exacto (p. ej. costo 100.000, kilos 100, precio 1.000 → margen 0). Impacto puramente cosmético, por eso severidad baja.

**Corrección.** Reemplazar el tono de la línea 113 por:

```ts
tono: r.margen >= 25 ? 'bueno' : r.margen >= 0 ? 'neutro' : 'malo'
```

Así margen 0 queda "neutro", alineándose con el detalle, el veredicto "ajustado" y la razón "Ganancia por kilo". Solo el margen estrictamente negativo debería marcarse "malo".

---

## 7. En modo rápido, la recomendación del "mayor costo" es tautológica — Severidad: BAJA

**Archivo:** `src/lib/analisis.ts`

**Problema.** En modo rápido, `Calculadora.tsx` pasa `costosDetalle = [{ concepto: 'Costo total', valor: costoRapido }]`, y `r.costoTotal === costoRapido` exactamente. En `construirRecomendaciones` (líneas 244-253), `conValor` tiene un único elemento y `pct = (mayor.valor / r.costoTotal) * 100 = 100`, siempre `>= 25`. Por tanto SIEMPRE se emite: *"Tu mayor costo es \"Costo total\" (..., 100,00% del total). Reducirlo es lo que más sube tu ganancia."* Mensaje tautológico y sin valor accionable: no indica dónde recortar. Determinista; severidad baja (calidad/UX del texto, no rompe cálculos).

**Corrección.** En `construirRecomendaciones`, omitir el bloque de "mayor costo" cuando hay un solo concepto con valor>0 o cuando ese concepto es "Costo total" (modo rápido). Por ejemplo, solo emitir la recomendación si `conValor.length > 1` (o si el concepto mayor `!== 'Costo total'`), de modo que solo aparezca cuando exista desglose real de costos.

---

## Notas transversales

Dos causas raíz concentran la mayoría de los hallazgos de severidad alta/media:

- **La guarda de "datos incompletos" (`analisis.ts:56`) no considera `costoTotal`.** Esto origina los hallazgos 1 y 4 (y el semáforo rojo con utilidad verde). Ampliarla a `costoTotal <= 0` cierra ambos de un solo cambio.
- **El emparejamiento por substring crudo en `mercado.ts:83-85`, sin longitud mínima ni coincidencia de palabra completa.** Origina los hallazgos 2, 3 y 5. Tokenizar por palabras + exigir coincidencia de palabra/alias completo + umbral de longitud mínima los mitiga todos.

No se recomienda introducir cambios sin tests: añadir casos de referencia (`'papa' → Papa común`, `'papaya' → Papaya`, `'papayuela' → null`, `'a' → null`) y casos de análisis (costos en 0 → "incompleto", break-even → tono "neutro") para fijar el comportamiento corregido.
