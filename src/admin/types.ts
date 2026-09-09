import type { DemoProject, ProjectStatus } from '@/data/demoData'

/**
 * Modelo del panel administrativo (DEMO, en memoria).
 * Se reinicia al recargar. Reemplazar por Supabase en etapa posterior.
 */

export type AdminProject = Omit<DemoProject, 'gallery'> & {
  gallery: string[]
  updatedAt: string
  publishedAt?: string
}

export type ProjectDraftInput = Omit<
  AdminProject,
  'id' | 'slug' | 'institutionId' | 'updatedAt' | 'publishedAt' | 'status'
>

export type ActivityType =
  | 'create'
  | 'update'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'delete'
  | 'upload'
  | 'settings'
  | 'session'

export type ActivityEntry = {
  id: string
  type: ActivityType
  message: string
  actor: string
  at: string
  projectId?: string
  projectTitle?: string
}

export type MediaKind = 'image' | 'pdf' | 'doc' | 'video'

export type MediaAsset = {
  id: string
  name: string
  kind: MediaKind
  size: number
  url: string
  uploadedAt: string
  status: 'uploading' | 'ready' | 'error'
  progress: number
  error?: string
  projectId?: string
}

export type InstitutionSettings = {
  name: string
  shortName: string
  description: string
  accent: string
  logoUrl?: string
  featuredProjectIds: string[]
}

export type StoreStatus = 'loading' | 'ready' | 'error'

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  create: 'Creación',
  update: 'Edición',
  publish: 'Publicación',
  unpublish: 'Retiro',
  archive: 'Archivo',
  restore: 'Restauración',
  delete: 'Eliminación',
  upload: 'Carga',
  settings: 'Ajustes',
  session: 'Sesión',
}

/** Límite de subida en la demo (bytes). */
export const UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024
