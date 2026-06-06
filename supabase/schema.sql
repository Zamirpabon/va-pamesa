-- ============================================================
-- va·pa·mesa — Esquema de base de datos (Supabase / Postgres)
-- Ejecútalo COMPLETO en: Supabase → SQL Editor → New query → Run
-- Es seguro volver a correrlo (idempotente).
-- ============================================================

-- 1) PERFILES — un perfil por usuario de autenticación --------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null default '',
  telefono   text,
  finca      text,
  rol        text not null default 'productor' check (rol in ('productor','admin')),
  created_at timestamptz not null default now()
);

-- 2) CULTIVOS — cada registro que guarda el productor ---------
create table if not exists public.cultivos (
  id              uuid primary key default gen_random_uuid(),
  productor_id    uuid not null references public.perfiles(id) on delete cascade,
  producto        text not null,
  area_m2         numeric not null default 0,
  ciclo_semanas   numeric not null default 0,
  unidades        numeric not null default 0,
  kilos           numeric not null default 0,
  precio_venta_kg numeric not null default 0,
  costos          jsonb   not null default '{}'::jsonb,
  costo_total     numeric not null default 0,
  ingresos        numeric not null default 0,
  utilidad        numeric not null default 0,
  margen          numeric not null default 0,
  roi             numeric not null default 0,
  nivel           text    not null default 'baja' check (nivel in ('alta','media','baja')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_cultivos_productor on public.cultivos(productor_id);

-- 3) is_admin() — ¿el usuario actual es admin? ----------------
-- SECURITY DEFINER: lee el rol sin disparar recursión de RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- 4) Crear el perfil automáticamente al registrarse -----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono, finca, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    nullif(new.raw_user_meta_data->>'telefono', ''),
    nullif(new.raw_user_meta_data->>'finca', ''),
    'productor'
  )
  on conflict (id) do nothing; -- el alta nunca queda a medias
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Evitar que un usuario se auto-ascienda a admin -----------
create or replace function public.proteger_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and not public.is_admin() then
    new.rol := old.rol; -- ignora el cambio de rol si quien edita no es admin
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_rol on public.perfiles;
create trigger trg_proteger_rol
  before update on public.perfiles
  for each row execute function public.proteger_rol();

-- 6) ROW LEVEL SECURITY ---------------------------------------
alter table public.perfiles enable row level security;
alter table public.cultivos enable row level security;

-- PERFILES: cada quien ve/edita el suyo; el admin ve todos.
drop policy if exists "perfiles_select" on public.perfiles;
create policy "perfiles_select" on public.perfiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "perfiles_update" on public.perfiles;
create policy "perfiles_update" on public.perfiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- CULTIVOS: cada quien maneja los suyos; el admin los ve todos.
drop policy if exists "cultivos_select" on public.cultivos;
create policy "cultivos_select" on public.cultivos
  for select using (productor_id = auth.uid() or public.is_admin());

drop policy if exists "cultivos_insert" on public.cultivos;
create policy "cultivos_insert" on public.cultivos
  for insert with check (productor_id = auth.uid());

drop policy if exists "cultivos_update" on public.cultivos;
create policy "cultivos_update" on public.cultivos
  for update using (productor_id = auth.uid()) with check (productor_id = auth.uid());

drop policy if exists "cultivos_delete" on public.cultivos;
create policy "cultivos_delete" on public.cultivos
  for delete using (productor_id = auth.uid() or public.is_admin());

-- 7) ping() — para el keep-alive (mantener la BD despierta) ----
create or replace function public.ping()
returns text
language sql
security definer
set search_path = public
as $$ select 'ok'::text; $$;

grant execute on function public.ping() to anon, authenticated;

-- ============================================================
-- Para volver ADMIN a un usuario (después de que se registre):
--
--   update public.perfiles set rol = 'admin'
--   where id = (select id from auth.users where email = 'TU-CORREO@ejemplo.com');
--
-- ============================================================
