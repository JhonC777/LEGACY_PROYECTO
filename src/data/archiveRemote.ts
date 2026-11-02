import type { AdminProject, MediaAsset } from '@/admin/types'
import type { DemoAuthor, ProjectStatus } from '@/data/demoData'
import { getBlobForObjectUrl } from '@/lib/blobRegistry'
import type { SupabaseClient } from '@supabase/supabase-js'

let clientPromise: Promise<SupabaseClient | null> | null = null

function getClient() {
  if (!clientPromise) {
    clientPromise = import('@/lib/supabase').then((mod) => mod.supabase)
  }
  return clientPromise
}

const READY = 'legacy-remote-ready'
const CHANGE = 'legacy-archive-change'
const ERROR = 'legacy-remote-error'

type ProjectRow = {
  id: string
  institution_id: string
  slug: string
  title: string
  subtitle: string
  area: string
  category: string
  year: number
  authors: DemoAuthor[]
  description: string
  problem: string
  solution: string
  methodology: string
  results: string
  technologies: string[]
  tags: string[]
  collection: string | null
  cover_image: string
  gallery: string[]
  doc_url: string | null
  video_url: string | null
  pdf_url: string | null
  is_featured: boolean
  is_real: boolean
  status: ProjectStatus
  updated_at: string
  published_at: string | null
}

let remote: AdminProject[] | null = null

export function getRemoteProjects() {
  return remote
}

function rowToProject(row: ProjectRow): AdminProject {
  return {
    id: row.id,
    slug: row.slug,
    institutionId: row.institution_id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    area: row.area ?? '',
    category: row.category ?? '',
    year: row.year,
    authors: Array.isArray(row.authors) ? row.authors : [],
    description: row.description ?? '',
    problem: row.problem ?? '',
    solution: row.solution ?? '',
    methodology: row.methodology ?? '',
    results: row.results ?? '',
    technologies: row.technologies ?? [],
    tags: row.tags ?? [],
    collection: row.collection ?? undefined,
    coverImage: row.cover_image ?? '',
    gallery: row.gallery ?? [],
    docUrl: row.doc_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    pdfUrl: row.pdf_url ?? undefined,
    isFeatured: row.is_featured,
    isReal: row.is_real,
    status: row.status,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? undefined,
  }
}

function toRow(project: AdminProject): ProjectRow {
  return {
    id: project.id,
    institution_id: project.institutionId,
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle,
    area: project.area,
    category: project.category,
    year: project.year,
    authors: project.authors,
    description: project.description,
    problem: project.problem,
    solution: project.solution,
    methodology: project.methodology,
    results: project.results,
    technologies: project.technologies,
    tags: project.tags,
    collection: project.collection ?? null,
    cover_image: canonicalMedia(project.coverImage),
    gallery: project.gallery.map((item) => canonicalMedia(item)),
    doc_url: canonicalMedia(project.docUrl) ?? null,
    video_url: canonicalMedia(project.videoUrl) ?? null,
    pdf_url: canonicalMedia(project.pdfUrl) ?? null,
    is_featured: project.isFeatured,
    is_real: Boolean(project.isReal),
    status: project.status,
    updated_at: project.updatedAt,
    published_at: project.publishedAt ?? null,
  }
}

function remember(projects: AdminProject[]) {
  remote = projects
  window.dispatchEvent(new Event(READY))
  window.dispatchEvent(new Event(CHANGE))
}

function fail(message: string) {
  window.dispatchEvent(new CustomEvent(ERROR, { detail: message }))
}

type RemoteError = {
  message?: string
  code?: string
  details?: string
  hint?: string
  status?: number
}

