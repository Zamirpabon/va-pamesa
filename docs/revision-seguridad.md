# Revisión de seguridad — va-pamesa

Informe de hallazgos **confirmados** (verificados como reales contra el código). Ordenados por severidad: crítica primero.

| # | Severidad | Hallazgo | Archivo |
|---|-----------|----------|---------|
| 1 | Crítica | `wrangler.jsonc` no ejecuta build: las variables `VITE_` nunca entran al bundle | `wrangler.jsonc` |
| 2 | Media | `getSession()` sin manejo de error deja la app atascada en la pantalla de carga | `src/auth/AuthProvider.tsx` |
| 3 | Media | Rechazo de `eliminarCultivo` no capturado: error silencioso y promesa no manejada | `src/hooks/useMisCultivos.ts` |
| 4 | Media | El formulario de Perfil no se re-sincroniza tras `refrescarPerfil`: muestra datos obsoletos | `src/components/Perfil.tsx` |
| 5 | Baja | Condición de carrera en `cargarPerfil`: puede fijar un perfil/rol obsoleto o tras desmontar | `src/auth/AuthProvider.tsx` |
| 6 | Baja | Calculadora no resetea el formulario ni bloquea reenvío: permite duplicados | `src/components/Calculadora.tsx` |
| 7 | Baja | README internamente contradictorio: dice "sin base de datos / localStorage" pero el deploy es con Supabase | `README.md` |
| 8 | Baja | `createClient` no valida el contenido: una mala configuración no se distingue de "falta configuración" | `src/lib/supabase.ts` |
| 9 | Baja | `handle_new_user` sin manejo de errores ante conflictos de constraint | `supabase/schema.sql` |

---

## 1. `wrangler.jsonc` no ejecuta build: las variables `VITE_` nunca entran al bundle

- **Severidad:** Crítica
- **Archivo:** `wrangler.jsonc`

**Problema.** `wrangler.jsonc` solo declara assets estáticos (`"assets": { "directory": "./dist", "not_found_handling": "single-page-application" }`) sin ningún paso ni comando de build. Un `wrangler deploy` sube tal cual lo que haya en `dist/` y **nunca** ejecuta `npm run build`. Vite incrusta los valores de `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` en **tiempo de build** (quedan como literales inlineados en el JS final); no se leen en runtime. El bundle presente (`dist/assets/index-CWiQi7XE.js`) no contiene ninguna URL real de Supabase ni JWT anon (Vite ya reemplazó `import.meta.env`, 0 ocurrencias). Por tanto, definir las variables en Cloudflare no basta: con deploy por CLI el build ocurre en local (las vars de Cloudflare nunca se usan), y no existe ningún build command conectado ni workflow de deploy que las consuma; además `dist/` está en `.gitignore`. Resultado: el sitio en vivo arranca con `hayConfigSupabase=false` y muestra la pantalla `ConfigFaltante` en producción (`App.tsx:16`), sin login ni base de datos.

> Matiz: el README (líneas 104-106) y `ConfigFaltante.tsx` sí hablan de "variables del build", así que el error real no es el etiquetado runtime-vs-build, sino que **no existe ningún paso de build conectado** que consuma esas build variables.

**Corrección recomendada.** Elegir y cablear un mecanismo de build explícito:
- **(a)** Cloudflare Workers Builds / Pages git-conectado con build command `npm run build` y output `dist`, definiendo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como **build variables** del entorno Production (añadir un bloque `"build": { "command": "npm run build" }` o configurarlo en el dashboard); **o**
- **(b)** construir localmente con un `.env` real y desplegar el `dist/` ya compilado (`npm run build && npx wrangler deploy`).

Corregir el README sección 4 para aclarar que las `VITE_` deben existir **en el momento de la compilación** (build variables) y que se requiere un paso de build real; advertir que `dist/` está gitignoreado, por lo que un deploy git-conectado **sin** build command no subiría assets.

---

