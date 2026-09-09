import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import {
  getInstitutionProjects,
  type DemoInstitution,
  type ProjectStatus,
} from '@/data/demoData'
import {
  UPLOAD_LIMIT_BYTES,
  type ActivityEntry,
  type ActivityType,
  type AdminProject,
  type InstitutionSettings,
  type MediaAsset,
  type MediaKind,
  type ProjectDraftInput,
  type StoreStatus,
} from './types'

/**
 * Store DEMO del panel: todo vive en memoria y está aislado por institución.
 * El provider recibe la institución resuelta por la ruta; nunca mezcla datos.
 */

type State = {
  status: StoreStatus
  projects: AdminProject[]
  media: MediaAsset[]
  activity: ActivityEntry[]
  settings: InstitutionSettings
}

type Action =
  | { type: 'LOADED'; payload: Omit<State, 'status'> }
  | { type: 'FAILED' }
  | { type: 'LOADING' }
  | { type: 'UPSERT_PROJECT'; project: AdminProject }
  | { type: 'REMOVE_PROJECT'; id: string }
  | { type: 'ADD_MEDIA'; asset: MediaAsset }
  | { type: 'PATCH_MEDIA'; id: string; patch: Partial<MediaAsset> }
  | { type: 'REMOVE_MEDIA'; id: string }
  | { type: 'LOG'; entry: ActivityEntry }
  | { type: 'SETTINGS'; settings: InstitutionSettings }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading' }
    case 'FAILED':
      return { ...state, status: 'error' }
    case 'LOADED':
      return { status: 'ready', ...action.payload }
    case 'UPSERT_PROJECT': {
      const exists = state.projects.some((project) => project.id === action.project.id)
      return {
        ...state,
        projects: exists
          ? state.projects.map((project) =>
              project.id === action.project.id ? action.project : project,
            )
          : [action.project, ...state.projects],
      }
    }
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((project) => project.id !== action.id),
        media: state.media.map((asset) =>
          asset.projectId === action.id ? { ...asset, projectId: undefined } : asset,
        ),
        settings: {
          ...state.settings,
          featuredProjectIds: state.settings.featuredProjectIds.filter(
            (id) => id !== action.id,
          ),
        },
      }
    case 'ADD_MEDIA':
      return { ...state, media: [action.asset, ...state.media] }
    case 'PATCH_MEDIA':
      return {
        ...state,
        media: state.media.map((asset) =>
          asset.id === action.id ? { ...asset, ...action.patch } : asset,
        ),
      }
    case 'REMOVE_MEDIA':
      return { ...state, media: state.media.filter((asset) => asset.id !== action.id) }
    case 'LOG':
      return { ...state, activity: [action.entry, ...state.activity].slice(0, 200) }
    case 'SETTINGS':
      return { ...state, settings: action.settings }
    default:
      return state
  }
}

/* ---------- utilidades ---------- */

export function createId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const daysAgo = (days: number) => hoursAgo(days * 24)

export function inferMediaKind(name: string, mime = ''): MediaKind {
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) {
    return 'image'
  }
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf'
  if (mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return 'video'
  return 'doc'
}

/** Requisitos para publicar. `errors` bloquea; `warnings` solo avisa. */
export function getProjectIssues(project: AdminProject) {
  const errors: string[] = []
  const warnings: string[] = []

  if (!project.title.trim()) errors.push('Falta el título')
  if (!project.area.trim()) errors.push('Falta el área de conocimiento')
  if (!project.category.trim()) errors.push('Falta la categoría')
  if (!project.year || project.year < 1990) errors.push('Año inválido')
  if (project.description.trim().length < 40) errors.push('La descripción es muy corta')
  if (!project.coverImage) errors.push('Falta la portada')
  if (project.authors.length === 0) errors.push('Sin autores registrados')
  if (project.authors.some((author) => !author.name.trim())) {
    errors.push('Hay autores sin nombre')
  }
  if (!project.problem.trim() || !project.solution.trim() || !project.results.trim()) {
    errors.push('Contenido académico incompleto (problema, solución o resultados)')
  }

  if (!project.subtitle.trim()) warnings.push('Sin subtítulo')
  if (!project.methodology.trim()) warnings.push('Sin metodología')
  if (!project.docUrl && !project.pdfUrl && !project.videoUrl) {
    warnings.push('Sin recursos adjuntos (documento, PDF o video)')
  }
  if (project.gallery.length === 0) warnings.push('Galería vacía')
  if (project.tags.length === 0) warnings.push('Sin etiquetas')

  return { errors, warnings, complete: errors.length === 0 }
}

