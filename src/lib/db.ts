import { supabase } from './supabase'
import type { CultivoRow, DatosCultivo, Perfil } from '../types'

// Devuelve el cliente o lanza un error claro si no está configurado.
function cli() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

// ── Perfil ─────────────────────────────────────────────────

export async function obtenerPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await cli()
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as Perfil | null
}

export async function actualizarPerfil(
  userId: string,
  parche: Pick<Perfil, 'nombre' | 'telefono' | 'finca'>,
): Promise<Perfil> {
  const { data, error } = await cli()
    .from('perfiles')
    .update(parche)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data as Perfil
}

// Sube la foto de perfil al bucket "avatares" (carpeta = id del usuario) y
// devuelve la URL pública (con cache-bust para que se vea al instante).
export async function subirAvatar(userId: string, file: File): Promise<string> {
  const ruta = `${userId}/avatar`
  const { error } = await cli()
    .storage.from('avatares')
    .upload(ruta, file, { upsert: true, cacheControl: '3600', contentType: file.type })
  if (error) throw error
  const { data } = cli().storage.from('avatares').getPublicUrl(ruta)
  return `${data.publicUrl}?t=${Date.now()}`
}

// Guarda la URL de la foto en el perfil del usuario.
export async function guardarFotoPerfil(userId: string, foto: string): Promise<Perfil> {
  const { data, error } = await cli()
    .from('perfiles')
    .update({ foto })
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data as Perfil
}

// ── Cultivos del productor ─────────────────────────────────

export async function listarMisCultivos(userId: string): Promise<CultivoRow[]> {
  const { data, error } = await cli()
    .from('cultivos')
    .select('*')
    .eq('productor_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CultivoRow[]
}

export async function agregarCultivo(
  userId: string,
  datos: DatosCultivo,
): Promise<CultivoRow> {
  const { data, error } = await cli()
    .from('cultivos')
    .insert({ ...datos, productor_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data as CultivoRow
}

export async function eliminarCultivo(id: string): Promise<void> {
  const { error } = await cli().from('cultivos').delete().eq('id', id)
  if (error) throw error
}

// ── Vistas de administrador (RLS deja ver todo solo al admin) ─

export async function listarTodosPerfiles(): Promise<Perfil[]> {
  const { data, error } = await cli()
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Perfil[]
}

export async function listarTodosCultivos(): Promise<CultivoRow[]> {
  const { data, error } = await cli()
    .from('cultivos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CultivoRow[]
}