## 2. `getSession()` sin manejo de error deja la app atascada en la pantalla de carga

- **Severidad:** Media
- **Archivo:** `src/auth/AuthProvider.tsx`

**Problema.** En el `useEffect`, `supabase.auth.getSession().then(...)` es la **única** ruta que pone `setCargando(false)` en el arranque normal y **no** tiene `.catch()`. Si `getSession()` rechaza (localStorage inaccesible en modo privado/almacenamiento bloqueado, datos de sesión corruptos, o un rechazo inesperado del SDK), el callback `.then` nunca corre y `setCargando(false)` **nunca** se llama. El otro `setCargando(false)` solo se ejecuta cuando `!supabase`, y el callback de `onAuthStateChange` no toca `cargando`. El Shell (`src/App.tsx:28`) evalúa `if (cargando) return <Cargando texto="Entrando…" />` y queda mostrando el spinner indefinidamente, sin recuperación ni mensaje de error.

> Matiz que baja la severidad de alta a media: `getSession()` lee principalmente de localStorage y está diseñado para devolver errores dentro de `data` en lugar de rechazar, así que el rechazo no ocurre en el flujo común; el rationale de "fallo de red" es débil. Aun así puede rechazar en escenarios reales y dejar un fallo sin salida.

**Corrección recomendada.** Encadenar manejo de error que garantice apagar el spinner. Reemplazar el bloque por:

```ts
supabase.auth.getSession()
  .then(async ({ data }) => {
    if (!activo) return
    setSession(data.session)
    await cargarPerfil(data.session?.user?.id ?? null)
  })
  .catch(() => {})
  .finally(() => { if (activo) setCargando(false) })
```

Opcionalmente añadir un estado de error para mostrar un mensaje de reintento en lugar de solo apagar el spinner y caer a la pantalla de login.

---

## 3. Rechazo de `eliminarCultivo` no capturado: error silencioso y promesa no manejada

- **Severidad:** Media
- **Archivo:** `src/hooks/useMisCultivos.ts`

**Problema.** `eliminar` hace `await eliminarCultivo(id)` y **solo después** aplica el filtrado optimista. `eliminarCultivo` (`src/lib/db.ts`) lanza si Supabase devuelve error. El hook no envuelve esto en try/catch ni usa el estado `error`. En `Registro.tsx:75` el handler `onClick={() => onEliminar(c.id)}` descarta la promesa sin `.catch`, y `App.tsx:90` pasa `eliminar` directo a `onEliminar` sin envolver. Ante un fallo de red o RLS: (1) se produce una **Unhandled Promise Rejection**, (2) el filtro optimista nunca se ejecuta porque está después del throw, así que la fila permanece, y (3) el usuario no recibe ningún feedback; el botón parece muerto. Contrasta con `agregar`, cuyo consumidor `Calculadora.tsx` sí captura el throw y muestra estado `error`.

**Corrección recomendada.** Envolver `eliminar` en try/catch: setear `error` y reconciliar el estado (p. ej. `await recargar()`), de modo que la promesa quede manejada y la lista refleje el estado real del servidor. Dar feedback visible en `Registro.tsx`.

```ts
const eliminar = useCallback(async (id: string) => {
  try {
    await eliminarCultivo(id)
    setCultivos((prev) => prev.filter((c) => c.id !== id))
  } catch {
    setError('No pudimos eliminar el cultivo. Intenta de nuevo.')
    await recargar()
  }
}, [recargar])
```

Y exponer/usar `error` en `Registro` para mostrar el mensaje al productor.

---

## 4. El formulario de Perfil no se re-sincroniza tras `refrescarPerfil`: muestra datos obsoletos

- **Severidad:** Media
- **Archivo:** `src/components/Perfil.tsx`

