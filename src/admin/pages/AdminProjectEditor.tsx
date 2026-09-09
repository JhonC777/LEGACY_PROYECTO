import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FolderKanban,
  ImagePlus,
  Images,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { getProjectHref } from '@/data/demoData'
import { cn } from '@/lib/cn'
import { useDeferredAction } from '@/lib/useDeferredAction'
import { AdminEmptyState, AdminErrorState, Skeleton } from '../components/AdminStates'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatusBadge } from '../components/StatusBadge'
import { formatBytes, formatRelative } from '../format'
import { createId, emptyDraft, getProjectIssues, useAdminStore } from '../store'
import { useToast } from '../toast'
import type { AdminProject, ProjectDraftInput } from '../types'

type UploadTarget = { id: string; target: 'cover' | 'gallery' }

const SECTIONS = [
  { id: 'basicos', label: 'Datos básicos', icon: FolderKanban },
  { id: 'contenido', label: 'Contenido académico', icon: BookOpen },
  { id: 'autores', label: 'Autores', icon: Users },
  { id: 'medios', label: 'Portada y galería', icon: Images },
  { id: 'recursos', label: 'Recursos', icon: Paperclip },
] as const

const splitList = (value: string) =>
  [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]

export function AdminProjectEditor() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const defer = useDeferredAction()
  const {
    institution,
    projects,
    media,
    status,
    reload,
    createProject,
    updateProject,
    setProjectStatus,
    deleteProject,
    uploadFiles,
  } = useAdminStore()

  const base = `/admin/${institution.slug}`
  const isNew = !projectId
  const existing = useMemo(
    () => (projectId ? projects.find((project) => project.id === projectId) : undefined),
    [projectId, projects],
  )

  const [form, setForm] = useState<ProjectDraftInput>(() => emptyDraft())
  const [tagsText, setTagsText] = useState('')
  const [techText, setTechText] = useState('')
  const [snapshot, setSnapshot] = useState('')
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirm, setConfirm] = useState<'leave' | 'delete' | 'publish' | null>(null)
  const pendingUploads = useRef<UploadTarget[]>([])

  const suggestions = useMemo(
    () => ({
      areas: [...new Set(projects.map((project) => project.area).filter(Boolean))].sort(),
      categories: [...new Set(projects.map((project) => project.category).filter(Boolean))].sort(),
      collections: [
        ...new Set(projects.map((project) => project.collection).filter((v): v is string => Boolean(v))),
      ].sort(),
    }),
    [projects],
  )

  // Hidrata el formulario cuando el store está listo (o al cambiar de proyecto).
  useEffect(() => {
    if (status !== 'ready') return
    const key = projectId ?? 'new'
    if (hydratedFor === key) return
    const source: ProjectDraftInput = existing
      ? {
          title: existing.title,
          subtitle: existing.subtitle,
          area: existing.area,
          category: existing.category,
          year: existing.year,
          authors: existing.authors.map((author) => ({ ...author })),
          description: existing.description,
          problem: existing.problem,
          solution: existing.solution,
          methodology: existing.methodology,
          results: existing.results,
          technologies: [...existing.technologies],
          tags: [...existing.tags],
          collection: existing.collection,
          coverImage: existing.coverImage,
          gallery: [...existing.gallery],
          docUrl: existing.docUrl,
          videoUrl: existing.videoUrl,
          pdfUrl: existing.pdfUrl,
          isFeatured: existing.isFeatured,
        }
      : emptyDraft()
    setForm(source)
    setTagsText(source.tags.join(', '))
    setTechText(source.technologies.join(', '))
    setSnapshot(JSON.stringify({ ...source, tags: source.tags.join(', '), technologies: source.technologies.join(', ') }))
    setHydratedFor(key)
  }, [status, projectId, existing, hydratedFor])

  // Aplica las cargas que terminaron (portada / galería).
  useEffect(() => {
    if (pendingUploads.current.length === 0) return
    const done: UploadTarget[] = []
    pendingUploads.current.forEach((pending) => {
      const asset = media.find((item) => item.id === pending.id)
      if (!asset) {
        done.push(pending)
        return
      }
      if (asset.status === 'ready') {
        setForm((current) =>
          pending.target === 'cover'
            ? { ...current, coverImage: asset.url }
            : { ...current, gallery: [...current.gallery, asset.url] },
        )
        done.push(pending)
      }
      if (asset.status === 'error') done.push(pending)
    })
    if (done.length > 0) {
      pendingUploads.current = pendingUploads.current.filter((item) => !done.includes(item))
    }
  }, [media])

  const composed = useMemo<ProjectDraftInput>(
    () => ({ ...form, tags: splitList(tagsText), technologies: splitList(techText) }),
    [form, tagsText, techText],
  )

  const dirty =
    hydratedFor !== null &&
    JSON.stringify({ ...form, tags: tagsText, technologies: techText }) !== snapshot

  const previewProject = useMemo<AdminProject>(
    () => ({
      ...composed,
      id: existing?.id ?? 'preview',
      slug: existing?.slug ?? 'vista-previa',
      institutionId: institution.id,
      status: existing?.status ?? 'draft',
      updatedAt: existing?.updatedAt ?? new Date().toISOString(),
      publishedAt: existing?.publishedAt,
    }),
    [composed, existing, institution.id],
  )
  const issues = getProjectIssues(previewProject)

  const uploadingAssets = media.filter(
    (asset) => asset.status === 'uploading' && pendingUploads.current.some((p) => p.id === asset.id),
  )

  const set = <K extends keyof ProjectDraftInput>(key: K, value: ProjectDraftInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const persist = () => {
    if (isNew) {
      const created = createProject(composed)
      return created
    }
    return existing ? updateProject(existing.id, composed) : undefined
  }

  const handleSave = () => {
    setSaving(true)
    defer(() => {
      const saved = persist()
      setSaving(false)
      if (!saved) {
        notify({ tone: 'error', title: 'No se pudo guardar', description: 'El proyecto ya no existe.' })
        return
      }
      setSnapshot(JSON.stringify({ ...form, tags: tagsText, technologies: techText }))
      notify({
        tone: 'success',
        title: isNew ? 'Borrador creado' : 'Cambios guardados',
        description: `«${saved.title || 'Sin título'}» · ${
          saved.status === 'published' ? 'los cambios ya se ven en el sitio' : 'guardado como borrador'
        }`,
      })
      if (isNew) navigate(`${base}/proyectos/${saved.id}`, { replace: true })
    }, 420)
  }

  const handlePublish = () => {
    setConfirm(null)
    setSaving(true)
    defer(() => {
      const saved = persist()
      if (!saved) {
        setSaving(false)
        notify({ tone: 'error', title: 'No se pudo publicar', description: 'El proyecto ya no existe.' })
        return
      }
      const result = setProjectStatus(saved.id, 'published')
      setSaving(false)
      if (result.ok) {
        setSnapshot(JSON.stringify({ ...form, tags: tagsText, technologies: techText }))
        notify({
          tone: 'success',
          title: 'Proyecto publicado',
          description: `«${saved.title}» ya aparece en el catálogo público.`,
        })
        if (isNew) navigate(`${base}/proyectos/${saved.id}`, { replace: true })
      } else {
        notify({
          tone: 'error',
          title: 'Faltan datos para publicar',
          description: result.errors.slice(0, 3).join(' · '),
        })
        if (isNew) navigate(`${base}/proyectos/${saved.id}`, { replace: true })
      }
    }, 480)
  }

  const handleDelete = () => {
    if (!existing) return
    deleteProject(existing.id)
    setConfirm(null)
    notify({ tone: 'success', title: 'Proyecto eliminado', description: `«${existing.title}» se eliminó del archivo.` })
    navigate(`${base}/proyectos`, { replace: true })
  }

  const handleBack = () => {
    if (dirty) setConfirm('leave')
    else navigate(`${base}/proyectos`)
  }

  const onPickFiles = (target: UploadTarget['target']) => (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (images.length !== files.length) {
      notify({ tone: 'error', title: 'Solo imágenes', description: 'La portada y la galería aceptan únicamente archivos de imagen.' })
    }
    if (images.length === 0) return
    const ids = uploadFiles(target === 'cover' ? images.slice(0, 1) : images, existing?.id)
    pendingUploads.current.push(...ids.map((id) => ({ id, target })))
  }

  const updateAuthor = (id: string, patch: Partial<{ name: string; role: string }>) =>
    set(
      'authors',
      form.authors.map((author) => (author.id === id ? { ...author, ...patch } : author)),
    )

  /* ---------- estados de carga ---------- */

  if (status === 'loading' || (status === 'ready' && hydratedFor === null)) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Cargando editor">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (status === 'error') return <AdminErrorState onRetry={reload} />

  if (!isNew && !existing) {
    return (
      <AdminEmptyState
        icon={FolderKanban}
        title="Este proyecto no existe"
        description="Puede haberse eliminado o pertenecer a otra institución."
        action={
          <Link to={`${base}/proyectos`} className="btn btn-primary btn-md">
            Volver a proyectos
          </Link>
        }
      />
    )
  }

  const currentStatus = existing?.status ?? 'draft'
  const canPublish = issues.complete && !saving
  const publishLabel = currentStatus === 'published' ? 'Guardar y actualizar' : 'Publicar'

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <button type="button" onClick={handleBack} className="btn btn-ghost btn-sm -ml-2">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Proyectos
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[clamp(1.6rem,2.8vw,2.2rem)] leading-tight font-semibold text-legacy-white">
              {isNew ? 'Nuevo proyecto' : form.title || 'Sin título'}
            </h1>
            <StatusBadge status={currentStatus} />
            {dirty ? (
              <span className="admin-dirty">
                <CircleDashed className="h-3 w-3" aria-hidden />
                Cambios sin guardar
              </span>
            ) : null}
          </div>
          {existing ? (
            <p className="mt-1 text-xs text-legacy-muted">
              Última edición {formatRelative(existing.updatedAt)}
              {existing.publishedAt ? ` · publicado ${formatRelative(existing.publishedAt)}` : ''}
            </p>
          ) : (
            <p className="mt-1 text-xs text-legacy-muted">
              Se guardará como borrador. Publica cuando la lista de requisitos esté completa.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-md"
            onClick={() => setPreviewOpen((open) => !open)}
            aria-pressed={previewOpen}
          >
            {previewOpen ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            Vista previa
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={handleSave}
            disabled={saving || (!dirty && !isNew)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            {isNew ? 'Guardar borrador' : 'Guardar'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => setConfirm('publish')}
            disabled={!canPublish}
            title={canPublish ? undefined : 'Completa los requisitos para publicar'}
          >
            <Send className="h-4 w-4" aria-hidden />
            {publishLabel}
          </button>
        </div>
      </div>

      {previewOpen ? (
        <section className="admin-card mt-6 p-5" aria-label="Vista previa de la tarjeta">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-legacy-white">Así se verá en el catálogo</h2>
              <p className="text-xs text-legacy-muted">
                Tarjeta generada con los datos actuales del formulario (no interactiva).
              </p>
            </div>
            {existing?.status === 'published' ? (
              <Link to={getProjectHref(existing)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Abrir ficha pública
              </Link>
            ) : null}
          </div>
          <div className="pointer-events-none mx-auto max-w-sm select-none" aria-hidden>
            <ProjectCard project={previewProject} />
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
        >
          <Section id="basicos" icon={FolderKanban} title="Datos básicos" description="Identifican el proyecto en el catálogo y en los filtros.">
            <Field label="Título" required hint={`${form.title.length}/120`}>
              <input
                className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                value={form.title}
                maxLength={120}
                onChange={(event) => set('title', event.target.value)}
                placeholder="Nombre del proyecto académico"
              />
            </Field>
            <Field label="Subtítulo" hint="Una línea que resume el enfoque">
              <input
                className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                value={form.subtitle}
                maxLength={160}
                onChange={(event) => set('subtitle', event.target.value)}
                placeholder="Ej. Ciencias naturales aplicadas al cuidado del entorno"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Área de conocimiento" required>
                <input
                  className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                  value={form.area}
                  list="areas-list"
                  onChange={(event) => set('area', event.target.value)}
                  placeholder="Ej. Ciencias Naturales"
                />
                <datalist id="areas-list">
                  {suggestions.areas.map((area) => <option key={area} value={area} />)}
                </datalist>
              </Field>
              <Field label="Categoría" required>
                <input
                  className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                  value={form.category}
                  list="categories-list"
                  onChange={(event) => set('category', event.target.value)}
                  placeholder="Ej. Medio Ambiente"
                />
                <datalist id="categories-list">
                  {suggestions.categories.map((item) => <option key={item} value={item} />)}
                </datalist>
              </Field>
              <Field label="Año" required>
                <input
                  type="number"
                  className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                  value={form.year}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  onChange={(event) => set('year', Number(event.target.value) || 0)}
                />
              </Field>
              <Field label="Colección" hint="Agrupa proyectos afines">
                <input
                  className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                  value={form.collection ?? ''}
                  list="collections-list"
                  onChange={(event) => set('collection', event.target.value || undefined)}
                  placeholder="Opcional"
                />
                <datalist id="collections-list">
                  {suggestions.collections.map((item) => <option key={item} value={item} />)}
                </datalist>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Etiquetas" hint="Separadas por coma">
                <input
                  className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                  placeholder="agua, sensores, sostenibilidad"
                />
                <Chips items={splitList(tagsText)} />
              </Field>
              <Field label="Tecnologías o herramientas" hint="Separadas por coma">
                <input
                  className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                  value={techText}
                  onChange={(event) => setTechText(event.target.value)}
                  placeholder="Arduino, JavaScript"
                />
                <Chips items={splitList(techText)} />
              </Field>
            </div>
          </Section>

          <Section id="contenido" icon={BookOpen} title="Contenido académico" description="La ficha pública se estructura con estas secciones.">
            <TextArea label="Descripción general" required value={form.description} onChange={(v) => set('description', v)} rows={4} hint={`${form.description.trim().length} caracteres · mínimo 40`} />
            <TextArea label="Problema" required value={form.problem} onChange={(v) => set('problem', v)} rows={3} />
            <TextArea label="Solución" required value={form.solution} onChange={(v) => set('solution', v)} rows={3} />
            <TextArea label="Metodología" value={form.methodology} onChange={(v) => set('methodology', v)} rows={3} />
            <TextArea label="Resultados" required value={form.results} onChange={(v) => set('results', v)} rows={3} />
          </Section>

          <Section
            id="autores"
            icon={Users}
            title="Autores"
            description="Estudiantes y roles que participaron. No se crean cuentas: es solo información de la ficha."
            action={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  set('authors', [...form.authors, { id: createId('author'), name: '', role: '' }])
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
                Añadir autor
              </button>
            }
          >
            {form.authors.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-sm text-legacy-muted">
                Aún no hay autores. Añade al menos uno para poder publicar.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {form.authors.map((author, index) => (
                  <li key={author.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center">
                    <input
                      className="glass-input liquid-field w-full rounded-lg px-3 py-2.5 text-sm"
                      value={author.name}
                      onChange={(event) => updateAuthor(author.id, { name: event.target.value })}
                      placeholder={`Nombre del autor ${index + 1}`}
                      aria-label={`Nombre del autor ${index + 1}`}
                    />
                    <input
                      className="glass-input liquid-field w-full rounded-lg px-3 py-2.5 text-sm"
                      value={author.role}
                      onChange={(event) => updateAuthor(author.id, { role: event.target.value })}
                      placeholder="Rol (ej. Investigación)"
                      aria-label={`Rol del autor ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm justify-self-end"
                      onClick={() => set('authors', form.authors.filter((item) => item.id !== author.id))}
                      aria-label={`Quitar autor ${index + 1}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="medios" icon={Images} title="Portada y galería" description="Imágenes que representan el proyecto. Límite demo: 15 MB por archivo.">
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                  Portada <span className="text-legacy-gold">*</span>
                </p>
                <label className={cn('admin-dropzone aspect-[4/3]', form.coverImage && 'has-media')}>
                  <input type="file" accept="image/*" className="sr-only" onChange={onPickFiles('cover')} />
                  {form.coverImage ? (
                    <img src={form.coverImage} alt="Portada actual" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-center text-xs text-legacy-muted">
                      <ImagePlus className="h-6 w-6 text-legacy-gold" aria-hidden />
                      Subir portada
                    </span>
                  )}
                  <span className="admin-dropzone-overlay">
                    <ImagePlus className="h-4 w-4" aria-hidden />
                    {form.coverImage ? 'Reemplazar' : 'Elegir imagen'}
                  </span>
                </label>
                {form.coverImage ? (
                  <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => set('coverImage', '')}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Quitar portada
                  </button>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                    Galería <span className="font-medium normal-case tracking-normal">· {form.gallery.length} imágenes</span>
                  </p>
                  <label className="btn btn-secondary btn-sm cursor-pointer">
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={onPickFiles('gallery')} />
                    <Plus className="h-4 w-4" aria-hidden />
                    Añadir
                  </label>
                </div>
                {form.gallery.length === 0 && uploadingAssets.length === 0 ? (
                  <label className="admin-dropzone flex min-h-[9rem] cursor-pointer">
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={onPickFiles('gallery')} />
                    <span className="flex flex-col items-center gap-2 text-center text-xs text-legacy-muted">
                      <Images className="h-6 w-6 text-legacy-gold" aria-hidden />
                      Arrastra o elige imágenes para la galería
                    </span>
                  </label>
                ) : (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {form.gallery.map((url, index) => (
                      <li key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-legacy-surface">
                        <img src={url} alt={`Imagen ${index + 1} de la galería`} className="h-full w-full object-cover" loading="lazy" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-legacy-black/70 text-legacy-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => set('gallery', form.gallery.filter((_, i) => i !== index))}
                          aria-label={`Quitar imagen ${index + 1}`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                    {uploadingAssets.map((asset) => (
                      <li key={asset.id} className="relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-legacy-gold/25 bg-legacy-gold/[0.05] p-2 text-center">
                        <Loader2 className="h-4 w-4 animate-spin text-legacy-gold" aria-hidden />
                        <span className="text-[10px] text-legacy-muted">{asset.progress}%</span>
                        <span className="admin-progress absolute inset-x-2 bottom-2">
                          <span style={{ width: `${asset.progress}%` }} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {uploadingAssets.length > 0 ? (
              <ul className="space-y-1.5" aria-live="polite">
                {uploadingAssets.map((asset) => (
                  <li key={asset.id} className="flex items-center gap-3 text-xs text-legacy-muted">
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-legacy-gold" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{asset.name} · {formatBytes(asset.size)}</span>
                    <span className="admin-progress w-28">
                      <span style={{ width: `${asset.progress}%` }} />
                    </span>
                    <span className="w-9 text-right tabular-nums">{asset.progress}%</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section id="recursos" icon={Paperclip} title="Recursos" description="Enlaces al documento, PDF o video del proyecto. Puedes pegar URLs externas o usar archivos de Cargas.">
            <UrlField label="Documento" icon={FileText} value={form.docUrl ?? ''} onChange={(v) => set('docUrl', v || undefined)} placeholder="https://..." />
            <UrlField label="PDF" icon={Paperclip} value={form.pdfUrl ?? ''} onChange={(v) => set('pdfUrl', v || undefined)} placeholder="https://..." />
            <UrlField label="Video" icon={Link2} value={form.videoUrl ?? ''} onChange={(v) => set('videoUrl', v || undefined)} placeholder="https://..." />
          </Section>

          {existing ? (
            <section className="admin-card border-red-400/20 p-5">
              <h2 className="font-display text-lg font-semibold text-legacy-white">Zona de riesgo</h2>
              <p className="mt-1 text-sm text-legacy-muted">
                Eliminar el proyecto lo quita del archivo y del sitio público. No se puede deshacer.
              </p>
              <button type="button" className="btn btn-destructive btn-sm mt-4" onClick={() => setConfirm('delete')}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Eliminar proyecto
              </button>
            </section>
          ) : null}
        </form>

        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <nav className="admin-card p-3" aria-label="Secciones del formulario">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className="admin-nav-link">
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </a>
            ))}
          </nav>

          <section className={cn('admin-card p-5', issues.complete ? 'is-gold' : '')} aria-labelledby="checklist-title">
            <div className="flex items-center gap-2">
              {issues.complete ? (
                <CheckCircle2 className="h-5 w-5 text-legacy-gold" aria-hidden />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden />
              )}
              <h2 id="checklist-title" className="font-display text-lg font-semibold text-legacy-white">
                {issues.complete ? 'Listo para publicar' : 'Requisitos para publicar'}
              </h2>
            </div>
            {issues.errors.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {issues.errors.map((error) => (
                  <li key={error} className="flex items-start gap-2 text-sm text-legacy-white/85">
                    <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
                    {error}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-legacy-muted">
                La ficha cumple todos los requisitos obligatorios.
              </p>
            )}
            {issues.warnings.length > 0 ? (
              <>
                <p className="mt-4 text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                  Recomendado
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-legacy-muted">
                  {issues.warnings.map((warning) => (
                    <li key={warning}>· {warning}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === 'leave'}
        title="Tienes cambios sin guardar"
        description="Si sales ahora, los cambios de esta ficha se perderán."
        confirmLabel="Salir sin guardar"
        tone="destructive"
        onConfirm={() => navigate(`${base}/proyectos`)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="¿Eliminar este proyecto?"
        description="Se quitará del archivo y del sitio público. Esta acción no se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        tone="destructive"
        icon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'publish'}
        title={currentStatus === 'published' ? '¿Actualizar la publicación?' : '¿Publicar este proyecto?'}
        description={
          currentStatus === 'published'
            ? 'Los cambios se guardarán y quedarán visibles de inmediato en el sitio público.'
            : 'Se guardará la ficha y aparecerá de inmediato en el catálogo público de tu institución.'
        }
        confirmLabel={currentStatus === 'published' ? 'Guardar y actualizar' : 'Publicar'}
        icon={Send}
        loading={saving}
        onConfirm={handlePublish}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}

/* ---------- piezas del formulario ---------- */

function Section({
  id,
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  id: string
  icon: typeof FolderKanban
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="admin-card scroll-mt-4 p-5" aria-labelledby={`${id}-title`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="admin-stat-icon mt-0.5">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 id={`${id}-title`} className="font-display text-xl font-semibold text-legacy-white">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-xs text-legacy-muted">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
          {label} {required ? <span className="text-legacy-gold">*</span> : null}
        </span>
        {hint ? <span className="text-[11px] text-legacy-muted/80">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows: number
  required?: boolean
  hint?: string
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <textarea
        className="glass-input liquid-field w-full resize-y rounded-xl px-4 py-3 text-sm leading-relaxed"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

function UrlField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  label: string
  icon: typeof FileText
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const valid = !value || /^https?:\/\/\S+$/i.test(value) || value.startsWith('#')
  return (
    <Field label={label} hint={valid ? undefined : 'Debe ser una URL válida (https://...)'}>
      <span className="relative block">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-legacy-muted" aria-hidden />
        <input
          type="url"
          className={cn(
            'glass-input liquid-field w-full rounded-xl py-3 pr-4 pl-10 text-sm',
            !valid && 'border-red-400/50',
          )}
          value={value}
          onChange={(event) => onChange(event.target.value.trim())}
          placeholder={placeholder}
          aria-invalid={!valid}
        />
      </span>
    </Field>
  )
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="admin-chip">
          {item}
        </span>
      ))}
    </span>
  )
}
