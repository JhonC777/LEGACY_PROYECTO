-- LEGACY: archivo institucional. Ejecutar en el SQL Editor de Supabase.

create table if not exists public.institutions (
  id text primary key,
  slug text unique not null,
  name text not null,
  short_name text not null,
  description text not null default '',
  accent text not null default '#7662c9',
  logo_url text,
  is_active boolean not null default true
);

create table if not exists public.institution_admins (
  institution_id text not null references public.institutions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (institution_id, user_id)
);

create table if not exists public.projects (
  id text primary key,
  institution_id text not null references public.institutions (id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text not null default '',
  area text not null default '',
  category text not null default '',
  year integer not null check (year between 1990 and 2100),
  authors jsonb not null default '[]'::jsonb check (jsonb_typeof(authors) = 'array'),
  description text not null default '',
  problem text not null default '',
  solution text not null default '',
  methodology text not null default '',
  results text not null default '',
  technologies text[] not null default '{}',
  tags text[] not null default '{}',
  collection text,
  cover_image text not null default '',
  gallery text[] not null default '{}',
  doc_url text,
  video_url text,
  pdf_url text,
  is_featured boolean not null default false,
  is_real boolean not null default false,
  status text not null check (status in ('draft', 'published', 'archived')),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (institution_id, slug)
);

alter table public.projects drop constraint if exists projects_year_check;
alter table public.projects add constraint projects_year_check check (year between 1990 and 2100);

alter table public.projects drop constraint if exists projects_authors_array;
alter table public.projects add constraint projects_authors_array check (jsonb_typeof(authors) = 'array');

insert into public.institutions (id, slug, name, short_name, description, accent, logo_url, is_active)
values (
  'inst-demo-fya',
  'fe-y-alegria',
  'IED Germán Vargas Cantillo Fe y Alegría',
  'IED GVC',
  'Espacio de preservación académica del piloto.',
  '#6b5ce6',
  null,
  true
)
on conflict (id) do nothing;

insert into public.projects (
  id, institution_id, slug, title, subtitle, area, category, year, authors,
  description, problem, solution, methodology, results, technologies, tags,
  cover_image, gallery, doc_url, is_featured, is_real, status, published_at
) values (
  'demo-p-real',
  'inst-demo-fya',
  'cuadros-relieve-especies-extincion',
  'Cuadros en Relieve de Especies en Extinción con Difusión Digital',
  'Cuadros Decorativos en Alto Relieve de las Especies Animales en Vía de Extinción con Difusión en los Medios Digitales',
  'Arte y Cultura',
  'Medio Ambiente',
  2024,
  '[
    {"id":"a-real-1","name":"Daniela Juliao","role":"Directora General"},
    {"id":"a-real-2","name":"Jose Diaz","role":"Finanzas"},
    {"id":"a-real-3","name":"Michel Lopez","role":"Marketing"},
    {"id":"a-real-4","name":"Rocio Jimenez","role":"Marketing"},
    {"id":"a-real-5","name":"Nelmys Sobrino","role":"Recursos Humanos"},
    {"id":"a-real-6","name":"Eryenis Pizarro","role":"Producción"}
  ]'::jsonb,
  $desc$El proyecto consiste en un emprendimiento y propuesta artístico-educativa llamada Wildanger Art. Se enfoca en la elaboración y comercialización de cuadros artísticos en alto relieve hechos a mano, inspirados en especies de animales en peligro de extinción en Colombia. Cada cuadro incorpora un código QR que dirige al usuario a plataformas/redes sociales donde se proporciona información sobre la especie representada, promoviendo la conservación ambiental y embelleciendo espacios físicos.$desc$,
  $prob$El impacto negativo de las actividades humanas sobre el medio ambiente y la biodiversidad ha generado un alarmante ritmo de extinción de especies. En Colombia, una gran cantidad de especies de fauna silvestre están clasificadas en alguna categoría de amenaza debido a la destrucción de hábitats, la contaminación y la falta de conciencia ambiental en la sociedad.$prob$,
  $sol$Crear una propuesta que fusione el arte, la tecnología y la educación ambiental. A través de obras plásticas en alto relieve se busca generar una conexión emocional con el espectador, mientras que el código QR y la difusión en medios digitales brindan acceso inmediato a información educativa sobre el estado de la fauna y acciones para su protección.$sol$,
  $met$La metodología consistió en una investigación bibliográfica sobre la conservación de fauna y proyectos ambientales en Colombia, complementada con un estudio de mercado mediante encuestas a habitantes de Barranquilla para validar la intención de compra (82,2%) y definir las características del producto. Posteriormente, se estableció un proceso de producción artesanal que abarca desde el boceto hasta el modelado del relieve mediante una mezcla de yeso, pegamento y pintura, hasta el sellado y completo de la obra. Finalmente, se integró un código QR con contenido educativo y se estructuró la comercialización mediante redes sociales, con entregas a domicilio.$met$,
  $res$Los resultados mostraron una alta aceptación en el mercado con un 82,2% de intención de compra en Barranquilla, identificando una preferencia por cuadros de tamaño mediano y tonos cálidos. En el aspecto económico, se determinó un costo unitario de producción de $64.691 COP y un precio de venta de $90.567 COP con una proyección de ventas de 159 unidades durante el primer año. Finalmente, se logró la elaboración exitosa de las obras de arte en alto relieve, códigos QR funcionales y la definición de un plan de manejo ambiental para mitigar el impacto de los materiales de fabricación.$res$,
  array['QR'],
  array['animales en vía de extinción', 'cuadros', 'pintura', 'alto relieve'],
  '/covers/cuadros-relieve-tortuga.jpg',
  array['/covers/cuadros-relieve-tortuga.jpg'],
  '/resources/proyecto-de-grado-lectura-critica.docx#Proyecto de Grado (Lectura Crítica).docx',
  true,
  true,
  'published',
  now()
)
on conflict (id) do nothing;

alter table public.institutions enable row level security;
alter table public.institution_admins enable row level security;
alter table public.projects enable row level security;

drop policy if exists "public read institutions" on public.institutions;
create policy "public read institutions"
  on public.institutions for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "admin reads own membership" on public.institution_admins;
create policy "admin reads own membership"
  on public.institution_admins for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects"
  on public.projects for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "admin reads institution projects" on public.projects;
create policy "admin reads institution projects"
  on public.projects for select
  to authenticated
  using (
    exists (
      select 1 from public.institution_admins admin
      where admin.institution_id = projects.institution_id
        and admin.user_id = auth.uid()
    )
  );

drop policy if exists "admin writes institution projects" on public.projects;
create policy "admin writes institution projects"
  on public.projects for all
  to authenticated
  using (
    exists (
      select 1 from public.institution_admins admin
      where admin.institution_id = projects.institution_id
        and admin.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.institution_admins admin
      where admin.institution_id = projects.institution_id
        and admin.user_id = auth.uid()
    )
  );

create index if not exists projects_institution_status_idx
  on public.projects (institution_id, status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

create or replace function public.claim_admin(inst_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.institution_admins
    where institution_id = inst_id and user_id = auth.uid()
  ) then
    raise exception 'not an admin';
  end if;
end;
$$;

revoke all on function public.claim_admin(text) from public, anon;
grant execute on function public.claim_admin(text) to authenticated;

create or replace function public.archive_object_is_published(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects project
    where project.status = 'published'
      and (
        project.cover_image = 'storage:' || object_name
        or project.doc_url = 'storage:' || object_name
        or project.pdf_url = 'storage:' || object_name
        or project.video_url = 'storage:' || object_name
        or ('storage:' || object_name) = any (project.gallery)
      )
  );
$$;

revoke all on function public.archive_object_is_published(text) from public;
grant execute on function public.archive_object_is_published(text) to anon, authenticated;

revoke all on table public.institutions from anon, authenticated;
grant select on table public.institutions to anon, authenticated;

revoke all on table public.institution_admins from anon, authenticated;
grant select on table public.institution_admins to authenticated;

revoke all on table public.projects from anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'archive',
  'archive',
  false,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'text/plain',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read archive" on storage.objects;
drop policy if exists "read archive" on storage.objects;
create policy "read archive"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'archive'
    and (
      public.archive_object_is_published(name)
      or exists (
        select 1 from public.institution_admins admin
        where admin.user_id = auth.uid()
          and name like admin.institution_id || '/%'
      )
    )
  );

drop policy if exists "admin uploads archive" on storage.objects;
create policy "admin uploads archive"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'archive'
    and exists (
      select 1 from public.institution_admins admin
      where admin.user_id = auth.uid()
        and name like admin.institution_id || '/%'
    )
  );

drop policy if exists "admin updates archive" on storage.objects;
create policy "admin updates archive"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'archive'
    and exists (
      select 1 from public.institution_admins admin
      where admin.user_id = auth.uid()
        and name like admin.institution_id || '/%'
    )
  )
  with check (
    bucket_id = 'archive'
    and exists (
      select 1 from public.institution_admins admin
      where admin.user_id = auth.uid()
        and name like admin.institution_id || '/%'
    )
  );

drop policy if exists "admin deletes archive" on storage.objects;
create policy "admin deletes archive"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'archive'
    and exists (
      select 1 from public.institution_admins admin
      where admin.user_id = auth.uid()
        and name like admin.institution_id || '/%'
    )
  );