**Problema.** Los inputs se inicializan una sola vez con `useState(perfil?.nombre ?? '')`, `useState(perfil?.finca ?? '')`, `useState(perfil?.telefono ?? '')`. Tras guardar, `guardar()` llama `await refrescarPerfil()`, que re-fetchea el perfil del servidor (`select('*')`) y hace `setPerfil` con la fila persistida. Pero **no hay** ningún `useEffect` ni `key={perfil.id}` que re-sincronice `nombre`/`finca`/`telefono` con el nuevo perfil del contexto. Por semántica de React, `useState` ignora cambios posteriores de su valor inicial, así que el formulario sigue mostrando lo tecleado, no la fuente de verdad. Si la BD normaliza valores (trigger, `'' -> null`, recortes, casing) el form queda obsoleto hasta un remontaje. Subcaso latente: si el componente se montara con `perfil` aún `null` (el guard `if (!perfil) return null` está **debajo** de los `useState`), capturaría `''` y no se rellenaría al cargar el perfil.

**Corrección recomendada.** Añadir sincronización del estado local con el perfil del contexto.

- **Opción A (useEffect — mínima):**

```ts
import { useEffect } from 'react'
useEffect(() => {
  setNombre(perfil?.nombre ?? '')
  setFinca(perfil?.finca ?? '')
  setTelefono(perfil?.telefono ?? '')
}, [perfil?.id, perfil?.nombre, perfil?.finca, perfil?.telefono])
```

- **Opción B (remontaje):** aplicar `<Perfil key={perfil.id} />` desde `App.tsx`, o extraer el formulario a un subcomponente con `key`.

La opción A resuelve tanto el caso post-`refrescarPerfil` como el de montaje con `perfil` aún `null`.

---

## 5. Condición de carrera en `cargarPerfil`: puede fijar un perfil/rol obsoleto o tras desmontar

- **Severidad:** Baja
- **Archivo:** `src/auth/AuthProvider.tsx`

**Problema.** `cargarPerfil` hace `setPerfil(await obtenerPerfil(userId))` **sin** volver a comprobar el flag `activo` tras el `await`. El chequeo `if (!activo) return` vive solo en los callbacks externos, que corren de forma síncrona **antes** del await. (1) Si el componente se desmonta mientras `obtenerPerfil` está en vuelo, la cleanup pone `activo=false` pero `setPerfil` se ejecuta igual sobre un componente desmontado. (2) `onAuthStateChange` llama a `cargarPerfil` **sin** `await`, por lo que dos eventos seguidos (`INITIAL_SESSION` + `SIGNED_IN`, o cambio de usuario) lanzan dos `obtenerPerfil` en paralelo sin token de orden ni comparación de `userId`; gana la respuesta que termine última (last-write-wins no determinista), desincronizando `perfil` y por tanto `esAdmin`.

> `esAdmin` solo controla la visibilidad de la pestaña/dashboard Admin en la UI (los datos están protegidos por RLS), por eso la severidad es baja; el efecto es mostrar/ocultar Admin de forma incorrecta momentáneamente.

**Corrección recomendada.** Hacer que `cargarPerfil` reciba/capture el flag `activo` (o un token/contador de petición) y lo revise justo antes de `setPerfil`:

```ts
async function cargarPerfil(userId, sigueActivo) {
  const p = await obtenerPerfil(userId)
  if (!sigueActivo()) return
  setPerfil(p)
}
// pasando () => activo desde los callbacks
```

Adicionalmente, comparar el `userId` de la respuesta con el de la sesión vigente antes de aplicarla, e idealmente `await` en la llamada de `onAuthStateChange` o un contador de secuencia que descarte respuestas obsoletas (last-write-wins por `userId`).

---

## 6. Calculadora no resetea el formulario ni bloquea reenvío tras guardar: permite duplicados

- **Severidad:** Baja
- **Archivo:** `src/components/Calculadora.tsx`