export function remoteErrorMessage(error: RemoteError, stage = 'Supabase') {
  const message = error.message ?? ''
  const normalized = message.toLowerCase()
  const code = error.code ? ` · código ${error.code}` : ''
  const details = [error.details, error.hint].filter(Boolean).join(' ')
  const technical = [message, details].filter(Boolean).join(' ').replace(/\\s+/g, ' ').slice(0, 260)

  if (/tipo de archivo no permitido/i.test(message)) {
    return 'El archivo no tiene un formato permitido. Usa JPG, PNG, WebP, GIF, PDF, DOC/DOCX, ODT, RTF, TXT, MP4, WebM o MOV.'
  }
  if (/row-level security|rls|permission denied|not authorized|unauthorized|42501/i.test(`${normalized} ${error.code ?? ''}`)) {
    return `Supabase rechazó los permisos durante ${stage}. Revisa que la sesión siga activa y que el administrador tenga acceso a esta institución.${code}`
  }
  if (/bucket.*not found|object not found|no such bucket/i.test(message)) {
    return `No se encontró el almacenamiento de archivos durante ${stage}. Revisa el bucket archive en Supabase.${code}`
  }
  if (/payload too large|file size|entity too large|413/i.test(message)) {
    return `El archivo supera el límite permitido durante ${stage}. Reduce su tamaño e inténtalo de nuevo.${code}`
  }
  if (/claim_admin|schema cache|relation .* does not exist|function .* does not exist/i.test(message)) {
    return `La base de datos no reconoce un objeto necesario durante ${stage}. Hay que revisar el esquema de Supabase.${code}`
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirma el correo que te envió Supabase y vuelve a entrar con la misma contraseña.'
  }
  if (/invalid login|invalid_credentials/i.test(message) || error.code === 'invalid_credentials') {
    return 'Correo o contraseña incorrectos.'
  }
  if (/not an admin|already has an admin/i.test(message)) {
    return 'Ese correo no es el administrador de esta institución.'
  }
  if (/redirect|not allowed/i.test(message)) {
    return 'Falta autorizar en Supabase la dirección de recuperación.'
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Espera un momento antes de pedir otro correo.'
  }
  if (/failed to fetch|networkerror|fetch failed|network request failed/i.test(message)) {
    return `No se pudo conectar con Supabase durante ${stage}. Comprueba la conexión e inténtalo otra vez.${code}`
  }

  if (technical) {
    console.error('[legacy] error remoto:', { stage, code: error.code, message, details, status: error.status })
    return `Falló ${stage}: ${technical}${code}`
  }
  return `No se pudo completar ${stage}. Supabase no devolvió detalles del error.${code}`
}

function canonicalMedia(value: string): string
function canonicalMedia(value: string | undefined): string | undefined
function canonicalMedia(value?: string | null) {
  if (!value) return undefined
  const marker = '/object/sign/archive/'
  const index = value.indexOf(marker)
  if (index >= 0) {
    const path = decodeURIComponent(value.slice(index + marker.length).split('?')[0] ?? '')
    return path ? `storage:${path}` : value
  }
  return value
}

async function displayMedia(value?: string) {
  const supabase = await getClient()
  if (!supabase || !value?.startsWith('storage:')) return value
  const path = value.slice('storage:'.length)
  const { data, error } = await supabase.storage
    .from('archive')
    .createSignedUrl(path, 60 * 60 * 24 * 7, { download: false })
  if (error || !data?.signedUrl) return value
  return data.signedUrl
}

async function withDisplayUrls(project: AdminProject): Promise<AdminProject> {
  const gallery: string[] = []
  for (const item of project.gallery) gallery.push((await displayMedia(item)) ?? item)
  return {
    ...project,
    coverImage: (await displayMedia(project.coverImage)) ?? project.coverImage,
    gallery,
    docUrl: await displayMedia(project.docUrl),
    pdfUrl: await displayMedia(project.pdfUrl),
    videoUrl: await displayMedia(project.videoUrl),
  }
}


/** Inventario persistente del bucket privado, no solo archivos temporales de la sesión. */
export async function listRemoteMedia(institutionId: string, projects: AdminProject[]): Promise<MediaAsset[]> {
  const supabase = await getClient()
  if (!supabase) return []
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const collected: MediaAsset[] = []
  const walk = async (prefix: string): Promise<void> => {
    const { data, error } = await supabase.storage.from('archive').list(prefix, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (error) throw new Error(remoteErrorMessage(error, 'listar los archivos institucionales'))
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (!item.id) {
        await walk(path)
        continue
      }
      const metadata = (item.metadata ?? {}) as { size?: number; mimetype?: string; lastModified?: string }
      const mime = (metadata.mimetype ?? '').toLowerCase()
      const ext = item.name.split('.').pop()?.toLowerCase() ?? ''
      const kind = mime.startsWith('image/') || /^(png|jpe?g|webp|gif|svg)$/.test(ext)
        ? 'image'
        : mime === 'application/pdf' || ext === 'pdf'
          ? 'pdf'
          : mime.startsWith('video/') || /^(mp4|webm|mov)$/.test(ext)
            ? 'video'
            : 'doc'
      const parts = path.split('/')
      const projectId = parts.length > 2 ? parts[1] : undefined
      const { data: signed } = await supabase.storage.from('archive').createSignedUrl(path, 60 * 60 * 24)
      collected.push({
        id: path,
        name: parts.slice(2).join('/') || item.name,
        kind,
        size: metadata.size ?? 0,
        url: signed?.signedUrl ?? '',
        uploadedAt: metadata.lastModified ?? item.updated_at ?? item.created_at ?? undefined,
        status: 'ready',
        progress: 100,
        projectId: projectById.has(projectId ?? '') ? projectId : undefined,
      })
    }
  }
  await walk(institutionId)
  return collected
}

export async function refreshRemoteArchive() {
  const supabase = await getClient()
  if (!supabase) return null
  const { data, error } = await supabase.from('projects').select('*')
  if (error) {
    fail(remoteErrorMessage(error))
    return null
  }
  const projects = await Promise.all(
    ((data ?? []) as ProjectRow[]).map((row) => withDisplayUrls(rowToProject(row))),
  )
  remember(projects)
  return projects
}

export async function signInInstitutionAdmin(
  email: string,
  password: string,
  institutionId: string,
) {
  const supabase = await getClient()
  if (!supabase) return
  const existing = await supabase.auth.signInWithPassword({ email, password })
  if (existing.error) throw new Error(remoteErrorMessage(existing.error))
  const { error } = await supabase.rpc('claim_admin', { inst_id: institutionId })
  if (error) throw new Error(remoteErrorMessage(error))
  await refreshRemoteArchive()
}

export async function signOutRemote() {
  const supabase = await getClient()
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function sendAdminPasswordReset(email: string) {
  const supabase = await getClient()
  if (!supabase) throw new Error('El archivo remoto no está conectado.')
  const redirectTo = `${window.location.origin}/admin/nueva-clave`
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  if (error) throw new Error(remoteErrorMessage(error))
}

export async function updateAdminPassword(password: string) {
  const supabase = await getClient()
  if (!supabase) throw new Error('El archivo remoto no está conectado.')
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(remoteErrorMessage(error))
  return data.user?.email ?? ''
}

function fileNameFrom(url: string, fallback: string) {
  const hash = url.includes('#') ? decodeURIComponent(url.slice(url.indexOf('#') + 1)) : ''
  const raw = hash || fallback
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || fallback
}

const ALLOWED_ARCHIVE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/rtf',
  'text/plain',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const EXT_TO_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
  txt: 'text/plain',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

function allowedContentType(blob: Blob, path: string) {
  const type = blob.type.toLowerCase().split(';')[0]?.trim() ?? ''
  if (ALLOWED_ARCHIVE_TYPES.has(type)) return type
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const fromExt = EXT_TO_TYPE[ext]
  if ((type === '' || type === 'application/octet-stream') && fromExt) return fromExt
  throw new Error('tipo de archivo no permitido')
}

async function blobFromObjectUrl(url: string): Promise<Blob> {
  const cached = getBlobForObjectUrl(url)
  if (cached) return cached
  return fetch(url).then((response) => response.blob())
}

async function uploadArchiveObject(
  supabase: SupabaseClient,
  path: string,
  blob: Blob,
  contentType: string,
) {
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { error } = await supabase.storage.from('archive').upload(path, blob, {
        upsert: true,
        contentType,
      })
      if (!error) return
      // HTTP errors (permisos, formato, tamaño) no mejoran repitiendo la petición.
      throw error
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const isNetworkFailure =
        error instanceof TypeError ||
        /failed to fetch|networkerror|fetch failed|network request failed/i.test(message)
      if (!isNetworkFailure || attempt === maxAttempts) {
        if (isNetworkFailure) {
          throw new Error(`No se pudo completar la conexión al subir "${path}" después de ${attempt} intentos. Comprueba la conexión y vuelve a guardar.`, { cause: error })
        }
        throw error
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500 * attempt))
    }
  }
}

