import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// ¿Están configuradas las variables de entorno de Supabase?
export const hayConfigSupabase = Boolean(url && anonKey)

// Diagnóstico (no bloquea): avisa si la URL parece mal escrita, para distinguir
// un deploy "sin configurar" de uno "mal configurado".
if (url && !/^https:\/\//.test(url)) {
  console.error(
    'va-pamesa: VITE_SUPABASE_URL debería empezar con "https://". Revisa la configuración de Supabase.',
  )
}

// Cliente único de Supabase. Si faltan las variables, queda en null y la app
// muestra una pantalla de configuración (en vez de romper el build).
export const supabase: SupabaseClient | null = hayConfigSupabase
  ? createClient(url as string, anonKey as string)
  : null