export function emptyDraft(area = '', category = ''): ProjectDraftInput {
  return {
    title: '',
    subtitle: '',
    area,
    category,
    year: new Date().getFullYear(),
    authors: [],
    description: '',
    problem: '',
    solution: '',
    methodology: '',
    results: '',
    technologies: [],
    tags: [],
    collection: undefined,
    coverImage: '',
    gallery: [],
    docUrl: undefined,
    videoUrl: undefined,
    pdfUrl: undefined,
    isFeatured: false,
  }
}

/* ---------- semilla demo ---------- */

function seed(institution: DemoInstitution): Omit<State, 'status'> {
  const published: AdminProject[] = getInstitutionProjects(institution.id).map(
    (project, index) => ({
      ...project,
      gallery: [...project.gallery],
      status: 'published',
      updatedAt: daysAgo(2 + index * 3),
      publishedAt: daysAgo(4 + index * 3),
    }),
  )

  // Un archivado para ejercitar el flujo (el más antiguo del catálogo demo).
  if (published.length > 3) {
    const oldest = [...published].sort((a, b) => a.year - b.year)[0]
    oldest.status = 'archived'
    oldest.updatedAt = daysAgo(45)
  }

  const refArea = published[0]?.area ?? ''
  const refCategory = published[0]?.category ?? ''
  const year = new Date().getFullYear()

  const drafts: AdminProject[] = [
    {
      id: createId('draft'),
      slug: 'borrador-demo-sin-portada',
      institutionId: institution.id,
      ...emptyDraft(refArea, refCategory),
      title: 'Borrador de demostración · ficha incompleta',
      subtitle: 'Ejemplo de proyecto en preparación',
      year,
      description:
        'Contenido de demostración. Este borrador existe para mostrar cómo el panel señala los datos que faltan antes de publicar.',
      problem: 'Pendiente de redacción.',
      tags: ['demo'],
      status: 'draft',
      updatedAt: hoursAgo(3),
    },
    {
      id: createId('draft'),
      slug: 'borrador-demo-casi-listo',
      institutionId: institution.id,
      ...emptyDraft(refArea, refCategory),
      title: 'Borrador de demostración · casi listo para publicar',
      subtitle: 'Solo falta revisar los resultados',
      year,
      authors: [{ id: createId('author'), name: 'Autor de ejemplo (demo)', role: 'Coordinación' }],
      description:
        'Contenido de demostración con todos los campos principales completos. Sirve para probar el flujo de publicación desde el panel institucional.',
      problem: 'Texto de ejemplo para el planteamiento del problema.',
      solution: 'Texto de ejemplo para la solución propuesta.',
      methodology: 'Texto de ejemplo para la metodología aplicada.',
      results: '',
      technologies: ['Demo'],
      tags: ['demo', 'publicación'],
      coverImage: published[1]?.coverImage ?? published[0]?.coverImage ?? '',
      gallery: published[1] ? [...published[1].gallery] : [],
      status: 'draft',
      updatedAt: hoursAgo(26),
    },
  ]

  const projects = [...drafts, ...published]

  const media: MediaAsset[] = published.slice(0, 6).flatMap((project, index) => {
    const image: MediaAsset = {
      id: createId('media'),
      name: `portada-${project.slug}.jpg`,
      kind: 'image',
      size: 420_000 + index * 37_000,
      url: project.coverImage,
      uploadedAt: daysAgo(5 + index * 3),
      status: 'ready',
      progress: 100,
      projectId: project.id,
    }
    if (index !== 0 || !project.pdfUrl) return [image]
    const pdf: MediaAsset = {
      id: createId('media'),
      name: `informe-${project.slug}.pdf`,
      kind: 'pdf',
      size: 1_280_000,
      url: project.pdfUrl,
      uploadedAt: daysAgo(6),
      status: 'ready',
      progress: 100,
      projectId: project.id,
    }
    return [image, pdf]
  })

  const actor = 'Equipo demo'
  const activity: ActivityEntry[] = [
    ...published.slice(0, 4).map<ActivityEntry>((project, index) => ({
      id: createId('act'),
      type: 'publish',
      message: `Publicó «${project.title}»`,
      actor,
      at: daysAgo(4 + index * 3),
      projectId: project.id,
      projectTitle: project.title,
    })),
    {
      id: createId('act'),
      type: 'upload' as const,
      message: `Subió ${media.length} archivos al repositorio de medios`,
      actor,
      at: daysAgo(6),
    },
    {
      id: createId('act'),
      type: 'create' as const,
      message: `Creó el borrador «${drafts[1].title}»`,
      actor,
      at: hoursAgo(30),
      projectId: drafts[1].id,
      projectTitle: drafts[1].title,
    },
    {
      id: createId('act'),
      type: 'create' as const,
      message: `Creó el borrador «${drafts[0].title}»`,
      actor,
      at: hoursAgo(3),
      projectId: drafts[0].id,
      projectTitle: drafts[0].title,
    },
  ].sort((a, b) => b.at.localeCompare(a.at))

  const settings: InstitutionSettings = {
    name: institution.name,
    shortName: institution.shortName,
    description: institution.description,
    accent: institution.accent,
    logoUrl: institution.logoUrl,
    featuredProjectIds: published
      .filter((project) => project.isFeatured && project.status === 'published')
      .slice(0, 6)
      .map((project) => project.id),
  }

  return { projects, media, activity, settings }
}

