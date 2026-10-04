import {
  Archive,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleDashed,
  CheckCircle2,
  Clock,
  CloudUpload,
  ExternalLink,
  FolderKanban,
  History,
  Images,
  Layers3,
  Pencil,
  Plus,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../components/AdminStates'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { formatRelative } from '../format'
import { useAdminSession } from '../session'
import { getProjectIssues, useAdminStore } from '../store'
import { ACTIVITY_LABEL } from '../types'
import type { AdminProject } from '../types'

function tally(projects: AdminProject[], key: 'area' | 'collection' | 'year') {
  const counts = new Map<string, number>()
  for (const project of projects) {
    const raw = key === 'year' ? String(project.year) : project[key]
    if (!raw) continue
    counts.set(raw, (counts.get(raw) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
}

export function AdminDashboard() {
  const { institution, settings, projects, media, activity, status, reload } = useAdminStore()
  const { session } = useAdminSession()
  const base = `/admin/${institution.slug}`
  const publicHref = `/instituciones/${institution.slug}`

  if (status === 'loading') {
    return (
      <>
        <PageHeader eyebrow="Resumen" title={settings.name} />
        <div className="mt-8">
          <AdminLoadingState />
        </div>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        <PageHeader eyebrow="Resumen" title={settings.name} />
        <div className="mt-8">
          <AdminErrorState onRetry={reload} />
        </div>
      </>
    )
  }

  const published = projects.filter((project) => project.status === 'published')
  const drafts = projects.filter((project) => project.status === 'draft')
  const archived = projects.filter((project) => project.status === 'archived')
  const readyMedia = media.filter((asset) => asset.status === 'ready')
  const uploading = media.filter((asset) => asset.status === 'uploading')

  const withIssues = projects
    .filter((project) => project.status !== 'archived')
    .map((project) => ({ project, issues: getProjectIssues(project) }))

  const pending = withIssues
    .filter(({ issues }) => issues.errors.length > 0)
    .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt))

  const readyToPublish = drafts.filter((project) => getProjectIssues(project).complete)
  const lastDraft = [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const recent = activity.slice(0, 8)
  const recentlyEdited = [...projects]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

  const featured = settings.featuredProjectIds
    .map((id) => published.find((project) => project.id === id))
    .filter((project): project is AdminProject => Boolean(project))

  const authors = new Map<string, number>()
  for (const project of projects) {
    for (const author of project.authors) {
      const name = author.name.trim()
      if (!name) continue
      authors.set(name, (authors.get(name) ?? 0) + 1)
    }
  }
  const authorList = [...authors.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))

  const areas = tally(projects, 'area')
  const years = tally(projects, 'year')
  const collections = tally(projects, 'collection')

  const stats: {
    label: string
    value: number
    icon: LucideIcon
    href: string
    hint: string
    tone?: 'gold'
  }[] = [
    {
      label: 'Publicados',
      value: published.length,
      icon: CheckCircle2,
      href: `${base}/proyectos?status=published`,
      hint: 'Los ve el invitado en el sitio',
      tone: 'gold',
    },
    {
      label: 'Borradores',
      value: drafts.length,
      icon: CircleDashed,
      href: `${base}/proyectos?status=draft`,
      hint:
        readyToPublish.length > 0
          ? `${readyToPublish.length} listo${readyToPublish.length === 1 ? '' : 's'} para publicar`
          : 'Solo visibles en este panel',
    },
    {
      label: 'Incompletos',
      value: pending.length,
      icon: CircleDashed,
      href: `${base}/proyectos`,
      hint: 'Faltan datos para poder publicar',
    },
    {
      label: 'Archivados',
      value: archived.length,
      icon: Archive,
      href: `${base}/proyectos?status=archived`,
      hint: 'Fuera del catálogo, recuperables',
    },
    {
      label: 'Archivos',
      value: readyMedia.length,
      icon: Images,
      href: `${base}/cargas`,
      hint: uploading.length > 0 ? `${uploading.length} subiendo ahora` : 'Imágenes y documentos',
    },
    {
      label: 'Destacados',
      value: featured.length,
      icon: Star,
      href: `${base}/ajustes`,
      hint: 'Portada que ve el invitado',
    },
  ]

  const firstName = (session?.name ?? '').trim().split(/\s+/)[0]
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const focus: { key: string; count: number; title: string; hint: string; href: string; cta: string }[] = []
  if (pending.length > 0) {
    focus.push({
      key: 'pending',
      count: pending.length,
      title: pending.length === 1 ? 'Proyecto incompleto' : 'Proyectos incompletos',
      hint: pending
        .slice(0, 2)
        .map(({ project }) => project.title || 'Sin título')
        .join(' · '),
      href: `${base}/proyectos/${pending[0].project.id}`,
      cta: 'Completar',
    })
  }
  if (readyToPublish.length > 0) {
    focus.push({
      key: 'ready',
      count: readyToPublish.length,
      title: readyToPublish.length === 1 ? 'Borrador listo para publicar' : 'Borradores listos para publicar',
      hint: 'Cumplen todos los requisitos de la ficha',
      href: `${base}/proyectos?status=draft`,
      cta: 'Revisar',
    })
  }
  if (uploading.length > 0) {
    focus.push({
      key: 'uploading',
      count: uploading.length,
      title: uploading.length === 1 ? 'Archivo subiendo' : 'Archivos subiendo',
      hint: 'No cierres la pestaña hasta que terminen',
      href: `${base}/cargas`,
      cta: 'Ver cargas',
    })
  }
  if (featured.length === 0 && published.length > 0) {
    focus.push({
      key: 'featured',
      count: 0,
      title: 'Sin destacados en la portada',
      hint: 'Elige qué proyectos ve primero el invitado',
      href: `${base}/ajustes`,
      cta: 'Elegir',
    })
  }

  return (
    <>
      <PageHeader
        eyebrow={firstName ? `Hola, ${firstName}` : 'Centro de mando'}
        title={settings.name}
        description="Todo el archivo de tu institución: lo público, lo interno y lo que falta por completar."
        actions={
          <>
            {lastDraft ? (
              <Link to={`${base}/proyectos/${lastDraft.id}`} className="btn btn-secondary btn-md">
                <Pencil className="h-4 w-4" aria-hidden />
                Retomar borrador
              </Link>
            ) : null}
            <Link to={`${base}/proyectos/nuevo`} className="btn btn-primary btn-md">
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo proyecto
            </Link>
          </>
        }
      />

      <p className="admin-hero-date mt-2">
        <CalendarDays className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
        {today}
      </p>

      {projects.length === 0 ? (
        <div className="mt-8">
          <AdminEmptyState
            icon={FolderKanban}
            title="Tu archivo todavía está vacío"
            description="Crea el primer proyecto académico. Podrás guardarlo como borrador y publicarlo cuando esté completo."
            action={
              <Link to={`${base}/proyectos/nuevo`} className="btn btn-primary btn-md">
                <Plus className="h-4 w-4" aria-hidden />
                Crear proyecto
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="admin-card admin-focus mt-6 p-5" aria-labelledby="focus-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="focus-title" className="font-brand text-xl font-semibold text-legacy-white">
                  {focus.length > 0 ? 'Lo que necesita tu atención' : 'Todo al día'}
                </h2>
                <p className="mt-0.5 text-xs text-legacy-muted">
                  Hoy el público ve <strong className="text-legacy-white">{published.length}</strong>{' '}
                  {published.length === 1 ? 'proyecto' : 'proyectos'}. Los borradores y archivados solo
                  se ven aquí.
                </p>
              </div>
              <Link to={publicHref} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Ver sitio público
              </Link>
            </div>
            {focus.length === 0 ? (
              <p className="admin-focus-item is-done mt-4 text-sm text-legacy-muted">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-legacy-gold" aria-hidden />
                No hay pendientes: todos los proyectos activos tienen su ficha completa.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {focus.map((item) => (
                  <li key={item.key}>
                    <Link to={item.href} className="admin-focus-item group">
                      <span className="admin-focus-num">
                        {item.count > 0 ? item.count : <Star className="h-4 w-4" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-legacy-white">{item.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-legacy-muted">{item.hint}</span>
                      </span>
                      <span className="admin-row-action">
                        {item.cta}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <h2 className="admin-section-title">Estado del archivo</h2>
          <section className="admin-stats" aria-label="Estado del archivo">
            {stats.map(({ label, value, icon: Icon, href, hint, tone }) => (
              <Link
                key={label}
                to={href}
                title={hint}
                className={cn('admin-card admin-stat group', tone === 'gold' && 'is-gold')}
              >
                <span className="flex items-center justify-between">
                  <span className="admin-stat-icon">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-legacy-gold"
                    aria-hidden
                  />
                </span>
                <span className="mt-3 block font-brand text-3xl leading-none font-semibold text-legacy-white">
                  {value}
                </span>
                <span className="mt-1.5 block text-sm font-semibold text-white/85">{label}</span>
                <span className="mt-0.5 hidden text-xs text-legacy-muted sm:block">{hint}</span>
              </Link>
            ))}
          </section>

          <h2 className="admin-section-title">Trabajo reciente</h2>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="admin-card p-5" aria-labelledby="ops-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 id="ops-title" className="font-brand text-xl font-semibold text-legacy-white">
                    Últimas ediciones
                  </h3>
                  <p className="mt-0.5 text-xs text-legacy-muted">
                    Lo que tocaste hace poco y lo que le falta a cada ficha.
                  </p>
                </div>
                <Link to={`${base}/proyectos`} className="text-xs font-semibold text-legacy-gold hover:text-legacy-gold-soft">
                  Ver todos
                </Link>
              </div>

              <ul className="mt-4 space-y-2">
                {recentlyEdited.map((project) => {
                  const issues = getProjectIssues(project)
                  return (
                    <li key={project.id}>
                      <Link to={`${base}/proyectos/${project.id}`} className="admin-row group">
                        <span className="admin-thumb" aria-hidden>
                          {project.coverImage ? (
                            <img src={project.coverImage} alt="" loading="lazy" />
                          ) : (
                            <Images className="h-4 w-4 text-white/30" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-legacy-white">
                              {project.title || 'Sin título'}
                            </span>
                            <StatusBadge status={project.status} />
                          </span>
                          <span className="mt-1 block truncate text-xs text-legacy-muted">
                            {issues.errors.length > 0
                              ? issues.errors.slice(0, 2).join(' · ')
                              : `${project.area} · ${formatRelative(project.updatedAt)}`}
                          </span>
                        </span>
                        <span className="admin-row-action">
                          {issues.errors.length > 0 ? 'Completar' : 'Abrir'}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>

            <div className="flex flex-col gap-5">
              <section className="admin-card p-5" aria-labelledby="activity-title">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="activity-title" className="font-brand text-xl font-semibold text-legacy-white">
                    Actividad reciente
                  </h3>
                  <Link to={`${base}/historial`} className="text-xs font-semibold text-legacy-gold hover:text-legacy-gold-soft">
                    Ver historial
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <AdminEmptyState
                    compact
                    icon={History}
                    title="Sin actividad"
                    description="Aquí aparecerán los cambios que hagas en el panel."
                    className="mt-4"
                  />
                ) : (
                  <ol className="admin-timeline mt-4">
                    {recent.map((entry) => (
                      <li key={entry.id} className="admin-timeline-item">
                        <span className={cn('admin-timeline-dot', `is-${entry.type}`)} aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm text-legacy-white">{entry.message}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-legacy-muted">
                            <Clock className="h-3 w-3" aria-hidden />
                            {formatRelative(entry.at)}
                            <span aria-hidden>·</span>
                            {ACTIVITY_LABEL[entry.type]}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="admin-card p-5" aria-labelledby="shortcuts-title">
                <h3 id="shortcuts-title" className="font-brand text-xl font-semibold text-legacy-white">
                  Accesos rápidos
                </h3>
                <div className="mt-3 grid gap-2">
                  <Link to={`${base}/proyectos/nuevo`} className="admin-shortcut">
                    <Plus className="h-4 w-4 text-legacy-gold" aria-hidden />
                    Crear un proyecto nuevo
                  </Link>
                  <Link to={`${base}/cargas`} className="admin-shortcut">
                    <CloudUpload className="h-4 w-4 text-legacy-gold" aria-hidden />
                    Subir imágenes o documentos
                  </Link>
                  <Link to={`${base}/ajustes`} className="admin-shortcut">
                    <Pencil className="h-4 w-4 text-legacy-gold" aria-hidden />
                    Editar identidad y portada pública
                  </Link>
                </div>
              </section>
            </div>
          </div>

          <h2 className="admin-section-title">Portada pública</h2>
          <section className="admin-card p-5" aria-labelledby="public-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="public-title" className="font-brand text-xl font-semibold text-legacy-white">
                  Qué ve el invitado ahora
                </h3>
                <p className="mt-0.5 text-xs text-legacy-muted">
                  Portada pública de {settings.shortName}. Los destacados se eligen en Ajustes.
                </p>
              </div>
              <Link to={`${base}/ajustes`} className="btn btn-secondary btn-sm">
                <Star className="h-3.5 w-3.5" aria-hidden />
                Cambiar destacados
              </Link>
            </div>
            {featured.length === 0 ? (
              <p className="mt-4 text-sm text-legacy-muted">
                No hay destacados de portada. El invitado verá los publicados más recientes.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {featured.map((project) => (
                  <li key={project.id}>
                    <Link to={`${base}/proyectos/${project.id}`} className="admin-row group">
                      <span className="admin-thumb" aria-hidden>
                        {project.coverImage ? (
                          <img src={project.coverImage} alt="" loading="lazy" />
                        ) : (
                          <Star className="h-4 w-4 text-legacy-gold" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-legacy-white">
                            {project.title}
                          </span>
                          <StatusBadge status={project.status} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-legacy-muted">
                          {project.area} · {project.year}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <h2 className="admin-section-title">Explorar el archivo</h2>
          <div className="grid gap-5 xl:grid-cols-3">
            <InventoryCard
              id="areas-title"
              title="Áreas"
              icon={Layers3}
              empty="Sin áreas registradas."
              items={areas}
              href={(label) => `${base}/proyectos?area=${encodeURIComponent(label)}`}
            />
            <InventoryCard
              id="years-title"
              title="Años"
              icon={CalendarDays}
              empty="Sin años documentados."
              items={years}
              href={(label) => `${base}/proyectos?year=${encodeURIComponent(label)}`}
            />
            <InventoryCard
              id="collections-title"
              title="Colecciones"
              icon={BookOpen}
              empty="Ningún proyecto tiene colección."
              items={collections}
              href={(label) => `${base}/proyectos?collection=${encodeURIComponent(label)}`}
            />
          </div>

          <section className="admin-card mt-5 p-5" aria-labelledby="authors-title">
            <div className="flex items-center justify-between gap-3">
              <h3 id="authors-title" className="inline-flex items-center gap-2 font-brand text-xl font-semibold text-legacy-white">
                <Users className="h-4 w-4 text-legacy-gold" aria-hidden />
                Autores del archivo
              </h3>
              <span className="admin-count">{authorList.length}</span>
            </div>
            {authorList.length === 0 ? (
              <p className="mt-3 text-sm text-legacy-muted">Todavía no hay autores en las fichas.</p>
            ) : (
              <div className="admin-inventory mt-4">
                {authorList.slice(0, 16).map((item) => (
                  <Link
                    key={item.label}
                    to={`${base}/proyectos?q=${encodeURIComponent(item.label)}`}
                    className="admin-inventory-link"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="admin-inventory-count">{item.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}

function InventoryCard({
  id,
  title,
  icon: Icon,
  empty,
  items,
  href,
}: {
  id: string
  title: string
  icon: LucideIcon
  empty: string
  items: { label: string; count: number }[]
  href: (label: string) => string
}) {
  return (
    <section className="admin-card p-5" aria-labelledby={id}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="inline-flex items-center gap-2 font-brand text-lg font-semibold text-legacy-white">
          <Icon className="h-4 w-4 text-legacy-gold" aria-hidden />
          {title}
        </h2>
        <span className="admin-count">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-legacy-muted">{empty}</p>
      ) : (
        <div className="admin-inventory mt-4">
          {items.map((item) => (
            <Link key={item.label} to={href(item.label)} className="admin-inventory-link">
              <span className="truncate">{item.label}</span>
              <span className="admin-inventory-count">{item.count}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
