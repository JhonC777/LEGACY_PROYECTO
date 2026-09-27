import type { AdminProject } from '@/admin/types'
import type { DemoAuthor, ProjectStatus } from '@/data/demoData'
import { supabase, supabaseConfigured } from '@/lib/supabase'

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

export function remoteErrorMessage(error: { message?: string; code?: string }) {
  const message = error.message ?? ''
  if (/claim_admin|schema cache|relation|does not exist/i.test(message)) {
    return 'La base todavía no está lista. Falta ejecutar el esquema en Supabase.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirma el correo que te envió Supabase y vuelve a entrar con la misma contraseña.'
  }
  if (/invalid login|already registered/i.test(message)) {
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
  return message || 'No se pudo conectar con el archivo.'
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
  if (!supabase || !value?.startsWith('storage:')) return value
  const path = value.slice('storage:'.length)
  const { data, error } = await supabase.storage.from('archive').createSignedUrl(path, 60 * 60 * 12)
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

export async function refreshRemoteArchive() {
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
  if (!supabase) return
  const existing = await supabase.auth.signInWithPassword({ email, password })
  if (existing.error) throw new Error(remoteErrorMessage(existing.error))
  const { error } = await supabase.rpc('claim_admin', { inst_id: institutionId })
  if (error) throw new Error(remoteErrorMessage(error))
  await refreshRemoteArchive()
}

export async function signOutRemote() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function sendAdminPasswordReset(email: string) {
  if (!supabase) throw new Error('El archivo remoto no está conectado.')
  const redirectTo = `${window.location.origin}/admin/nueva-clave`
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  if (error) throw new Error(remoteErrorMessage(error))
}

export async function updateAdminPassword(password: string) {
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

async function promoteUrl(url: string | undefined, path: string) {
  if (!supabase || !url?.startsWith('blob:')) return url
  const blob = await fetch(url).then((response) => response.blob())
  const { error } = await supabase.storage.from('archive').upload(path, blob, {
    upsert: true,
    contentType: blob.type || undefined,
  })
  if (error) throw error
  return `storage:${path}`
}

async function withStoredMedia(project: AdminProject): Promise<AdminProject> {
  const coverImage =
    (await promoteUrl(project.coverImage, `${project.institutionId}/${project.id}/cover`)) ??
    project.coverImage
  const gallery: string[] = []
  for (let index = 0; index < project.gallery.length; index += 1) {
    const item = project.gallery[index]
    gallery.push(
      (await promoteUrl(item, `${project.institutionId}/${project.id}/gallery-${index + 1}`)) ??
        item,
    )
  }
  const docUrl = await promoteUrl(
    project.docUrl,
    `${project.institutionId}/${project.id}/${fileNameFrom(project.docUrl ?? '', 'documento')}`,
  )
  const pdfUrl = await promoteUrl(
    project.pdfUrl,
    `${project.institutionId}/${project.id}/${fileNameFrom(project.pdfUrl ?? '', 'informe.pdf')}`,
  )
  const videoUrl = await promoteUrl(
    project.videoUrl,
    `${project.institutionId}/${project.id}/${fileNameFrom(project.videoUrl ?? '', 'video')}`,
  )
  return { ...project, coverImage, gallery, docUrl, pdfUrl, videoUrl }
}

export async function saveRemoteProject(project: AdminProject) {
  if (!supabase) return project
  try {
    const prepared = await withDisplayUrls(await withStoredMedia(project))
    const { error } = await supabase.from('projects').upsert(toRow(prepared), { onConflict: 'id' })
    if (error) throw error
    const next = (remote ?? []).filter((item) => item.id !== prepared.id)
    remember([prepared, ...next])
    return prepared
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar en Supabase.'
    fail(remoteErrorMessage({ message }))
    return project
  }
}

export async function deleteRemoteProject(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) {
    fail(remoteErrorMessage(error))
    return
  }
  remember((remote ?? []).filter((project) => project.id !== id))
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

export { supabaseConfigured }
