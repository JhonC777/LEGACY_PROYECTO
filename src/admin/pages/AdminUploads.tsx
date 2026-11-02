import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  AlertTriangle,
  CloudUpload,
  Copy,
  FileText,
  Film,
  Images,
  Loader2,
  Paperclip,
  RefreshCw,
  SearchX,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../components/AdminStates'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageHeader } from '../components/PageHeader'
import { formatBytes, formatRelative } from '../format'
import { useAdminStore } from '../store'
import { useToast } from '../toast'
import { UPLOAD_LIMIT_BYTES, type MediaAsset, type MediaKind } from '../types'

type KindFilter = 'all' | MediaKind

const KIND_META: Record<MediaKind, { label: string; icon: LucideIcon }> = {
  image: { label: 'Imagen', icon: Images },
  pdf: { label: 'PDF', icon: FileText },
  doc: { label: 'Documento', icon: Paperclip },
  video: { label: 'Video', icon: Film },
}

export function AdminUploads() {
  const { institution, media, projects, status, reload, uploadRepositoryFiles, retryUpload, removeMedia, updateProject } =
    useAdminStore()
  const { notify } = useToast()
  const [kind, setKind] = useState<KindFilter>('all')
  const [query, setQuery] = useState('')
  const [dragging, setDragging] = useState(false)
  const [toDelete, setToDelete] = useState<MediaAsset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const base = `/admin/${institution.slug}`

  const counts = useMemo(
    () => ({
      all: media.length,
      image: media.filter((asset) => asset.kind === 'image').length,
      pdf: media.filter((asset) => asset.kind === 'pdf').length,
      doc: media.filter((asset) => asset.kind === 'doc').length,
      video: media.filter((asset) => asset.kind === 'video').length,
    }),
    [media],
  )

  const visible = useMemo(
    () =>
      [...media]
        .filter((asset) => {
          const projectTitle = projects.find((project) => project.id === asset.projectId)?.title ?? ''
          const matchesQuery = asset.name.toLowerCase().includes(query.toLowerCase()) ||
            projectTitle.toLowerCase().includes(query.toLowerCase())
          return (kind === 'all' || asset.kind === kind) && matchesQuery
        })
        .sort((a, b) => {
          const rank = (asset: MediaAsset) =>
            asset.status === 'uploading' ? 0 : asset.status === 'error' ? 1 : 2
          return rank(a) - rank(b) || (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? '')
        }),
    [media, kind, query, projects],
  )

  const visibleGroups = useMemo(() => {
    const groups = new Map<string, MediaAsset[]>()
    visible.forEach((asset) => {
      const key = asset.projectId && projects.some((project) => project.id === asset.projectId)
        ? asset.projectId
        : '__unassigned__'
      groups.set(key, [...(groups.get(key) ?? []), asset])
    })
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === '__unassigned__') return 1
      if (b === '__unassigned__') return -1
      const titleA = projects.find((project) => project.id === a)?.title ?? a
      const titleB = projects.find((project) => project.id === b)?.title ?? b
      return titleA.localeCompare(titleB, 'es')
    })
  }, [visible, projects])

  const uploading = media.filter((asset) => asset.status === 'uploading')
  const totalBytes = media
    .filter((asset) => asset.status === 'ready')
    .reduce((sum, asset) => sum + asset.size, 0)

  const handleFiles = (files: FileList | null) => {
    const list = Array.from(files ?? [])
    if (list.length === 0) return
    const rejected = list.filter((file) => file.size > UPLOAD_LIMIT_BYTES).length
    void uploadRepositoryFiles(list)
    notify({
      tone: rejected > 0 ? 'error' : 'info',
      title:
        rejected > 0
          ? `${rejected} archivo${rejected === 1 ? '' : 's'} supera${rejected === 1 ? '' : 'n'} el límite`
          : `${list.length} archivo${list.length === 1 ? '' : 's'} en proceso`,
      description:
        rejected > 0
          ? 'El límite es 15 MB por archivo. El resto continúa subiendo.'
          : 'Se guardan directamente en Supabase Storage y estarán disponibles después de recargar.',
    })
  }

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const copyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url)
      notify({ tone: 'success', title: 'Enlace copiado', description: 'Pégalo en la sección Recursos de un proyecto.' })
    } catch {
      notify({ tone: 'error', title: 'No se pudo copiar', description: 'Tu navegador bloqueó el acceso al portapapeles.' })
    }
  }

  const assignToProject = async (asset: MediaAsset, projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    if (!project || asset.status !== 'ready' || assigningId) return
    setAssigningId(asset.id)
    try {
      if (asset.kind === 'image') {
        const gallery = project.gallery.includes(asset.url)
          ? project.gallery
          : [...project.gallery, asset.url]
        await updateProject(project.id, { gallery })
      } else if (asset.kind === 'video') {
        if (project.videoUrl && project.videoUrl !== asset.url) {
          throw new Error('Este proyecto ya tiene un video asignado. Para proteger el recurso actual, no lo reemplacé.')
        }
        await updateProject(project.id, { videoUrl: asset.url })
      } else if (asset.kind === 'pdf') {
        if (project.pdfUrl && project.pdfUrl !== asset.url) {
          throw new Error('Este proyecto ya tiene un PDF asignado. Para proteger el recurso actual, no lo reemplacé.')
        }
        await updateProject(project.id, { pdfUrl: asset.url })
      } else {
        if (project.docUrl && project.docUrl !== asset.url) {
          throw new Error('Este proyecto ya tiene un documento asignado. Para proteger el recurso actual, no lo reemplacé.')
        }
        await updateProject(project.id, { docUrl: asset.url })
      }
      reload()
      notify({
        tone: 'success',
        title: 'Archivo asociado',
        description: `«${asset.name}» quedó vinculado a «${project.title}».`,
      })
    } catch (error) {
      notify({
        tone: 'error',
        title: 'No se pudo asociar el archivo',
        description: error instanceof Error ? error.message : 'No se guardó la asociación del archivo.',
      })
    } finally {
      setAssigningId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete || deleting) return
    setDeleting(true)
    try {
      await removeMedia(toDelete.id)
      notify({ tone: 'success', title: 'Archivo eliminado', description: `«${toDelete.name}» se quitó del repositorio.` })
      setToDelete(null)
    } catch (error) {
      notify({
        tone: 'error',
        title: 'No se pudo eliminar',
        description: error instanceof Error ? error.message : 'El archivo sigue protegido en el almacenamiento.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const header = (
    <PageHeader
      eyebrow="Repositorio"
      title="Cargas"
      description="Imágenes y documentos de tu institución. Súbelos aquí y úsalos en las fichas."
      actions={
        <button type="button" className="btn btn-primary btn-md" onClick={() => inputRef.current?.click()}>
          <CloudUpload className="h-4 w-4" aria-hidden />
          Subir archivos
        </button>
      }
    />
  )

  if (status === 'loading') {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminLoadingState rows={5} />
        </div>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminErrorState onRetry={reload} />
        </div>
      </>
    )
  }

  const tabs: { key: KindFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'image', label: 'Imágenes' },
    { key: 'pdf', label: 'PDF' },
    { key: 'doc', label: 'Documentos' },
    { key: 'video', label: 'Video' },
  ]

  return (
    <>
      {header}
      <input ref={inputRef} type="file" multiple className="sr-only" onChange={onInput} aria-hidden tabIndex={-1} />

      <div
        className={cn('admin-dropzone admin-dropzone-wide mt-7', dragging && 'is-dragging')}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          className="flex w-full flex-col items-center gap-2 py-8 text-center"
          onClick={() => inputRef.current?.click()}
        >
          <span className="admin-stat-icon">
            <CloudUpload className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-legacy-white">
            Arrastra archivos aquí o haz clic para elegirlos
          </span>
          <span className="text-xs text-legacy-muted">
            Imágenes, PDF, documentos y video · hasta 15 MB por archivo
          </span>
        </button>
      </div>

      {uploading.length > 0 ? (
        <section className="admin-card mt-5 p-4" aria-live="polite" aria-label="Cargas en curso">
          <p className="mb-3 text-xs font-bold tracking-[0.14em] text-legacy-gold uppercase">
            Subiendo {uploading.length}
          </p>
          <ul className="space-y-2.5">
            {uploading.map((asset) => (
              <li key={asset.id} className="flex items-center gap-3 text-xs text-legacy-muted">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-legacy-gold" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-legacy-white/90">{asset.name}</span>
                <span className="admin-progress w-40">
                  <span style={{ width: `${asset.progress}%` }} />
                </span>
                <span className="w-9 text-right tabular-nums">{asset.progress}%</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="admin-toolbar mt-6">
        <input className="glass-input liquid-field w-full max-w-sm rounded-xl px-4 py-2.5 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar archivo o proyecto…" aria-label="Buscar archivos" />
        <div className="admin-tabs" role="tablist" aria-label="Filtrar por tipo">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={kind === tab.key}
              className={cn('admin-tab', kind === tab.key && 'is-active')}
              onClick={() => setKind(tab.key)}
            >
              {tab.label}
              <span className="admin-tab-count">{counts[tab.key]}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-legacy-muted">
          {counts.all} archivos · {formatBytes(totalBytes)} en uso
        </p>
      </div>

      {media.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            icon={Images}
            title="Sin archivos todavía"
            description="Sube portadas, galerías y documentos para usarlos en las fichas de tus proyectos."
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            icon={SearchX}
            title="No hay archivos de este tipo"
            description="Cambia el filtro o sube nuevos archivos."
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setKind('all')}>
                Ver todos
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-6" aria-label="Archivos agrupados por proyecto">
          {visibleGroups.map(([groupId, assets]) => {
            const groupProject = projects.find((item) => item.id === groupId)
            return (
              <section key={groupId} aria-labelledby={'media-group-' + groupId}>
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                  <div className="min-w-0">
                    <h2 id={'media-group-' + groupId} className="truncate text-sm font-semibold text-legacy-white">
                      {groupProject?.title ?? 'Sin proyecto asociado'}
                    </h2>
                    <p className="mt-0.5 text-xs text-legacy-muted">
                      {groupProject ? 'Archivos vinculados a este proyecto' : 'Archivos institucionales independientes'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-legacy-muted">{assets.length} archivos</span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={'Archivos de ' + (groupProject?.title ?? 'Sin proyecto asociado')}>
          {assets.map((asset) => {
            const meta = KIND_META[asset.kind]
            const Icon = meta.icon
            const project = projects.find((item) => item.id === asset.projectId)
            return (
              <li key={asset.id} className={cn('admin-card admin-media', `is-${asset.status}`)}>
                <div className="admin-media-preview" aria-hidden>
                  {asset.kind === 'image' && asset.status !== 'error' ? (
                    <img src={asset.url} alt="" loading="lazy" />
                  ) : (
                    <Icon className="h-7 w-7 text-legacy-gold/80" />
                  )}
                  {asset.status === 'uploading' ? (
                    <span className="admin-media-overlay">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      {asset.progress}%
                    </span>
                  ) : null}
                  {asset.status === 'error' ? (
                    <span className="admin-media-overlay is-error">
                      <AlertTriangle className="h-5 w-5" aria-hidden />
                      Falló
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 p-3.5">
                  <p className="truncate text-sm font-semibold text-legacy-white" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="mt-0.5 text-xs text-legacy-muted">
                    {meta.label} · {formatBytes(asset.size)} · {asset.uploadedAt ? formatRelative(asset.uploadedAt) : 'Pendiente de guardar'}
                  </p>
                  {asset.error ? (
                    <p className="mt-1.5 text-xs text-red-300">{asset.error}</p>
                  ) : project ? (
                    <Link
                      to={`${base}/proyectos/${project.id}`}
                      className="mt-1.5 block truncate text-xs text-legacy-gold hover:text-legacy-gold-soft"
                    >
                      Usado en «{project.title}»
                    </Link>
                  ) : (
                    <div className="mt-1.5 space-y-2">
                      <p className="text-xs text-legacy-muted/70">Sin proyecto asociado</p>
                      {asset.status === 'ready' ? (
                        <label className="block">
                          <span className="sr-only">Asociar {asset.name} a un proyecto</span>
                          <select
                            className="glass-input liquid-field w-full rounded-lg px-2.5 py-2 text-xs"
                            value=""
                            disabled={assigningId === asset.id || projects.every((item) => item.status === 'archived')}
                            onChange={(event) => {
                              const projectId = event.target.value
                              if (projectId) void assignToProject(asset, projectId)
                            }}
                          >
                            <option value="">Asociar a un proyecto…</option>
                            {projects.filter((item) => item.status !== 'archived').map((item) => (
                              <option key={item.id} value={item.id}>{item.title}</option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1">
                    {asset.status === 'ready' ? (
                      <>
                        <a href={asset.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label={`Abrir ${asset.name}`}>
                          Abrir
                        </a>
                        <a href={asset.url} download={asset.name} className="btn btn-ghost btn-sm" aria-label={`Descargar ${asset.name}`}>
                          Descargar
                        </a>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyUrl(asset)}>
                          <Copy className="h-4 w-4" aria-hidden />
                          Copiar enlace
                        </button>
                      </>
                    ) : null}
                    {asset.status === 'error' && asset.size <= UPLOAD_LIMIT_BYTES ? (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => retryUpload(asset.id)}>
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Reintentar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm ml-auto"
                      onClick={() => setToDelete(asset)}
                      disabled={asset.status === 'uploading' || Boolean(asset.projectId)}
                      aria-label={`Eliminar ${asset.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        tone="destructive"
        icon={Trash2}
        title="¿Eliminar este archivo?"
        description={
          toDelete?.projectId
            ? 'Este archivo está vinculado a un proyecto. Para proteger la publicación, primero debes quitarlo de la ficha del proyecto.'
            : 'Se eliminará el objeto de Supabase Storage. Esta acción no se puede deshacer.'
        }
        confirmLabel={deleting ? 'Eliminando…' : 'Eliminar'}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
