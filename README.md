# va·pa·mesa 🌱

Calculadora de **rentabilidad de cultivos** para productores del campo.

El campesino entra por un link, escribe su cultivo (ej. *Tomate*), los kilos
cosechados, el precio de venta y los costos, y al instante ve si le es rentable:
costo por kilo, ganancia por kilo, ingresos, utilidad, margen, ROI, punto de
equilibrio y un **semáforo** (Baja / Media / Alta) con un mensaje claro de qué
hacer.

> Esta es la **primera versión, sin base de datos**. El registro de cultivos se
> guarda en el propio dispositivo del productor (localStorage), así queda el
> historial mes a mes sin necesidad de servidor todavía.

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
    storage.ts        Guardado del registro en el dispositivo (localStorage).
  components/
    Calculadora.tsx   Formulario + cálculo en vivo.
    Resumen.tsx       Panel con métricas, semáforo y mensaje de rentabilidad.
    Semaforo.tsx      Indicador Baja / Media / Alta.
    Registro.tsx      Tabla comparativa de cultivos guardados.
    CampoNumero.tsx   Campo numérico reutilizable.
  types.ts            Tipos compartidos.
```

## ¿Qué sigue? (cuando se quiera)

- Perfiles de productor y base de datos real (Supabase) para sincronizar entre
  dispositivos. El esquema de tablas ya está pensado (productores, cultivos,
  costos, producción).
- Subir fotos del cultivo.
- Reportes por mes / temporada.

## Ajustes rápidos

- **Umbrales del semáforo:** `UMBRAL_ROI_ALTA` y `UMBRAL_ROI_MEDIA` en
  [`src/lib/calculations.ts`](src/lib/calculations.ts).
- **Margen objetivo del precio sugerido:** `MARGEN_OBJETIVO` (por defecto 30 %)
  en el mismo archivo.
