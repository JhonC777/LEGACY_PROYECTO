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
  Send,
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

  return (
    <>
      <PageHeader
        eyebrow="Centro de mando"
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

      <p className="admin-isolation">
        Solo ves <strong>{settings.name}</strong>. Los invitados no ven borradores ni archivados:
        hoy el público muestra <strong>{published.length}</strong>{' '}
        {published.length === 1 ? 'proyecto' : 'proyectos'}.
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
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Estado del archivo">
            {stats.map(({ label, value, icon: Icon, href, hint, tone }) => (
              <Link
                key={label}
                to={href}
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
                <span className="mt-4 block font-brand text-4xl leading-none font-semibold text-legacy-white">
                  {value}
                </span>
                <span className="mt-1.5 block text-sm font-semibold text-white/85">{label}</span>
                <span className="mt-0.5 block text-xs text-legacy-muted">{hint}</span>
              </Link>
            ))}
          </section>

          <section className="admin-card mt-6 p-5" aria-labelledby="public-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="public-title" className="font-brand text-xl font-semibold text-legacy-white">
                  Qué ve el invitado ahora
                </h2>
                <p className="mt-0.5 text-xs text-legacy-muted">
                  Portada pública de {settings.shortName}. Los destacados salen de Ajustes.
                </p>
              </div>
              <Link to={publicHref} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Abrir sitio público
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

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
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
              <h2 id="authors-title" className="inline-flex items-center gap-2 font-brand text-xl font-semibold text-legacy-white">
                <Users className="h-4 w-4 text-legacy-gold" aria-hidden />
                Autores del archivo
              </h2>
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

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="admin-card p-5" aria-labelledby="ops-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="ops-title" className="font-brand text-xl font-semibold text-legacy-white">
                    Operación del archivo
                  </h2>
                  <p className="mt-0.5 text-xs text-legacy-muted">
                    Últimas ediciones, incompletos y listos para publicar.
                  </p>
                </div>
                <Link to={`${base}/proyectos`} className="text-xs font-semibold text-legacy-gold hover:text-legacy-gold-soft">
                  Ver inventario
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

              {readyToPublish.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-legacy-gold/20 bg-legacy-gold/[0.06] px-4 py-3">
                  <p className="text-sm text-legacy-white">
                    <Send className="mr-2 inline h-4 w-4 text-legacy-gold" aria-hidden />
                    {readyToPublish.length === 1
                      ? '1 borrador cumple todo y puede publicarse.'
                      : `${readyToPublish.length} borradores cumplen todo y pueden publicarse.`}
                  </p>
                  <Link to={`${base}/proyectos?status=draft`} className="btn btn-secondary btn-sm">
                    Revisar
                  </Link>
                </div>
              ) : null}
            </section>

            <div className="flex flex-col gap-5">
              <section className="admin-card p-5" aria-labelledby="activity-title">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="activity-title" className="font-brand text-xl font-semibold text-legacy-white">
                    Actividad reciente
                  </h2>
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
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-legacy-muted">
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
                <h2 id="shortcuts-title" className="font-brand text-xl font-semibold text-legacy-white">
                  Accesos rápidos
                </h2>
                <div className="mt-3 grid gap-2">
                  <Link to={`${base}/cargas`} className="admin-shortcut">
                    <CloudUpload className="h-4 w-4 text-legacy-gold" aria-hidden />
                    Subir imágenes o documentos
                  </Link>
                  <Link to={`${base}/ajustes`} className="admin-shortcut">
                    <Pencil className="h-4 w-4 text-legacy-gold" aria-hidden />
                    Editar identidad y portada pública
                  </Link>
                  <Link to={publicHref} target="_blank" rel="noreferrer" className="admin-shortcut">
                    <ExternalLink className="h-4 w-4 text-legacy-gold" aria-hidden />
                    Abrir el sitio público
                  </Link>
                </div>
              </section>
            </div>
          </div>
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
