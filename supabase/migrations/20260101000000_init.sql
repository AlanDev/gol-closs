-- =====================================================================
-- Un Gol de Closs — esquema inicial
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

create table if not exists public.relatos (
  id            uuid primary key default gen_random_uuid(),
  categoria     text not null check (categoria in ('europa', 'sudamerica', 'selecciones')),
  jugador       text not null check (length(trim(jugador)) > 0),
  equipo        text not null check (length(trim(equipo)) > 0),
  rival         text not null check (length(trim(rival)) > 0),
  competicion   text not null check (length(trim(competicion)) > 0),
  anio          int  not null check (anio between 1900 and 2100),
  source_type   text not null check (source_type in ('file', 'youtube')),
  audio_path    text null,
  youtube_id    text null,
  start_seconds numeric not null default 0 check (start_seconds >= 0),
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint relatos_source_consistente check (
    (source_type = 'file'    and audio_path is not null) or
    (source_type = 'youtube' and youtube_id is not null)
  )
);

create index if not exists relatos_categoria_activo_idx on public.relatos (categoria, activo);

-- Un puzzle por categoría por día. `numero` = días desde el lanzamiento + 1
-- (el mismo número para las tres categorías de un mismo día).
create table if not exists public.puzzles_diarios (
  fecha     date not null,
  categoria text not null check (categoria in ('europa', 'sudamerica', 'selecciones')),
  numero    int  not null,
  relato_id uuid not null references public.relatos (id) on delete restrict,
  primary key (fecha, categoria),
  unique (categoria, numero)
);

create index if not exists puzzles_diarios_relato_idx on public.puzzles_diarios (relato_id);

-- El relato asignado tiene que ser de la misma categoría que el puzzle.
create or replace function public.puzzles_diarios_check_categoria()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.relatos r where r.id = new.relato_id and r.categoria = new.categoria
  ) then
    raise exception 'El relato % no pertenece a la categoría %', new.relato_id, new.categoria;
  end if;
  return new;
end;
$$;

drop trigger if exists puzzles_diarios_check_categoria on public.puzzles_diarios;
create trigger puzzles_diarios_check_categoria
  before insert or update on public.puzzles_diarios
  for each row execute function public.puzzles_diarios_check_categoria();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- El rol service_role (solo servidor) ignora RLS. anon/authenticated
-- solo pueden leer las columnas "de catálogo" de los relatos activos:
-- nunca audio_path, youtube_id ni start_seconds, y nunca puzzles_diarios.

alter table public.relatos         enable row level security;
alter table public.puzzles_diarios enable row level security;

revoke all on table public.relatos         from anon, authenticated;
revoke all on table public.puzzles_diarios from anon, authenticated;

-- El servidor (service_role) ignora RLS pero igual necesita privilegios de
-- tabla. Se otorgan explícitamente para no depender de la opción
-- "Automatically expose new tables" del proyecto (recomendado: desactivada).
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.relatos         to service_role;
grant select, insert, update, delete on table public.puzzles_diarios to service_role;

-- Privilegios por columna: un `select *` desde el cliente falla a propósito.
grant select (id, categoria, jugador, equipo, rival, competicion, anio)
  on table public.relatos to anon, authenticated;

drop policy if exists "relatos activos: lectura publica" on public.relatos;
create policy "relatos activos: lectura publica"
  on public.relatos
  for select
  to anon, authenticated
  using (activo = true);

-- puzzles_diarios: sin políticas => inaccesible para anon/authenticated.

-- ---------------------------------------------------------------------
-- Asignación automática del puzzle del día
-- ---------------------------------------------------------------------
-- Devuelve el relato asignado a (p_fecha, p_categoria). Si no hay, elige un
-- relato activo de esa categoría que no se haya usado en los últimos p_cooldown_days (ni esté agendado a
-- futuro), priorizando los nunca usados y luego los usados hace más tiempo.

create or replace function public.ensure_daily_puzzle(
  p_fecha date,
  p_categoria text,
  p_numero int,
  p_cooldown_days int default 90
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_relato uuid;
begin
  select relato_id into v_relato from puzzles_diarios where fecha = p_fecha and categoria = p_categoria;
  if found then
    return v_relato;
  end if;

  -- Serializa asignaciones concurrentes (primer request del día).
  perform pg_advisory_xact_lock(hashtext('ungoldecloss.ensure_daily_puzzle'));

  select relato_id into v_relato from puzzles_diarios where fecha = p_fecha and categoria = p_categoria;
  if found then
    return v_relato;
  end if;

  select r.id into v_relato
  from relatos r
  left join lateral (
    select max(p.fecha) as ultima from puzzles_diarios p where p.relato_id = r.id
  ) u on true
  where r.activo
    and r.categoria = p_categoria
    and not exists (
      select 1 from puzzles_diarios p
      where p.relato_id = r.id
        and p.fecha > p_fecha - p_cooldown_days
    )
  order by u.ultima asc nulls first, random()
  limit 1;

  -- Catálogo chico: si todos están en cooldown, el menos reciente (no agendado a futuro).
  if v_relato is null then
    select r.id into v_relato
    from relatos r
    left join lateral (
      select max(p.fecha) as ultima from puzzles_diarios p where p.relato_id = r.id
    ) u on true
    where r.activo
      and r.categoria = p_categoria
      and not exists (
        select 1 from puzzles_diarios p where p.relato_id = r.id and p.fecha > p_fecha
      )
    order by u.ultima asc nulls first, random()
    limit 1;
  end if;

  if v_relato is null then
    return null;
  end if;

  insert into puzzles_diarios (fecha, categoria, numero, relato_id)
  values (p_fecha, p_categoria, p_numero, v_relato);

  return v_relato;
end;
$$;

revoke all on function public.ensure_daily_puzzle(date, text, int, int) from public, anon, authenticated;
grant execute on function public.ensure_daily_puzzle(date, text, int, int) to service_role;

-- ---------------------------------------------------------------------
-- Storage: bucket privado para audios (se sirven con signed URLs)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('relatos', 'relatos', false)
on conflict (id) do nothing;
