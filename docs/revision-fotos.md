# Revisión de las fotos de perfil (avatares) de ARAC

Informe ordenado por severidad (verdicts ajustados tras verificación adversarial). Se confirmaron 5 hallazgos reales: 1 media y 4 bajas. No hay hallazgos de severidad alta tras la revisión.

Resumen:

| # | Severidad | Hallazgo |
|---|-----------|----------|
| 1 | Media | Subida de archivos sin validar tipo ni tamaño a un bucket público |
| 2 | Baja | Avatar sin fallback `onError`: una URL rota deja un icono de imagen quebrada |
| 3 | Baja | Lectura totalmente pública y rutas predecibles por id de usuario |
| 4 | Baja | `perfil.foto` puede no existir si no se corrió la migración SQL |
| 5 | Baja | Sin validación de tipo ni tamaño antes de subir (cliente) |

---

## 1. Subida de archivos sin validar tipo ni tamaño a un bucket público

**Severidad:** Media

**Archivos:**
- `supabase/storage-avatares.sql:11-13`
- `src/lib/db.ts:38-46`
- `src/components/Perfil.tsx:62-68`

**Problema:**
El bucket `avatares` se crea solo con `(id, name, public) = ('avatares', 'avatares', true)`; `file_size_limit` y `allowed_mime_types` quedan en `NULL`, es decir, sin límite. Las 4 políticas RLS de `storage.objects` solo validan `bucket_id` y que la primera carpeta sea `auth.uid()`; ninguna restringe content-type ni tamaño. En el cliente, `subirAvatar` sube con `contentType: file.type`, que es controlable por el atacante vía SDK/devtools usando la anon key, y `accept="image/*"` del `<input>` es solo una pista de UI trivialmente evadible. Resultado: un usuario autenticado puede subir a SU propia carpeta cualquier archivo: un blob enorme (abuso de almacenamiento y costos) o un `.html`/`.svg` con content-type arbitrario.

Matiz respecto al reporte original: el XSS almacenado "bajo el dominio del proyecto" está sobredimensionado, porque Supabase sirve los objetos públicos desde su subdominio de storage (`*.supabase.co`), aislado del origen de la app y con cabeceras de seguridad; el HTML/SVG no se ejecuta en el origen de la aplicación ni accede a su sesión. El impacto real verificable es: subida de archivos arbitrarios sin límite de tamaño (DoS / coste) y hosting de contenido HTML/SVG para phishing sobre un dominio cloud de aspecto confiable, todo limitado a la propia carpeta del usuario.

**Corrección:**
Restringir en el bucket: en el `insert` de `storage.buckets` añadir `file_size_limit` (p. ej. 2-5 MB) y `allowed_mime_types := array['image/png','image/jpeg','image/webp']`; si el bucket ya existe, `update storage.buckets set file_size_limit=..., allowed_mime_types=... where id='avatares'`. Validar tipo y tamaño en el cliente (`subirAvatar`/`cambiarFoto`) ANTES de subir y no confiar en `file.type` para `contentType` (validar contra una lista blanca). Idealmente reforzar también en la política RLS de INSERT/UPDATE limitando por extensión de `name`. Considerar servir avatares vía URL firmada o un dominio aislado.

---

## 2. Avatar sin fallback `onError`: una URL rota deja un icono de imagen quebrada

**Severidad:** Baja

**Archivo:** `src/components/Avatar.tsx`

**Problema:**
`Avatar` renderiza `<img src={foto}>` (línea 17) sin manejador `onError`. El fallback a la inicial (líneas 20-28) solo se activa cuando `foto` es falsy (null/vacío), NO cuando una URL no vacía falla al cargar; en ese caso el navegador muestra el icono de imagen rota. Esto afecta a los dos lugares que usan `Avatar` (cabecera en `App.tsx` y `Perfil.tsx`). Es notable porque el proyecto ya tiene este patrón resuelto en `Logo.tsx` (`useState` para `error` + `onError={() => setError(true)}`), pero `Avatar` no lo replica.

**Corrección:**
Convertir `Avatar` en componente con estado: `useState` para `error` y `onError` en el `<img>` que active el fallback a la inicial. Resetear ese estado cuando cambie la prop `foto` (p. ej. `useEffect` o `key={foto}`). Así una foto que no carga degrada con elegancia a la inicial, igual que cuando `foto` es null.

