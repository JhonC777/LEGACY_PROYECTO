import {
  Archive,
  ArrowRight,
  CircleDashed,
  CheckCircle2,
  Clock,
  CloudUpload,
  ExternalLink,
  FolderKanban,
  History,
  Images,
  Pencil,
  Plus,
  Send,
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

export function AdminDashboard() {
  const { institution, settings, projects, media, activity, status, reload } = useAdminStore()
  const base = `/admin/${institution.slug}`

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

  const pending = projects
    .filter((project) => project.status !== 'archived')
    .map((project) => ({ project, issues: getProjectIssues(project) }))
    .filter(({ issues }) => issues.errors.length > 0)
    .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt))

  const readyToPublish = drafts.filter((project) => getProjectIssues(project).complete)
  const lastDraft = [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const recent = activity.slice(0, 6)

  const stats: { label: string; value: number; icon: LucideIcon; href: string; hint: string; tone?: 'gold' }[] = [
    {
      label: 'Publicados',
      value: published.length,
      icon: CheckCircle2,
      href: `${base}/proyectos?status=published`,
      hint: 'Visibles en el sitio público',
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
          : 'En preparación',
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
  ]

  return (
    <>
      <PageHeader
        eyebrow="Resumen"
        title={settings.name}
        description="Estado del archivo académico de tu institución y lo que requiere atención."
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
          <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
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
                  <ArrowRight className="h-4 w-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-legacy-gold" aria-hidden />
                </span>
                <span className="mt-4 block font-display text-4xl leading-none font-semibold text-legacy-white">
                  {value}
                </span>
                <span className="mt-1.5 block text-sm font-semibold text-white/85">{label}</span>
                <span className="mt-0.5 block text-xs text-legacy-muted">{hint}</span>
              </Link>
            ))}
          </section>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="admin-card p-5" aria-labelledby="pending-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="pending-title" className="font-display text-xl font-semibold text-legacy-white">
                    Requiere atención
                  </h2>
                  <p className="mt-0.5 text-xs text-legacy-muted">
                    Proyectos con datos faltantes para poder publicarse.
                  </p>
                </div>
                <span className="admin-count">{pending.length}</span>
              </div>

              {pending.length === 0 ? (
                <AdminEmptyState
                  compact
                  icon={CheckCircle2}
                  title="Todo en orden"
                  description="No hay fichas incompletas. Los borradores actuales cumplen los requisitos de publicación."
                  className="mt-4"
                />
              ) : (
                <ul className="mt-4 space-y-2">
                  {pending.slice(0, 5).map(({ project, issues }) => (
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
                            {issues.errors.slice(0, 2).join(' · ')}
                            {issues.errors.length > 2
                              ? ` · +${issues.errors.length - 2} más`
                              : ''}
                          </span>
                        </span>
                        <span className="admin-row-action">
                          Completar
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

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
                  <h2 id="activity-title" className="font-display text-xl font-semibold text-legacy-white">
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
                <h2 id="shortcuts-title" className="font-display text-xl font-semibold text-legacy-white">
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
                  <Link
                    to={`/instituciones/${institution.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-shortcut"
                  >
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