**Problema.** Tras un guardado exitoso, `estado` pasa a `'ok'` pero los campos del formulario conservan los mismos valores y `guardar` nunca resetea ningún campo. `puedeGuardar = producto.trim() !== '' && kilos > 0` sigue siendo `true` sin tocar nada. El botón tiene `disabled={!puedeGuardar || estado === 'guardando'}`; en estado `'ok'` eso evalúa a `false`, así que el botón queda **habilitado** y clickeable (aunque su etiqueta diga "✓ Guardado en tu registro"). Un segundo clic ejecuta `guardar()` con el mismo objeto → `onGuardar` → `agregar` → `agregarCultivo`, que hace un `.insert()` plano sin constraint único, upsert ni clave de idempotencia en ninguna capa. Cada clic crea una fila nueva, produciendo un cultivo **duplicado** con datos idénticos sin advertencia.

> Severidad baja: requiere acción repetida del usuario, solo genera datos redundantes (que se pueden borrar) y no cruza ninguna frontera de seguridad ni causa pérdida/corrupción de datos.

**Corrección recomendada.** Mantener el botón deshabilitado también en estado `'ok'` hasta que el usuario modifique algún campo:

```tsx
disabled={!puedeGuardar || estado === 'guardando' || estado === 'ok'}
```

(el `onChange` que pasa a `'idle'` lo re-habilitaría). Y/o resetear los campos del formulario (al menos `producto` y `kilos`) tras el éxito. Como defensa adicional contra dobles inserciones, considerar idempotencia o un constraint en la capa de datos en `agregarCultivo` (`db.ts`).

---

## 7. README internamente contradictorio: dice "sin base de datos / localStorage" pero el deploy es con Supabase

- **Severidad:** Baja
- **Archivo:** `README.md`

**Problema.** Las líneas 11-13 afirman "primera versión, sin base de datos... se guarda en el propio dispositivo (localStorage)... sin necesidad de servidor todavía", y la sección Estructura (línea 48) lista "`storage.ts` Guardado del registro en el dispositivo (localStorage)". Sin embargo, el resto del README (líneas 73-123) documenta Supabase: cuentas, RLS, rol admin, deploy en Cloudflare con `VITE_SUPABASE_*` y keep-alive. `src/lib/storage.ts` fue eliminado (`git status`: `deleted`) y no queda ninguna referencia a `localStorage` en `src/`. La persistencia ahora es Supabase (`src/lib/db.ts`, `src/lib/supabase.ts`). La contradicción confunde a quien despliega: puede pensar que no necesita configurar Supabase y dejar el sitio en vivo sin backend (mostrando `ConfigFaltante`).

> Severidad baja: es exactitud de documentación, no un fallo de seguridad ni de correctitud del código; además la app falla de forma segura (pantalla clara con instrucciones).

**Corrección recomendada.** Actualizar `README.md`:
1. Reemplazar el bloque de cita (líneas 11-13) para indicar que la persistencia es Supabase en la nube y que configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` es **obligatorio** para que el sitio funcione (de lo contrario solo se verá `ConfigFaltante`).
2. En la sección Estructura (línea 48), eliminar la entrada de `storage.ts` y sustituirla por las rutas reales: `supabase.ts` (cliente de Supabase) y `db.ts` (lectura/escritura de cultivos en Supabase).
3. Opcionalmente, ajustar la sección "¿Qué sigue?" (líneas 60-62) que aún menciona Supabase como trabajo futuro, ya que ya está implementado.

---

## 8. `createClient` no valida el contenido: una mala configuración no se distingue de "falta configuración"

- **Severidad:** Baja
- **Archivo:** `src/lib/supabase.ts`

**Problema.** `supabase.ts` valida solo la **presencia** de las dos variables (`hayConfigSupabase = Boolean(url && anonKey)`), no su **contenido**. Un `VITE_SUPABASE_URL` presente-pero-malformado (typo, sin `https://`, sin `.supabase.co`) pasa `Boolean(url && anonKey) === true` y se invoca `createClient` con datos basura; supabase-js no valida el formato de URL al construir, así que la app renderiza y la autenticación falla luego con errores de red opacos en vez de un diagnóstico claro. Es un gap de diagnosticabilidad real pero menor.