---

## 3. Lectura totalmente pública y rutas predecibles por id de usuario

**Severidad:** Baja

**Archivos:**
- `supabase/storage-avatares.sql:17-19`
- `src/lib/db.ts:39`

**Problema:**
La política de SELECT es `using (bucket_id = 'avatares')` sin cláusula `to authenticated` (a diferencia de las de insert/update/delete), por lo que aplica a todos los roles, incluido `anon`. Combinado con la ruta fija y determinística `${userId}/avatar` y `getPublicUrl`, cualquiera que conozca el `auth.uid` de un usuario puede construir la URL pública y descargar su foto sin restricción.

Matiz: la afirmación de que las URLs son "enumerables/adivinables" está exagerada — la ruta se indexa por `auth.uid()`, un UUID v4 aleatorio (128 bits), no enumerable secuencialmente ni adivinable por fuerza bruta; hay que conocer de antemano el UUID de la víctima. Es un patrón de diseño intencional, documentado (el comentario del SQL dice "Cualquiera puede VER los avatares (bucket público)") y convencional para fotos de perfil. Es una observación de hardening, no una vulnerabilidad explotable.

**Corrección:**
Si las fotos deben ser semi-privadas, usar bucket privado + `getSignedUrl` en vez de `getPublicUrl`, o añadir un componente aleatorio a la ruta (p. ej. `${userId}/${randomId}.webp`) guardando la ruta en `perfiles.foto`. Si la lectura pública es intencional, dejarlo documentado explícitamente como decisión.

---

## 4. `perfil.foto` puede no existir si no se corrió la migración SQL

**Severidad:** Baja

**Archivo:** `src/lib/db.ts` (y `src/components/Perfil.tsx`)

**Problema:**
`obtenerPerfil` usa `.select('*')`, por lo que si la columna `foto` no existe (migración `storage-avatares.sql` no ejecutada), `perfil.foto` será `undefined` y `Avatar` lo trata como sin foto (correcto). Sin embargo, `guardarFotoPerfil` hace `.update({ foto })` contra esa columna; si no existe, Supabase devuelve error. En `Perfil.cambiarFoto`, `subirAvatar` (subida a Storage) se ejecuta ANTES de `guardarFotoPerfil`, y todo está dentro de un try/catch que muestra "No se pudo subir la foto" sin distinguir qué paso falló. Resultado: si la subida a Storage tiene éxito pero el UPDATE falla por columna inexistente, el mensaje es engañoso y queda un objeto en el bucket. (No se acumulan huérfanos: por `upsert:true` la ruta es fija `${userId}/avatar`, así que los reintentos reutilizan el mismo objeto.)

**Corrección:**
No es bloqueante en producción si la migración se ejecuta. Para robustez: documentar claramente que el SQL es prerequisito, o separar el estado "subida a Storage OK" vs "guardado en perfil OK" para no reportar un falso fallo de subida cuando lo que falla es el UPDATE de la columna.

---

## 5. Sin validación de tipo ni tamaño antes de subir (cliente)

**Severidad:** Baja

**Archivo:** `src/components/Perfil.tsx`

**Problema:**
`cambiarFoto` toma `e.target.files?.[0]` y lo pasa directo a `subirAvatar` sin validación de tipo ni tamaño. El input declara `accept="image/*"`, pero eso es solo una sugerencia del selector del navegador. En `src/lib/db.ts`, `subirAvatar` sube el `File` tal cual con `contentType: file.type`, sin verificar que sea imagen ni imponer límite de tamaño. Una foto de varios MB consume cuota y ancho de banda, lo que afecta especialmente al público objetivo rural con conexión lenta.

(Solapa con el hallazgo #1, pero aquí el foco es UX/calidad/coste, no la seguridad del bucket.)

**Corrección:**
Validar antes de subir: `file.type.startsWith('image/')` y un tope de tamaño (p. ej. `file.size <= 5 MB`), mostrando el estado `error` con un mensaje claro si no cumple. Opcionalmente redimensionar/comprimir en el cliente antes de subir para usuarios con poca conexión.
