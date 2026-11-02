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
import {
  deleteRemoteProject,
  getRemoteProjects,
  loadRemoteInstitutionSettings,
  listRemoteMedia,
  saveRemoteInstitutionSettings,
  overlayProjects,
  refreshRemoteArchive,
  saveRemoteProject,
  subscribeRemoteReady,
} from '@/data/archiveRemote'
import { attachObjectUrl, detachObjectUrl } from '@/lib/blobRegistry'
import { isInstitutionRealProject, readArchiveSnapshot, writeArchiveSnapshot } from './archiveBridge'

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
  // Coincide con los formatos que admite el bucket privado archive.
  if (
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime.toLowerCase()) ||
    /\.(png|jpe?g|webp|gif)$/i.test(name)
  ) return 'image'
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf'
  if (
    ['video/mp4', 'video/webm', 'video/quicktime'].includes(mime.toLowerCase()) ||
    /\.(mp4|webm|mov)$/i.test(name)
  ) return 'video'
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

function stripDemoDrafts(payload: Omit<State, 'status'>): Omit<State, 'status'> {
  return {
    ...payload,
    projects: payload.projects.filter((project) => !project.slug.startsWith('borrador-demo')),
    activity: payload.activity.filter(
      (entry) => !/borrador de demostración|borrador-demo/i.test(entry.message),
    ),
  }
}

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
    const oldest = [...published]
      .filter((project) => !project.isReal)
      .sort((a, b) => a.year - b.year)[0]
    if (oldest) {
      oldest.status = 'archived'
      oldest.updatedAt = daysAgo(45)
    }
  }

  const projects = published

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

  const actor = 'Administrador'
  const activity: ActivityEntry[] = published.slice(0, 4).map<ActivityEntry>((project, index) => ({
    id: createId('act'),
    type: 'publish',
    message: `Publicó «${project.title}»`,
    actor,
    at: daysAgo(4 + index * 3),
    projectId: project.id,
    projectTitle: project.title,
  }))

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
  createProject: (input: ProjectDraftInput) => Promise<AdminProject>
  updateProject: (id: string, patch: Partial<ProjectDraftInput>) => Promise<AdminProject | undefined>
  setProjectStatus: (id: string, status: ProjectStatus) => Promise<{ ok: boolean; errors: string[] }>
  deleteProject: (id: string) => Promise<void>
  uploadFiles: (files: File[], projectId?: string) => string[]
  retryUpload: (id: string) => void
  removeMedia: (id: string) => void
  updateSettings: (patch: Partial<InstitutionSettings>) => Promise<void>
  /** Curaduría de portada: sincroniza `featuredProjectIds` con `isFeatured`. */
  setFeatured: (ids: string[]) => Promise<void>
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
      void (async () => {
        if (current !== attempt.current) return
        if (simulateError && current === 1) {
          dispatch({ type: 'FAILED' })
          return
        }
        try {
          await refreshRemoteArchive()
          if (current !== attempt.current) return
          if (getRemoteProjects() === null) {
            dispatch({ type: 'FAILED' })
            return
          }
          const stored = readArchiveSnapshot(institution.slug)
          const payload = stripDemoDrafts(
            stored
              ? {
                  projects: stored.projects,
                  media: stored.media,
                  activity: stored.activity,
                  settings: stored.settings,
                }
              : seed(institution),
          )
          const remote = getRemoteProjects()
          const remoteSettings = await loadRemoteInstitutionSettings(institution.id)
          if (current !== attempt.current) return
          const institutionProjects =
            remote === null
              ? payload.projects
              : remote
                  .filter((project) => project.institutionId === institution.id && isInstitutionRealProject(project))
                  .map((project) => ({ ...project, isReal: true }))
          dispatch({
            type: 'LOADED',
            payload: {
              ...payload,
              projects: institutionProjects,
              settings: remoteSettings
                ? { ...payload.settings, ...remoteSettings }
                : payload.settings,
            },
          })
        } catch (error) {
          if (current !== attempt.current) return
          console.error('[legacy] No se pudo cargar el panel:', error)
          dispatch({ type: 'FAILED' })
        }
      })()
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

  useEffect(() => {
    if (state.status !== 'ready') return
    writeArchiveSnapshot({
      slug: institution.slug,
      projects: state.projects,
      media: state.media,
      activity: state.activity,
      settings: state.settings,
    })
  }, [
    institution.slug,
    state.status,
    state.projects,
    state.media,
    state.activity,
    state.settings,
  ])

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
  const statusRef = useRef(state.status)
  statusRef.current = state.status
  const settingsRef = useRef(state.settings)
  settingsRef.current = state.settings
  const mediaRef = useRef(state.media)
  mediaRef.current = state.media
  const activityRef = useRef(state.activity)
  activityRef.current = state.activity

  const flushArchive = useCallback(() => {
    writeArchiveSnapshot({
      slug: institution.slug,
      projects: projectsRef.current,
      media: mediaRef.current,
      activity: activityRef.current,
      settings: settingsRef.current,
    })
  }, [institution.slug])

  const persistRemote = useCallback(async (project: AdminProject) => {
    const saved = await saveRemoteProject(project)
    const current = projectsRef.current.find((item) => item.id === saved.id)
    if (!current) return saved
      const mediaChanged =
        current.coverImage !== saved.coverImage ||
        current.docUrl !== saved.docUrl ||
        current.pdfUrl !== saved.pdfUrl ||
        current.videoUrl !== saved.videoUrl ||
        current.gallery.join('|') !== saved.gallery.join('|')
      if (!mediaChanged) return saved
      const next: AdminProject = {
        ...current,
        coverImage: saved.coverImage,
        gallery: saved.gallery,
        docUrl: saved.docUrl,
        pdfUrl: saved.pdfUrl,
        videoUrl: saved.videoUrl,
      }
      projectsRef.current = projectsRef.current.map((item) => (item.id === next.id ? next : item))
      dispatch({ type: 'UPSERT_PROJECT', project: next })
      flushArchive()
    return saved
  }, [flushArchive])

  useEffect(() => {
    return subscribeRemoteReady(() => {
      if (statusRef.current !== 'ready') return
      const remote =
        getRemoteProjects()
          ?.filter(
            (project) =>
              project.institutionId === institution.id && isInstitutionRealProject(project),
          )
          .map((project) => ({ ...project, isReal: true })) ?? []
      if (remote.length === 0) return
      const projects = overlayProjects(projectsRef.current, remote)
      projectsRef.current = projects
      dispatch({
        type: 'LOADED',
        payload: {
          projects,
          media: mediaRef.current,
          activity: activityRef.current,
          settings: settingsRef.current,
        },
      })
    })
  }, [institution.id])

  const createProject = useCallback<StoreContextValue['createProject']>(
    async (input) => {
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
        isReal: true,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      }
      projectsRef.current = [project, ...projectsRef.current]
      dispatch({ type: 'UPSERT_PROJECT', project })
      log('create', `Creó el borrador «${project.title || 'Sin título'}»`, project)
      flushArchive()
      try {
        return await persistRemote(project)
      } catch (error) {
        projectsRef.current = projectsRef.current.filter((item) => item.id !== project.id)
        dispatch({ type: 'REMOVE_PROJECT', id: project.id })
        flushArchive()
        throw error
      }
    },
    [flushArchive, institution.id, log, persistRemote],
  )

  const updateProject = useCallback<StoreContextValue['updateProject']>(
    async (id, patch) => {
      const current = projectsRef.current.find((project) => project.id === id)
      if (!current) return undefined
      const project: AdminProject = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      }
      projectsRef.current = projectsRef.current.map((item) =>
        item.id === id ? project : item,
      )
      dispatch({ type: 'UPSERT_PROJECT', project })
      log('update', `Actualizó «${project.title || 'Sin título'}»`, project)
      flushArchive()
      try {
        return await persistRemote(project)
      } catch (error) {
        projectsRef.current = projectsRef.current.map((item) => item.id === id ? current : item)
        dispatch({ type: 'UPSERT_PROJECT', project: current })
        flushArchive()
        throw error
      }
    },
    [flushArchive, log, persistRemote],
  )

  const setProjectStatus = useCallback<StoreContextValue['setProjectStatus']>(
    async (id, status) => {
      const current = projectsRef.current.find((project) => project.id === id)
      if (!current) return { ok: false, errors: ['El proyecto ya no existe'] }

      if (status === 'published') {
        const { errors } = getProjectIssues(current)
        if (errors.length > 0) return { ok: false, errors }
      }

      const shouldRemainFeatured = status === 'published' && current.isFeatured
      const originalSettings = settingsRef.current
      const project: AdminProject = {
        ...current,
        status,
        isFeatured: shouldRemainFeatured,
        updatedAt: new Date().toISOString(),
        publishedAt:
          status === 'published' ? current.publishedAt ?? new Date().toISOString() : current.publishedAt,
      }
      projectsRef.current = projectsRef.current.map((item) =>
        item.id === id ? project : item,
      )
      dispatch({ type: 'UPSERT_PROJECT', project })

      if (!shouldRemainFeatured && settingsRef.current.featuredProjectIds.includes(id)) {
        const nextSettings = {
          ...settingsRef.current,
          featuredProjectIds: settingsRef.current.featuredProjectIds.filter(
            (featured) => featured !== id,
          ),
        }
        settingsRef.current = nextSettings
        dispatch({ type: 'SETTINGS', settings: nextSettings })
      }

      const verb: Record<ProjectStatus, [ActivityType, string]> = {
        published: ['publish', 'Publicó'],
        draft: [current.status === 'archived' ? 'restore' : 'unpublish', current.status === 'archived' ? 'Restauró a borrador' : 'Retiró a borrador'],
        archived: ['archive', 'Archivó'],
      }
      const [type, label] = verb[status]
      log(type, `${label} «${project.title}»`, project)
      flushArchive()
      try {
        await persistRemote(project)
        return { ok: true, errors: [] }
      } catch (error) {
        projectsRef.current = projectsRef.current.map((item) => item.id === id ? current : item)
        dispatch({ type: 'UPSERT_PROJECT', project: current })
        settingsRef.current = originalSettings
        dispatch({ type: 'SETTINGS', settings: originalSettings })
        flushArchive()
        throw error
      }
    },
    [flushArchive, log, persistRemote],
  )

  const deleteProject = useCallback<StoreContextValue['deleteProject']>(
    async (id) => {
      const current = projectsRef.current.find((project) => project.id === id)
      await deleteRemoteProject(id)
      projectsRef.current = projectsRef.current.filter((project) => project.id !== id)
      dispatch({ type: 'REMOVE_PROJECT', id })
      if (current) log('delete', `Eliminó «${current.title}»`, current)
      flushArchive()
    },
    [flushArchive, log],
  )

  // Los archivos locales quedan listos para adjuntarse al proyecto.
  // La transferencia real a Supabase Storage ocurre dentro de saveRemoteProject;
  // el editor solo confirma el guardado cuando Storage y la fila DB terminan.
  const runUpload = useCallback(
    (asset: MediaAsset) => {
      dispatch({
        type: 'PATCH_MEDIA',
        id: asset.id,
        patch: { progress: 100, status: 'ready' },
      })
    },
    [],
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
          url: attachObjectUrl(file),
          status: tooLarge ? 'error' : 'uploading',
          progress: 0,
          error: tooLarge ? 'Supera el límite de 15 MB' : undefined,
          projectId,
        }
        dispatch({ type: 'ADD_MEDIA', asset })
        if (!tooLarge) runUpload(asset)
        return asset.id
      })
    },
    [runUpload],
  )

  // Los blob: de la sesión se conservan al salir del panel para que el invitado
  // pueda abrir y descargar el archivo recién publicado en esta misma pestaña.

  const retryUpload = useCallback<StoreContextValue['retryUpload']>(
    (id) => {
      const asset = mediaRef.current.find((item) => item.id === id)
      if (!asset) return
      if (asset.size > UPLOAD_LIMIT_BYTES) {
        dispatch({
          type: 'PATCH_MEDIA',
          id,
          patch: { status: 'error', error: 'Supera el límite de 15 MB' },
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
        if (asset.url.startsWith('blob:')) detachObjectUrl(asset.url)
        log('delete', `Eliminó el archivo «${asset.name}»`)
      }
    },
    [log],
  )

  const updateSettings = useCallback<StoreContextValue['updateSettings']>(
    async (patch) => {
      const next = { ...settingsRef.current, ...patch }
      const saved = await saveRemoteInstitutionSettings(institution.id, {
        name: next.name,
        shortName: next.shortName,
        description: next.description,
        accent: next.accent,
        logoUrl: next.logoUrl,
      })
      const confirmed = { ...next, ...saved }
      dispatch({ type: 'SETTINGS', settings: confirmed })
      log('settings', 'Actualizó la identidad institucional')
      flushArchive()
    },
    [flushArchive, institution.id, log],
  )

  const setFeatured = useCallback<StoreContextValue['setFeatured']>(
    async (ids) => {
      const allowed = ids
        .filter((id) =>
          projectsRef.current.some(
            (project) => project.id === id && project.status === 'published',
          ),
        )
        .slice(0, 6)
      const originalProjects = projectsRef.current
      const originalSettings = settingsRef.current
      const changed: AdminProject[] = []
      const nextProjects = originalProjects.map((project) => {
        const nextFeatured = allowed.includes(project.id)
        if (project.isFeatured === nextFeatured) return project
        const next = { ...project, isFeatured: nextFeatured }
        changed.push(next)
        return next
      })
      projectsRef.current = nextProjects
      changed.forEach((project) => dispatch({ type: 'UPSERT_PROJECT', project }))
      dispatch({
        type: 'SETTINGS',
        settings: { ...originalSettings, featuredProjectIds: allowed },
      })
      const persisted: AdminProject[] = []
      try {
        // Secuencial para saber exactamente qué escrituras llegaron a Supabase.
        for (const project of changed) {
          await persistRemote(project)
          persisted.push(project)
        }
        log('settings', `Actualizó los destacados de portada (${allowed.length})`)
        flushArchive()
      } catch (error) {
        const rollbackErrors: string[] = []
        for (const project of persisted.reverse()) {
          const original = originalProjects.find((item) => item.id === project.id)
          if (!original) continue
          try {
            await persistRemote(original)
          } catch (rollbackError) {
            rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : 'Error desconocido')
          }
        }
        projectsRef.current = originalProjects
        changed.forEach((project) => {
          const original = originalProjects.find((item) => item.id === project.id)
          if (original) dispatch({ type: 'UPSERT_PROJECT', project: original })
        })
        settingsRef.current = originalSettings
        dispatch({ type: 'SETTINGS', settings: originalSettings })
        flushArchive()
        if (rollbackErrors.length > 0) {
          throw new Error(
            `No se pudieron guardar todos los destacados y la reversión remota quedó incompleta: ${rollbackErrors.join(' · ')}`,
            { cause: error },
          )
        }
        throw error
      }
    },
    [flushArchive, log, persistRemote],
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
