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
    <div className="admin-dashboard-v3">
      <section className="admin-command-hero" aria-labelledby="admin-command-title">
        <div className="admin-command-copy">
          <span className="admin-overline"><span className="admin-live-dot" /> CENTRO DE CONTROL · \${today}</span>
          <p className="admin-command-greeting">{firstName ? \`Bienvenido, \${firstName}\` : 'Administración institucional'}</p>
          <h1 id="admin-command-title">{settings.name}</h1>
          <p className="admin-command-description">
            El estado de tu archivo académico, sus publicaciones y el trabajo que requiere atención.
          </p>
          <div className="admin-command-actions">
            <Link to={\`\${base}/proyectos/nuevo\`} className="btn btn-primary btn-md">
              <Plus className="h-4 w-4" aria-hidden /> Crear proyecto
            </Link>
            <Link to={publicHref} target="_blank" rel="noreferrer" className="btn btn-secondary btn-md">
              <ExternalLink className="h-4 w-4" aria-hidden /> Ver sitio público
            </Link>
            {lastDraft ? (
              <Link to={\`\${base}/proyectos/\${lastDraft.id}\`} className="admin-command-tertiary">
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Continuar borrador
              </Link>
            ) : null}
          </div>
        </div>
        <div className="admin-command-visual" aria-hidden="true">
          <div className="admin-command-orbit admin-command-orbit-one" />
          <div className="admin-command-orbit admin-command-orbit-two" />
          <div className="admin-command-monogram">L</div>
          <span className="admin-command-visual-caption">LEGACY <i>·</i> ARCHIVO VIVO</span>
        </div>
      </section>

      {projects.length === 0 ? (
        <div className="admin-command-empty">
          <AdminEmptyState
            icon={FolderKanban}
            title="Tu archivo todavía está vacío"
            description="Crea el primer proyecto académico. Podrás guardarlo como borrador y publicarlo cuando esté completo."
            action={
              <Link to={\`\${base}/proyectos/nuevo\`} className="btn btn-primary btn-md">
                <Plus className="h-4 w-4" aria-hidden /> Crear proyecto
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="admin-command-metrics" aria-label="Indicadores del archivo">
            <div className="admin-command-section-heading">
              <div>
                <span className="admin-overline">VISIÓN GENERAL</span>
                <h2>Estado del archivo</h2>
              </div>
              <span className="admin-section-note">Datos actuales de la institución</span>
            </div>
            <div className="admin-metric-grid">
              {stats.map(({ label, value, icon: Icon, href, hint, tone }, index) => (
                <Link
                  key={label}
                  to={href}
                  title={hint}
                  className={\`admin-metric-card \${tone === 'gold' ? 'is-primary' : ''}\`}
                >
                  <span className="admin-metric-topline">
                    <span className="admin-metric-icon"><Icon className="h-4 w-4" aria-hidden /></span>
                    <span className="admin-metric-index">0{index + 1}</span>
                  </span>
                  <strong className="admin-metric-value">{value.toLocaleString('es-CO')}</strong>
                  <span className="admin-metric-label">{label}</span>
                  <span className="admin-metric-hint">{hint}</span>
                  <ArrowRight className="admin-metric-arrow h-4 w-4" aria-hidden />
                </Link>
              ))}
            </div>
          </section>

          <section className="admin-attention-panel" aria-labelledby="admin-attention-title">
            <div className="admin-attention-heading">
              <div>
                <span className="admin-overline">PRIORIDADES</span>
                <h2 id="admin-attention-title">{focus.length ? 'Requiere tu atención' : 'Todo está en orden'}</h2>
                <p>
                  {focus.length
                    ? \`\${focus.length} asunto\${focus.length === 1 ? '' : 's'} para revisar en el archivo.\`
                    : 'No hay tareas pendientes que bloqueen la publicación.'}
                </p>
              </div>
              <span className={\`admin-attention-state \${focus.length ? 'is-pending' : 'is-clear'}\`}>
                {focus.length ? 'REVISIÓN PENDIENTE' : 'AL DÍA'}
              </span>
            </div>
            {focus.length ? (
              <div className="admin-attention-list">
                {focus.map((item, index) => (
                  <Link key={item.key} to={item.href} className="admin-attention-item">
                    <span className="admin-attention-number">0{index + 1}</span>
                    <span className="admin-attention-main">
                      <strong>{item.title}</strong>
                      <small>{item.hint}</small>
                    </span>
                    <span className="admin-attention-cta">{item.cta}<ArrowRight className="h-4 w-4" aria-hidden /></span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="admin-attention-clear">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
                Todos los proyectos activos tienen su ficha completa.
              </div>
            )}
          </section>

          <div className="admin-command-section-heading admin-command-section-heading-spaced">
            <div>
              <span className="admin-overline">OPERACIÓN</span>
              <h2>Actividad del archivo</h2>
            </div>
            <Link to={\`\${base}/proyectos\`} className="admin-command-link">Gestionar proyectos <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>

          <div className="admin-command-workspace">
            <section className="admin-work-card admin-work-card-wide" aria-labelledby="admin-recent-title">
              <div className="admin-work-card-header">
                <div>
                  <span className="admin-overline">SEGUIMIENTO</span>
                  <h3 id="admin-recent-title">Últimos proyectos editados</h3>
                  <p>Acceso directo a las fichas que han tenido actividad reciente.</p>
                </div>
                <span className="admin-work-card-count">{recentlyEdited.length.toString().padStart(2, '0')}</span>
              </div>
              {recentlyEdited.length ? (
                <div className="admin-project-list">
                  {recentlyEdited.map((project, index) => {
                    const issues = getProjectIssues(project)
                    return (
                      <Link key={project.id} to={\`\${base}/proyectos/\${project.id}\`} className="admin-project-line">
                        <span className="admin-project-number">{String(index + 1).padStart(2, '0')}</span>
                        <span className="admin-project-cover">
                          {project.coverImage ? <img src={project.coverImage} alt="" loading="lazy" /> : <Images className="h-5 w-5" aria-hidden />}
                        </span>
                        <span className="admin-project-copy">
                          <strong>{project.title || 'Sin título'}</strong>
                          <small>{project.area || 'Sin área'} · {formatRelative(project.updatedAt)}</small>
                        </span>
                        <span className="admin-project-status"><StatusBadge status={project.status} /></span>
                        <span className={\`admin-project-completeness \${issues.complete ? 'is-complete' : 'is-incomplete'}\`}>
                          {issues.complete ? 'Ficha completa' : \`\${issues.errors.length} pendientes\`}
                        </span>
                        <ArrowRight className="admin-project-arrow h-4 w-4" aria-hidden />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <AdminEmptyState compact icon={FolderKanban} title="Sin proyectos recientes" description="Los proyectos editados aparecerán aquí." />
              )}
            </section>

            <div className="admin-command-rail">
              <section className="admin-work-card" aria-labelledby="admin-activity-title">
                <div className="admin-work-card-header">
                  <div>
                    <span className="admin-overline">REGISTRO</span>
                    <h3 id="admin-activity-title">Actividad reciente</h3>
                  </div>
                  <Link to={\`\${base}/historial\`} className="admin-icon-link" aria-label="Ver historial"><ArrowRight className="h-4 w-4" aria-hidden /></Link>
                </div>
                {recent.length ? (
                  <ol className="admin-event-list">
                    {recent.slice(0, 5).map((entry) => (
                      <li key={entry.id} className="admin-event-item">
                        <span className={\`admin-event-marker is-\${entry.type}\`} />
                        <div><p>{entry.message}</p><small><Clock className="h-3 w-3" aria-hidden /> {formatRelative(entry.at)} <span>·</span> {ACTIVITY_LABEL[entry.type]}</small></div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <AdminEmptyState compact icon={History} title="Sin actividad" description="Los cambios del panel aparecerán aquí." />
                )}
              </section>

              <section className="admin-work-card" aria-labelledby="admin-quick-title">
                <div className="admin-work-card-header">
                  <div><span className="admin-overline">ATAJOS</span><h3 id="admin-quick-title">Acciones rápidas</h3></div>
                </div>
                <div className="admin-quick-actions">
                  <Link to={\`\${base}/proyectos/nuevo\`}><Plus className="h-4 w-4" aria-hidden /><span>Crear proyecto</span><ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
                  <Link to={\`\${base}/cargas\`}><CloudUpload className="h-4 w-4" aria-hidden /><span>Subir archivos</span><ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
                  <Link to={\`\${base}/ajustes\`}><Settings className="h-4 w-4" aria-hidden /><span>Configurar portada</span><ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
                </div>
              </section>
            </div>
          </div>

          <div className="admin-command-section-heading admin-command-section-heading-spaced">
            <div><span className="admin-overline">PRESENCIA PÚBLICA</span><h2>Lo que ve el invitado</h2></div>
            <Link to={\`\${base}/ajustes\`} className="admin-command-link">Editar portada <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <section className="admin-work-card admin-public-preview">
            <div className="admin-public-summary">
              <span className="admin-public-emblem"><Star className="h-5 w-5" aria-hidden /></span>
              <div><strong>{featured.length} proyectos destacados</strong><p>Selección visible en la portada pública de {settings.shortName}.</p></div>
              <span className="admin-public-count">{published.length} publicados</span>
            </div>
            {featured.length ? (
              <div className="admin-featured-grid">
                {featured.map((project, index) => (
                  <Link key={project.id} to={\`\${base}/proyectos/\${project.id}\`} className="admin-featured-project">
                    <span className="admin-featured-index">DESTACADO 0{index + 1}</span>
                    <span className="admin-featured-image">{project.coverImage ? <img src={project.coverImage} alt="" loading="lazy" /> : <Star className="h-6 w-6" aria-hidden />}</span>
                    <span className="admin-featured-copy"><strong>{project.title}</strong><small>{project.area} · {project.year}</small></span>
                    <ArrowRight className="admin-featured-arrow h-4 w-4" aria-hidden />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="admin-public-empty">No hay proyectos destacados. El catálogo mostrará los publicados más recientes.</p>
            )}
          </section>

          <div className="admin-command-section-heading admin-command-section-heading-spaced">
            <div><span className="admin-overline">CATALOGACIÓN</span><h2>Composición del archivo</h2></div>
            <span className="admin-section-note">Distribución por categorías, periodos y autores</span>
          </div>
          <div className="admin-command-inventory">
            <InventoryCard id="areas-title" title="Áreas" icon={Layers3} empty="Sin áreas registradas." items={areas} href={(label) => \`\${base}/proyectos?area=\${encodeURIComponent(label)}\`} />
            <InventoryCard id="years-title" title="Años" icon={CalendarDays} empty="Sin años documentados." items={years} href={(label) => \`\${base}/proyectos?year=\${encodeURIComponent(label)}\`} />
            <InventoryCard id="collections-title" title="Colecciones" icon={BookOpen} empty="Ningún proyecto tiene colección." items={collections} href={(label) => \`\${base}/proyectos?collection=\${encodeURIComponent(label)}\`} />
          </div>
          <section className="admin-work-card admin-authors-card" aria-labelledby="authors-title">
            <div className="admin-work-card-header">
              <div><span className="admin-overline">COMUNIDAD ACADÉMICA</span><h3 id="authors-title">Autores del archivo</h3></div>
              <span className="admin-work-card-count">{authorList.length.toString().padStart(2, '0')}</span>
            </div>
            {authorList.length ? (
              <div className="admin-author-cloud">
                {authorList.slice(0, 20).map((item) => (
                  <Link key={item.label} to={\`\${base}/proyectos?q=\${encodeURIComponent(item.label)}\`} className="admin-author-chip">
                    <span>{item.label}</span><b>{item.count}</b>
                  </Link>
                ))}
              </div>
            ) : <p className="admin-public-empty">Todavía no hay autores registrados en las fichas.</p>}
          </section>
        </>
      )}
    </div>
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
