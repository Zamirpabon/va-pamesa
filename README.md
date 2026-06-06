# va·pa·mesa 🌱

Calculadora de **rentabilidad de cultivos** para productores del campo.

El campesino entra por un link, escribe su cultivo (ej. *Tomate*), los kilos
cosechados, el precio de venta y los costos, y al instante ve si le es rentable:
costo por kilo, ganancia por kilo, ingresos, utilidad, margen, ROI, punto de
equilibrio y un **semáforo** (Baja / Media / Alta) con un mensaje claro de qué
hacer.

> La app guarda los cultivos en la nube con **Supabase** y cada productor entra
> con su cuenta (hay también un rol **admin** con dashboard). Configurar
> `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` es **obligatorio** para que
> funcione; sin eso el sitio solo muestra la pantalla de configuración. Ver la
> sección [Base de datos y cuentas (Supabase)](#base-de-datos-y-cuentas-supabase).

## Cómo correrlo

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install     # instala las dependencias (solo la primera vez)
npm run dev     # abre el modo desarrollo en http://localhost:5173
```

Para generar la versión final lista para subir a la nube:

```bash
npm run build   # crea la carpeta dist/
npm run preview # prueba localmente esa versión final
```

## Cómo subirlo a la nube (para tener el link)

Como es un sitio estático, se sube en minutos. La opción más fácil:

- **Netlify Drop:** entra a <https://app.netlify.com/drop> y arrastra la carpeta
  `dist/` (la que genera `npm run build`). Te da un link al instante.
- **Vercel:** conecta el repositorio en <https://vercel.com>. Detecta Vite solo;
  build = `npm run build`, carpeta de salida = `dist`.

## Estructura

```
src/
  lib/
    calculations.ts   Fórmulas: costo total, costo/kg, ingresos, utilidad, ROI, etc.
    costos.ts         Catálogo de campos de costo (insumos, mano de obra, otros).
    format.ts         Formato en pesos colombianos y porcentajes.
    supabase.ts       Cliente de Supabase (lee las variables VITE_SUPABASE_*).
    db.ts             Lectura/escritura de cultivos y perfiles en Supabase.
  components/
    Calculadora.tsx   Formulario + cálculo en vivo.
    Resumen.tsx       Panel con métricas, semáforo y mensaje de rentabilidad.
    Semaforo.tsx      Indicador Baja / Media / Alta.
    Registro.tsx      Tabla comparativa de cultivos guardados.
    CampoNumero.tsx   Campo numérico reutilizable.
  types.ts            Tipos compartidos.
```

## ¿Qué sigue? (cuando se quiera)

- (Hecho ✓) Perfiles de productor, base de datos en Supabase y rol admin con
  dashboard.
- Subir fotos del cultivo.
- Reportes por mes / temporada.

## Ajustes rápidos

- **Umbrales del semáforo:** `UMBRAL_ROI_ALTA` y `UMBRAL_ROI_MEDIA` en
  [`src/lib/calculations.ts`](src/lib/calculations.ts).
- **Margen objetivo del precio sugerido:** `MARGEN_OBJETIVO` (por defecto 30 %)
  en el mismo archivo.

## Base de datos y cuentas (Supabase)

La app guarda los cultivos en la nube y cada productor entra con su cuenta.
Hay además un rol **admin** con un dashboard que ve a todos los productores.

### 1. Crear el proyecto en Supabase
1. Entra a <https://supabase.com> y crea un proyecto (gratis).
2. Ve a **SQL Editor → New query**, pega TODO el archivo
   [`supabase/schema.sql`](supabase/schema.sql) y dale **Run**. Eso crea las
   tablas, la seguridad por filas (RLS) y los disparadores.

### 2. Conectar la app con tus llaves
1. En Supabase: **Project Settings → API**. Copia **Project URL** y la llave
   **anon public**.
2. Copia `.env.example` como `.env` y pega esos dos valores.
3. `npm run dev` y listo: ya puedes registrarte.

> Para que los campesinos entren sin pasos extra, en **Authentication → Sign In /
> Providers → Email** puedes **desactivar "Confirm email"**. Así entran apenas se
> registran, sin tener que confirmar correo.

### 3. Volver admin a alguien
Después de que la persona se registre, en **SQL Editor**:

```sql
update public.perfiles set rol = 'admin'
where id = (select id from auth.users where email = 'TU-CORREO@ejemplo.com');
```

Ese usuario verá la pestaña **Admin** con el dashboard de todos.

### 4. Variables en Cloudflare (para el sitio en la nube)
En tu proyecto de Cloudflare → **Settings → Variables and Secrets** (variables
del build), agrega:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Vuelve a desplegar (o haz un `git push`) para que tomen efecto.

### 5. Que la base no se duerma (keep-alive)
El plan gratis de Supabase pausa el proyecto tras 7 días sin actividad. Ya viene
incluido un cron de GitHub Actions
([`.github/workflows/keep-supabase-alive.yml`](.github/workflows/keep-supabase-alive.yml))
que le manda una consulta diaria. Solo agrega en GitHub → repo → **Settings →
Secrets and variables → Actions** dos *secrets*:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

> Nota: GitHub apaga los cron de repos sin movimiento por 60 días. Con que de vez
> en cuando subamos cambios se mantiene activo. Alternativa: un cron externo
> (cron-job.org) apuntando a `…/rest/v1/rpc/ping`.