> Aclaración sobre el hallazgo original: el deploy parcial con **una sola** variable da `hayConfigSupabase=false` (cortocircuito `&&`) y muestra correctamente `ConfigFaltante` — ese subcaso no es un problema. La parte real es la **ausencia de validación de contenido**.

**Corrección recomendada.** Validar el contenido, no solo la presencia, y distinguir "no configurado" de "configurado-pero-inválido":

```ts
const urlValida = !!url && /^https:\/\/.+\.supabase\.co\/?$/.test(url)
const keyValida = !!anonKey && anonKey.split('.').length === 3 // forma de JWT
const hayConfigSupabase = urlValida && keyValida
```

Cuando `(url || anonKey)` estén presentes pero alguno sea inválido, emitir un `console.error` claro (p. ej. "Supabase mal configurado: VITE_SUPABASE_URL inválida") para acelerar el diagnóstico de deploys rotos en Cloudflare, sin romper el build. Opcionalmente, diferenciar el mensaje de `ConfigFaltante` entre "falta config" y "config inválida".

---

## 9. `handle_new_user` sin manejo de errores ante conflictos de constraint

- **Severidad:** Baja
- **Archivo:** `supabase/schema.sql`

**Problema.** `handle_new_user()` es `SECURITY DEFINER` con `search_path` fijo (correcto) y fija `rol='productor'` de forma literal, por lo que la metadata del usuario **no** puede inyectar `rol='admin'` (esto está bien resuelto). El riesgo residual es operativo: el bloque `begin...end` no tiene manejador `exception` ni cláusula `on conflict`. Ante una violación de constraint (p. ej. un perfil con ese `id` ya existente) el insert lanza excepción.

> Corrección de impacto frente al hallazgo original: el trigger es `after insert on auth.users` y corre dentro de la **misma transacción** del signup; si lanza excepción, **toda** la transacción (incluida la fila de `auth.users`) hace rollback. Por tanto **no** deja un usuario huérfano "en auth.users sin perfil"; el efecto real es que el registro **falla por completo** en ese caso borde. En el flujo normal de Supabase los UUID se generan frescos por registro, así que un conflicto de PK solo ocurre en escenarios atípicos (restauración/reimportación de datos, operaciones manuales).

**Corrección recomendada.** Añadir `on conflict (id) do nothing` al insert de `handle_new_user()` para alinearlo con la idempotencia que promete la cabecera del esquema y evitar fallos de alta ante reimportaciones o ids preexistentes:

```sql
insert into public.perfiles (id, rol, ...)
values (new.id, 'productor', ...)
on conflict (id) do nothing;
```

Esto garantiza que el alta nunca quede a medias. No es escalada de privilegios; es endurecimiento operativo de un caso borde.

---

## Resumen

Se confirmaron **9 hallazgos** reales: **1 crítica**, **3 medias** y **5 bajas**.

- **Acción más urgente (crítica):** cablear un paso de build real que consuma las variables `VITE_SUPABASE_*` (hallazgo 1); sin esto, el sitio en vivo no tiene backend.
- **Robustez/UX (medias):** manejar el rechazo de `getSession()` para no atascar la carga (2), capturar el rechazo de `eliminarCultivo` y dar feedback (3), y re-sincronizar el formulario de Perfil con el contexto (4).
- **Endurecimiento (bajas):** condición de carrera en `cargarPerfil` (5), bloqueo de reenvío en Calculadora para evitar duplicados (6), corregir la documentación contradictoria del README (7), validar el contenido de la config de Supabase (8), y añadir `on conflict do nothing` en `handle_new_user` (9).

Nota positiva: el control de privilegios está bien resuelto — `handle_new_user` fija `rol='productor'` literalmente (la metadata no puede inyectar `admin`), `esAdmin` solo afecta la UI y los datos están protegidos por RLS.