/* ---------- contexto ---------- */

type StoreContextValue = State & {
  institution: DemoInstitution
  reload: () => void
  createProject: (input: ProjectDraftInput) => AdminProject
  updateProject: (id: string, patch: Partial<ProjectDraftInput>) => AdminProject | undefined
  setProjectStatus: (id: string, status: ProjectStatus) => { ok: boolean; errors: string[] }
  deleteProject: (id: string) => void
  uploadFiles: (files: File[], projectId?: string) => string[]
  retryUpload: (id: string) => void
  removeMedia: (id: string) => void
  updateSettings: (patch: Partial<InstitutionSettings>) => void
  /** Curaduría de portada: sincroniza `featuredProjectIds` con `isFeatured`. */
  setFeatured: (ids: string[]) => void
  log: (type: ActivityType, message: string, project?: Pick<AdminProject, 'id' | 'title'>) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

type ProviderProps = {
  institution: DemoInstitution
  actor: string
  /** Fuerza un fallo de carga para revisar el estado de error (demo). */
  simulateError?: boolean
  children: ReactNode
}

export function AdminStoreProvider({
  institution,
  actor,
  simulateError = false,
  children,
}: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    status: 'loading',
    projects: [],
    media: [],
    activity: [],
    settings: {
      name: institution.name,
      shortName: institution.shortName,
      description: institution.description,
      accent: institution.accent,
      logoUrl: institution.logoUrl,
      featuredProjectIds: [],
    },
  })
  const timers = useRef(new Set<number>())
  const attempt = useRef(0)

  const load = useCallback(() => {
    dispatch({ type: 'LOADING' })
    const current = ++attempt.current
    const timer = window.setTimeout(() => {
      if (current !== attempt.current) return
      if (simulateError && current === 1) {
        dispatch({ type: 'FAILED' })
        return
      }
      dispatch({ type: 'LOADED', payload: seed(institution) })
    }, 520)
    timers.current.add(timer)
  }, [institution, simulateError])

  useEffect(() => {
    load()
    const pending = timers.current
    return () => {
      pending.forEach((timer) => {
        window.clearTimeout(timer)
        window.clearInterval(timer)
      })
      pending.clear()
    }
  }, [load])

  const log = useCallback<StoreContextValue['log']>(
    (type, message, project) => {
      dispatch({
        type: 'LOG',
        entry: {
          id: createId('act'),
          type,
          message,
          actor,
          at: new Date().toISOString(),
          projectId: project?.id,
          projectTitle: project?.title,
        },
      })
    },
    [actor],
  )

  const projectsRef = useRef(state.projects)
  projectsRef.current = state.projects
  const settingsRef = useRef(state.settings)
  settingsRef.current = state.settings

  const createProject = useCallback<StoreContextValue['createProject']>(
    (input) => {
      const base = slugify(input.title) || 'proyecto-sin-titulo'
      const taken = new Set(projectsRef.current.map((project) => project.slug))
      let slug = base
      let counter = 2
      while (taken.has(slug)) slug = `${base}-${counter++}`

      const project: AdminProject = {
        ...input,
        id: createId('proj'),
        slug,
        institutionId: institution.id,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'UPSERT_PROJECT', project })
      log('create', `Creó el borrador «${project.title || 'Sin título'}»`, project)
      return project
    },
    [institution.id, log],
  )

  const updateProject = useCallback<StoreContextValue['updateProject']>(
    (id, patch) => {
      const current = projectsRef.current.find((project) => project.id === id)
      if (!current) return undefined
      const project: AdminProject = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'UPSERT_PROJECT', project })
      log('update', `Actualizó «${project.title || 'Sin título'}»`, project)
      return project
    },
    [log],
  )

  const setProjectStatus = useCallback<StoreContextValue['setProjectStatus']>(
    (id, status) => {
      const current = projectsRef.current.find((project) => project.id === id)
      if (!current) return { ok: false, errors: ['El proyecto ya no existe'] }

      if (status === 'published') {
        const { errors } = getProjectIssues(current)
        if (errors.length > 0) return { ok: false, errors }
      }

      const project: AdminProject = {
        ...current,
        status,
        updatedAt: new Date().toISOString(),
        publishedAt:
          status === 'published' ? current.publishedAt ?? new Date().toISOString() : current.publishedAt,
      }
      dispatch({ type: 'UPSERT_PROJECT', project })

      if (status !== 'published' && settingsRef.current.featuredProjectIds.includes(id)) {
        dispatch({
          type: 'SETTINGS',
          settings: {
            ...settingsRef.current,
            featuredProjectIds: settingsRef.current.featuredProjectIds.filter(
              (featured) => featured !== id,
            ),
          },
        })
      }

      const verb: Record<ProjectStatus, [ActivityType, string]> = {
        published: ['publish', 'Publicó'],
        draft: [current.status === 'archived' ? 'restore' : 'unpublish', current.status === 'archived' ? 'Restauró a borrador' : 'Retiró a borrador'],
        archived: ['archive', 'Archivó'],
      }
      const [type, label] = verb[status]
      log(type, `${label} «${project.title}»`, project)
      return { ok: true, errors: [] }
    },
    [log],
  )

  const deleteProject = useCallback<StoreContextValue['deleteProject']>(
    (id) => {
      const current = projectsRef.current.find((project) => project.id === id)
      dispatch({ type: 'REMOVE_PROJECT', id })
      if (current) log('delete', `Eliminó «${current.title}»`, current)
    },
    [log],
  )

  const runUpload = useCallback(
    (asset: MediaAsset) => {
      let progress = 0
      const interval = window.setInterval(() => {
        progress = Math.min(100, progress + 8 + Math.random() * 18)
        if (progress >= 100) {
          window.clearInterval(interval)
          timers.current.delete(interval)
          dispatch({
            type: 'PATCH_MEDIA',
            id: asset.id,
            patch: { progress: 100, status: 'ready', uploadedAt: new Date().toISOString() },
          })
          log('upload', `Subió «${asset.name}»`)
          return
        }
        dispatch({ type: 'PATCH_MEDIA', id: asset.id, patch: { progress: Math.round(progress) } })
      }, 180)
      timers.current.add(interval)
    },
    [log],
  )

  const uploadFiles = useCallback<StoreContextValue['uploadFiles']>(
    (files, projectId) => {
      return files.map((file) => {
        const tooLarge = file.size > UPLOAD_LIMIT_BYTES
        const asset: MediaAsset = {
          id: createId('media'),
          name: file.name,
          kind: inferMediaKind(file.name, file.type),
          size: file.size,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
          status: tooLarge ? 'error' : 'uploading',
          progress: 0,
          error: tooLarge ? 'Supera el límite demo de 15 MB' : undefined,
          projectId,
        }
        dispatch({ type: 'ADD_MEDIA', asset })
        if (!tooLarge) runUpload(asset)
        return asset.id
      })
    },
    [runUpload],
  )

  const mediaRef = useRef(state.media)
  mediaRef.current = state.media

  // Los blob: de las subidas demo sobreviven al desmontaje (cerrar sesión, cambiar
  // de institución) y retienen el archivo completo en memoria hasta recargar.
  useEffect(
    () => () => {
      mediaRef.current.forEach((asset) => {
        if (asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url)
      })
    },
    [],
  )

  const retryUpload = useCallback<StoreContextValue['retryUpload']>(
    (id) => {
      const asset = mediaRef.current.find((item) => item.id === id)
      if (!asset) return
      if (asset.size > UPLOAD_LIMIT_BYTES) {
        dispatch({
          type: 'PATCH_MEDIA',
          id,
          patch: { status: 'error', error: 'Supera el límite demo de 15 MB' },
        })
        return
      }
      dispatch({ type: 'PATCH_MEDIA', id, patch: { status: 'uploading', progress: 0, error: undefined } })
      runUpload({ ...asset, status: 'uploading', progress: 0 })
    },
    [runUpload],
  )

  const removeMedia = useCallback<StoreContextValue['removeMedia']>(
    (id) => {
      const asset = mediaRef.current.find((item) => item.id === id)
      dispatch({ type: 'REMOVE_MEDIA', id })
      if (asset) {
        if (asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url)
        log('delete', `Eliminó el archivo «${asset.name}»`)
      }
    },
    [log],
  )

  const updateSettings = useCallback<StoreContextValue['updateSettings']>(
    (patch) => {
      dispatch({ type: 'SETTINGS', settings: { ...settingsRef.current, ...patch } })
      log('settings', 'Actualizó los ajustes de la institución')
    },
    [log],
  )

  const setFeatured = useCallback<StoreContextValue['setFeatured']>(
    (ids) => {
      const allowed = ids
        .filter((id) =>
          projectsRef.current.some(
            (project) => project.id === id && project.status === 'published',
          ),
        )
        .slice(0, 6)
      const wanted = new Set(allowed)
      projectsRef.current.forEach((project) => {
        const shouldFeature = wanted.has(project.id)
        if (project.isFeatured !== shouldFeature) {
          dispatch({
            type: 'UPSERT_PROJECT',
            project: { ...project, isFeatured: shouldFeature },
          })
        }
      })
      dispatch({
        type: 'SETTINGS',
        settings: { ...settingsRef.current, featuredProjectIds: allowed },
      })
      log('settings', `Actualizó los destacados de portada (${allowed.length})`)
    },
    [log],
  )

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      institution,
      reload: load,
      createProject,
      updateProject,
      setProjectStatus,
      deleteProject,
      uploadFiles,
      retryUpload,
      removeMedia,
      updateSettings,
      setFeatured,
      log,
    }),
    [
      state,
      institution,
      load,
      createProject,
      updateProject,
      setProjectStatus,
      deleteProject,
      uploadFiles,
      retryUpload,
      removeMedia,
      updateSettings,
      setFeatured,
      log,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAdminStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useAdminStore debe usarse dentro de AdminStoreProvider')
  return context
}
