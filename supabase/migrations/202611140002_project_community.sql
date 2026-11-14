-- LEGACY: comentarios y reacciones por proyecto.
-- Requiere habilitar Anonymous Sign-Ins en Supabase Auth antes de probar
-- la publicación desde visitantes sin correo.

create or replace function public.legacy_comment_language_allowed(comment_text text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  normalized text;
  blocked_terms text[] := array[
    'abortado', 'analfabeta de mierda', 'asqueroso', 'baboso', 'bestia',
    'bruto', 'cabron', 'carechimba', 'caremonda', 'chupa pija', 'chupapija',
    'cojudo', 'come mierda', 'comemierda', 'culero', 'estupida', 'estupido',
    'fuck you', 'gillipollas', 'gilipollas', 'gonorrea', 'hijueputa',
    'hijo de puta', 'hp', 'idiota de mierda', 'imbecil', 'imbecil de mierda',
    'mal nacido', 'malparida', 'malparido', 'maricon', 'mierda', 'mongolico',
    'perra', 'perra hp', 'pendeja', 'pendejo', 'puta', 'puto', 'ramera',
    'retrasado', 'retrasada', 'sidoso', 'subnormal', 'tarado', 'zorra'
  ];
  term text;
begin
  if comment_text is null or length(btrim(comment_text)) = 0 or length(comment_text) > 1200 then
    return false;
  end if;

  normalized := lower(comment_text);
  normalized := translate(normalized, 'áéíóúüñ', 'aeiouun');
  normalized := translate(normalized, '0134578@$!', 'oieastbasi');
  normalized := regexp_replace(normalized, '[​‌‍﻿]', '', 'g');
  normalized := regexp_replace(normalized, '([a-z])([._*·•|/-])+([a-z])', E'\\1\\3', 'g');
  normalized := regexp_replace(normalized, '([^[:space:]])\\1{2,}', E'\\1\\1', 'g');
  normalized := regexp_replace(normalized, '[^a-z0-9]+', ' ', 'g');
  normalized := btrim(regexp_replace(normalized, '[[:space:]]+', ' ', 'g'));

  foreach term in array blocked_terms loop
    if position(' ' || term || ' ' in ' ' || normalized || ' ') > 0 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.legacy_comment_language_allowed(text) from public, anon, authenticated;
grant execute on function public.legacy_comment_language_allowed(text) to authenticated;

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.project_likes (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_comments_project_created_idx
  on public.project_comments (project_id, created_at desc);

alter table public.project_comments enable row level security;
alter table public.project_likes enable row level security;

drop policy if exists "public read comments on published projects" on public.project_comments;
create policy "public read comments on published projects"
  on public.project_comments for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects project
      where project.id = project_comments.project_id
        and project.status = 'published'
    )
  );

drop policy if exists "visitors create comments on published projects" on public.project_comments;
create policy "visitors create comments on published projects"
  on public.project_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_comments.project_id
        and project.status = 'published'
    )
  );

drop policy if exists "visitors read own likes" on public.project_likes;
create policy "visitors read own likes"
  on public.project_likes for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "visitors add own likes" on public.project_likes;
create policy "visitors add own likes"
  on public.project_likes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_likes.project_id
        and project.status = 'published'
    )
  );

drop policy if exists "visitors remove own likes" on public.project_likes;
create policy "visitors remove own likes"
  on public.project_likes for delete
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.guard_project_comment()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  recent_count integer;
begin
  if auth.uid() is null or new.author_id <> auth.uid() then
    raise exception 'COMMENT_AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.legacy_comment_language_allowed(new.body)
     or not public.legacy_comment_language_allowed(new.display_name) then
    raise exception 'COMMENT_LANGUAGE_BLOCKED' using errcode = '22023';
  end if;

  -- Serializa publicaciones por usuario para que el límite no se evada
  -- enviando varias inserciones simultáneas.
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 0));

  select count(*)::integer
    into recent_count
    from public.project_comments comment_row
   where comment_row.author_id = new.author_id
     and comment_row.created_at > now() - interval '10 minutes';

  if recent_count >= 3 then
    raise exception 'COMMENT_RATE_LIMITED' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_project_comment() from public, anon, authenticated;

drop trigger if exists project_comments_guard_insert on public.project_comments;
create trigger project_comments_guard_insert
  before insert on public.project_comments
  for each row execute function public.guard_project_comment();

create or replace function public.get_project_community_stats(project_ids text[])
returns table (
  project_id text,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    project.id,
    (select count(*) from public.project_likes liked where liked.project_id = project.id),
    (select count(*) from public.project_comments comment_row where comment_row.project_id = project.id),
    exists (
      select 1 from public.project_likes mine
      where mine.project_id = project.id
        and mine.user_id = auth.uid()
    )
  from public.projects project
  where project.status = 'published'
    and project.id = any(coalesce(project_ids, array[]::text[]));
$$;

revoke all on function public.get_project_community_stats(text[]) from public;
grant execute on function public.get_project_community_stats(text[]) to anon, authenticated;

revoke all on table public.project_comments from anon, authenticated;
grant select on table public.project_comments to anon, authenticated;
grant insert on table public.project_comments to authenticated;

revoke all on table public.project_likes from anon, authenticated;
grant select, insert, delete on table public.project_likes to authenticated;

comment on table public.project_comments is
  'Comentarios públicos de visitantes en proyectos publicados; moderación y límite de frecuencia aplicados en PostgreSQL.';
comment on table public.project_likes is
  'Una reacción por visitante y proyecto, identificada por el usuario anónimo de Supabase.';