function uniqueArchivePath(path: string) {
  const slash = path.lastIndexOf('/')
  const folder = path.slice(0, slash + 1)
  const filename = path.slice(slash + 1)
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${folder}${token}-${filename}`
}

function storagePath(value?: string | null): string | null {
  if (!value) return null
  const canonical = canonicalMedia(value)
  return canonical?.startsWith('storage:') ? canonical.slice('storage:'.length) : null
}

function projectStoragePaths(project: Pick<AdminProject, 'coverImage' | 'gallery' | 'docUrl' | 'pdfUrl' | 'videoUrl'>) {
  return [
    storagePath(project.coverImage),
    ...project.gallery.map(storagePath),
    storagePath(project.docUrl),
    storagePath(project.pdfUrl),
    storagePath(project.videoUrl),
  ].filter((path): path is string => Boolean(path))
}

async function removeUnreferencedArchiveObjects(paths: string[], institutionId: string) {
  const candidates = [...new Set(paths)].filter((path) =>
    path.startsWith(`${institutionId}/`) && !path.includes('..'),
  )
  if (candidates.length === 0) return
  const supabase = await getClient()
  if (!supabase) return

  // Fallar cerrado: si no se puede leer el inventario completo de referencias,
  // no se elimina absolutamente nada.
  const [projectsResult, institutionsResult] = await Promise.all([
    supabase.from('projects').select('cover_image, gallery, doc_url, pdf_url, video_url'),
    supabase.from('institutions').select('logo_url'),
  ])
  if (projectsResult.error) throw projectsResult.error
  if (institutionsResult.error) throw institutionsResult.error

  const referenced = new Set<string>()
  for (const row of projectsResult.data ?? []) {
    for (const value of [
      row.cover_image,
      ...(Array.isArray(row.gallery) ? row.gallery : []),
      row.doc_url,
      row.pdf_url,
      row.video_url,
    ]) {
      const path = storagePath(typeof value === 'string' ? value : null)
      if (path) referenced.add(path)
    }
  }
  for (const row of institutionsResult.data ?? []) {
    const path = storagePath(row.logo_url)
    if (path) referenced.add(path)
  }

  const safeToDelete = candidates.filter((path) => !referenced.has(path))
  if (safeToDelete.length === 0) return
  const { error } = await supabase.storage.from('archive').remove(safeToDelete)
  if (error) throw error
}

async function cleanupUnreferencedSafely(paths: string[], institutionId: string) {
  try {
    await removeUnreferencedArchiveObjects(paths, institutionId)
  } catch (error) {
    // El guardado principal ya se confirmó. Un fallo de limpieza deja basura,
    // nunca justifica borrar sin poder demostrar que el objeto está huérfano.
    console.error('[legacy] No se pudo verificar/limpiar archivos huérfanos:', error)
  }
}

async function promoteUrl(url: string | undefined, path: string, uploadedPaths: string[]) {
  const supabase = await getClient()
  if (!supabase || !url?.startsWith('blob:')) return url
  const blob = await blobFromObjectUrl(url)
  const contentType = allowedContentType(blob, path)
  const storageContentType = contentType === 'application/rtf' || contentType === 'text/rtf'
    ? 'application/octet-stream'
    : contentType
  const uniquePath = uniqueArchivePath(path)
  await uploadArchiveObject(supabase, uniquePath, blob, storageContentType)
  uploadedPaths.push(uniquePath)
  return `storage:${uniquePath}`
}

async function withStoredMedia(project: AdminProject, uploadedPaths: string[] = []): Promise<AdminProject> {
  const coverImage =
    (await promoteUrl(project.coverImage, `${project.institutionId}/${project.id}/cover-${fileNameFrom(project.coverImage, 'portada.jpg')}`, uploadedPaths)) ??
    project.coverImage
  const gallery: string[] = []
  for (let index = 0; index < project.gallery.length; index += 1) {
    const item = project.gallery[index]
    gallery.push(
      (await promoteUrl(item, `${project.institutionId}/${project.id}/gallery-${index + 1}-${fileNameFrom(item, 'imagen.jpg')}`, uploadedPaths)) ??
        item,
    )
  }
  const docUrl = await promoteUrl(
    project.docUrl,
    `${project.institutionId}/${project.id}/${fileNameFrom(project.docUrl ?? '', 'documento')}`,
    uploadedPaths,
  )
  const pdfUrl = await promoteUrl(
    project.pdfUrl,
    `${project.institutionId}/${project.id}/${fileNameFrom(project.pdfUrl ?? '', 'informe.pdf')}`,
    uploadedPaths,
  )
  const videoUrl = await promoteUrl(
    project.videoUrl,
    `${project.institutionId}/${project.id}/${fileNameFrom(project.videoUrl ?? '', 'video')}`,
    uploadedPaths,
  )
  return { ...project, coverImage, gallery, docUrl, pdfUrl, videoUrl }
}

export async function saveRemoteProject(project: AdminProject) {
  const supabase = await getClient()
  if (!supabase) throw new Error('Supabase no está configurado. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  let stage = 'subir los archivos al almacenamiento'
  const uploadedPaths: string[] = []
  const previous = (remote ?? []).find((item) => item.id === project.id)
  try {
    const stored = await withStoredMedia(project, uploadedPaths)
    // Primero se guarda la referencia storage: en la fila del proyecto. El bucket
    // es privado y su política solo permite firmar objetos ya vinculados a un
    // proyecto publicado; intentar firmarlos antes del upsert devuelve error.
    stage = 'guardar el proyecto y vincular sus archivos'
    const { data, error } = await supabase
      .from('projects')
      .upsert(toRow(stored), { onConflict: 'id' })
      .select('id')
      .single()
    if (error) throw error
    if (!data?.id || data.id !== stored.id) {
      throw new Error('Supabase no confirmó el proyecto guardado.')
    }
    stage = 'generar enlaces de visualización de los archivos'
    const prepared = await withDisplayUrls(stored)
    const next = (remote ?? []).filter((item) => item.id !== prepared.id)
    remember([prepared, ...next])
    if (previous) {
      const nextPaths = new Set(projectStoragePaths(stored))
      const replacedPaths = projectStoragePaths(previous).filter((path) => !nextPaths.has(path))
      void cleanupUnreferencedSafely(replacedPaths, project.institutionId)
    }
    return prepared
  } catch (error) {
    void cleanupUnreferencedSafely(uploadedPaths, project.institutionId)
    const remoteError = (error && typeof error === 'object' ? error : {}) as RemoteError
    const message = remoteErrorMessage(
      { ...remoteError, message: remoteError.message ?? (error instanceof Error ? error.message : '') },
      stage,
    )
    fail(message)
    throw new Error(message, { cause: error })
  }
}

export type RemoteInstitutionSettings = {
  name: string
  shortName: string
  description: string
  accent: string
  logoUrl?: string
}

export async function loadRemoteInstitutionSettings(institutionId: string): Promise<RemoteInstitutionSettings | null> {
  const supabase = await getClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('institutions')
    .select('name, short_name, description, accent, logo_url')
    .eq('id', institutionId)
    .maybeSingle()
  if (error) throw new Error(remoteErrorMessage(error, 'cargar la identidad institucional'))
  if (!data) return null
  const storedLogo = data.logo_url ?? undefined
  return {
    name: data.name,
    shortName: data.short_name,
    description: data.description ?? '',
    accent: data.accent ?? '#7662c9',
    logoUrl: storedLogo?.startsWith('storage:') ? await displayMedia(storedLogo) : storedLogo,
  }
}

export async function saveRemoteInstitutionSettings(
  institutionId: string,
  settings: RemoteInstitutionSettings,
): Promise<RemoteInstitutionSettings> {
  const supabase = await getClient()
  if (!supabase) throw new Error('Supabase no está configurado.')
  let logoUrl = settings.logoUrl
  const uploadedLogoPaths: string[] = []
  const { data: previousInstitution, error: previousInstitutionError } = await supabase
    .from('institutions')
    .select('logo_url')
    .eq('id', institutionId)
    .maybeSingle()
  if (previousInstitutionError) throw new Error(remoteErrorMessage(previousInstitutionError, 'leer el logo institucional anterior'))
  if (logoUrl?.startsWith('blob:')) {
    const response = await fetch(logoUrl)
    if (!response.ok) throw new Error('No se pudo leer el logo seleccionado.')
    const blob = await response.blob()
    const extension = blob.type === 'image/png' ? 'png'
      : blob.type === 'image/webp' ? 'webp'
      : blob.type === 'image/gif' ? 'gif' : 'jpg'
    const path = uniqueArchivePath(`${institutionId}/identity/logo.${extension}`)
    const { error: uploadError } = await supabase.storage.from('archive').upload(path, blob, {
      upsert: false,
      contentType: blob.type || 'image/jpeg',
    })
    if (uploadError) throw new Error(remoteErrorMessage(uploadError, 'subir el logo institucional'))
    uploadedLogoPaths.push(path)
    logoUrl = `storage:${path}`
  }
  const { data, error } = await supabase
    .from('institutions')
    .update({
      name: settings.name,
      short_name: settings.shortName,
      description: settings.description,
      accent: settings.accent,
      logo_url: logoUrl?.startsWith('blob:') ? null : logoUrl ?? null,
    })
    .eq('id', institutionId)
    .select('id')
    .maybeSingle()
  if (error) {
    void cleanupUnreferencedSafely(uploadedLogoPaths, institutionId)
    throw new Error(remoteErrorMessage(error, 'guardar la identidad institucional'))
  }
  if (!data) {
    void cleanupUnreferencedSafely(uploadedLogoPaths, institutionId)
    throw new Error('Supabase no confirmó los cambios. Verifica que tu cuenta administre esta institución.')
  }
  const previousLogoPath = storagePath(previousInstitution?.logo_url)
  const nextLogoPath = storagePath(logoUrl)
  if (previousLogoPath && previousLogoPath !== nextLogoPath) {
    void cleanupUnreferencedSafely([previousLogoPath], institutionId)
  }
  return { ...settings, logoUrl: logoUrl?.startsWith('storage:') ? await displayMedia(logoUrl) : logoUrl }
}

export async function deleteRemoteProject(id: string) {
  const supabase = await getClient()
  if (!supabase) throw new Error('Supabase no está configurado. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .select('id, institution_id, cover_image, gallery, doc_url, pdf_url, video_url')
    .maybeSingle()
  if (error) {
    fail(remoteErrorMessage(error))
    throw error
  }
  if (!data) throw new Error('El proyecto no existe o no tienes permiso para eliminarlo.')
  remember((remote ?? []).filter((project) => project.id !== id))
  const deletedPaths = [
    storagePath(data.cover_image),
    ...(Array.isArray(data.gallery) ? data.gallery.map(storagePath) : []),
    storagePath(data.doc_url),
    storagePath(data.pdf_url),
    storagePath(data.video_url),
  ].filter((path): path is string => Boolean(path))
  void cleanupUnreferencedSafely(deletedPaths, data.institution_id)
}

export function overlayProjects<T extends { id: string; slug: string }>(base: T[], extra: T[]) {
  const next = [...base]
  for (const project of extra) {
    const index = next.findIndex((item) => item.id === project.id || item.slug === project.slug)
    if (index >= 0) next[index] = project
    else next.unshift(project)
  }
  return next
}

export function subscribeRemoteReady(listener: () => void) {
  window.addEventListener(READY, listener)
  return () => window.removeEventListener(READY, listener)
}
