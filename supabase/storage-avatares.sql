-- ============================================================
-- ARAC — Fotos de perfil (avatares con Supabase Storage)
-- Ejecútalo COMPLETO en: Supabase → SQL Editor → Run.
-- Es seguro volver a correrlo (idempotente).
-- ============================================================

-- 1) Columna para la URL de la foto en el perfil
alter table public.perfiles add column if not exists foto text;

-- 2) Bucket público de avatares
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

-- 3) Políticas del bucket -------------------------------------
-- Cualquiera puede VER los avatares (bucket público).
drop policy if exists "avatares_lectura" on storage.objects;
create policy "avatares_lectura" on storage.objects
  for select using (bucket_id = 'avatares');

-- Cada usuario SUBE solo en su propia carpeta (carpeta = su id).
drop policy if exists "avatares_subir" on storage.objects;
create policy "avatares_subir" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cada usuario ACTUALIZA solo su propia carpeta.
drop policy if exists "avatares_actualizar" on storage.objects;
create policy "avatares_actualizar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cada usuario BORRA solo su propia carpeta.
drop policy if exists "avatares_borrar" on storage.objects;
create policy "avatares_borrar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );
