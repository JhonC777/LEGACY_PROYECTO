import { useEffect, useState } from 'react'
import type { DemoProject } from '@/data/demoData'
import {
  isDirectVideoFile,
  openableResourceHref,
  resourceFileName,
  safeMediaSrc,
} from '@/lib/resources'

/**
 * Recursos de una ficha con su tipo. Todo pasa por los saneadores de
 * `lib/resources` (PR #1): aquí solo se clasifica, nunca se relaja el filtro.
 *
 * Los metadatos (peso, duración) solo aparecen cuando se pueden leer de verdad:
 * cabecera Content-Length de un archivo del propio sitio o de Supabase Storage,
 * o la duración que el navegador reporta al cargar un video directo.
 * Si no hay dato real, la interfaz muestra solo la etiqueta de tipo.
 */

export type ResourceKind = 'pdf' | 'video' | 'presentation' | 'image' | 'document'

export const KIND_LABEL: Record<ResourceKind, string> = {
  pdf: 'PDF',
  video: 'Video',
  presentation: 'Presentación',
  image: 'Imagen',
  document: 'Documento',
}

export type ProjectResource = {
  id: string
  kind: ResourceKind
  title: string
  /** Destino ya saneado para abrir o descargar. */
  href: string
  /** Nombre de archivo sugerido, solo si se puede descargar desde el mismo origen. */
  downloadName?: string
  external: boolean
  /** Extensión en mayúsculas (DOCX, PDF…) si la URL la trae. */
  extension?: string
  youtubeId?: string
  /** Video servido como archivo (mp4/webm…), reproducible con <video>. */
  directVideo?: boolean
  /** Para el recurso de galería: todas las imágenes saneadas. */
  images?: string[]
}

const PRESENTATION_EXT = /\.(pptx?|odp|key)$/i
const PDF_EXT = /\.pdf$/i

function pathOf(url: string) {
  try {
    return new URL(url.split('#')[0] ?? url, 'https://legacy.local').pathname
  } catch {
    return url
  }
}

function extensionOf(url: string, name?: string) {
  const source = name && /\.[a-z0-9]{2,8}$/i.test(name) ? name : pathOf(url)
  const match = source.match(/\.([a-z0-9]{2,8})$/i)
  return match ? match[1].toUpperCase() : undefined
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] ?? ''
      return /^[\w-]{6,}$/.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
      const id =
        parsed.searchParams.get('v') ?? parsed.pathname.match(/\/embed\/([\w-]{6,})/)?.[1] ?? ''
      return /^[\w-]{6,}$/.test(id) ? id : null
    }
  } catch {
    return null
  }
  return null
}

function fileResource(
  id: string,
  raw: string | undefined,
  fallbackName: string,
  defaultKind: ResourceKind,
  title: string,
): ProjectResource | null {
  const open = openableResourceHref(raw)
  if (!open || !raw) return null
  const external = /^https?:\/\//i.test(open)
  const name = resourceFileName(raw, fallbackName)
  const path = pathOf(open)
  let kind = defaultKind
  if (PDF_EXT.test(path) || PDF_EXT.test(name)) kind = 'pdf'
  else if (PRESENTATION_EXT.test(path) || PRESENTATION_EXT.test(name)) kind = 'presentation'
  return {
    id,
    kind,
    title,
    href: external ? open : open.split('#')[0],
    downloadName: external ? undefined : name,
    external,
    extension: extensionOf(open, name),
  }
}

export function getProjectResources(project: DemoProject): ProjectResource[] {
  const list: ProjectResource[] = []

  const pdf = fileResource('pdf', project.pdfUrl, 'informe-del-proyecto.pdf', 'pdf', 'Informe del proyecto')
  if (pdf) list.push(pdf)

  const doc = fileResource('doc', project.docUrl, 'documento-del-proyecto', 'document', 'Documento del proyecto')
  if (doc) {
    if (doc.kind === 'presentation') doc.title = 'Presentación del proyecto'
    if (doc.kind === 'pdf') doc.title = 'Documento en PDF'
    list.push(doc)
  }

  const videoOpen = openableResourceHref(project.videoUrl)
  if (videoOpen) {
    const yt = youtubeId(videoOpen)
    const direct = !yt && isDirectVideoFile(videoOpen)
    const external = /^https?:\/\//i.test(videoOpen)
    list.push({
      id: 'video',
      kind: 'video',
      title: 'Video del proyecto',
      href: direct && !external ? videoOpen.split('#')[0] : videoOpen,
      downloadName:
        direct && !external ? resourceFileName(videoOpen, 'video-del-proyecto.mp4') : undefined,
      external,
      youtubeId: yt ?? undefined,
      directVideo: direct,
      extension: direct ? extensionOf(videoOpen) : undefined,
    })
  }

  const images = project.gallery
    .map((item) => safeMediaSrc(item))
    .filter((item): item is string => Boolean(item))
  if (images.length > 0) {
    list.push({
      id: 'galeria',
      kind: 'image',
      title: images.length === 1 ? 'Fotografía del proyecto' : 'Fotografías del proyecto',
      href: images[0],
      external: /^https?:\/\//i.test(images[0]),
      images,
    })
  }

  return list
}

/** Tipos de recurso presentes, para el filtro del catálogo. */
export function resourceKindsOf(project: DemoProject): Set<ResourceKind> {
  return new Set(getProjectResources(project).map((item) => item.kind))
}

/* ------------------------------------------------------------------ */
/* Metadatos reales                                                    */
/* ------------------------------------------------------------------ */

const sizeCache = new Map<string, number | null>()
const pending = new Map<string, Promise<number | null>>()

/** Único host de Supabase Storage cuyo peso se consulta (el proyecto de Legacy). */
const STORAGE_PROBE_HOST = 'padsyhitxmbxjifpvzhj.supabase.co'

/**
 * Solo se consulta el peso de archivos del propio origen (rutas relativas) y
 * del Storage del proyecto de Legacy. Cualquier otro host, aunque sea de
 * Supabase, queda sin peso: no se hacen peticiones a terceros.
 */
function canProbeSize(href: string) {
  if (href.startsWith('/') && !href.startsWith('//')) return true
  try {
    const url = new URL(href)
    return (
      url.protocol === 'https:' &&
      url.hostname.toLowerCase() === STORAGE_PROBE_HOST &&
      url.port === '' &&
      url.pathname.startsWith('/storage/v1/object/')
    )
  } catch {
    return false
  }
}

async function probeSize(href: string): Promise<number | null> {
  try {
    const response = await fetch(href, { method: 'HEAD', credentials: 'omit' })
    if (!response.ok) return null
    const type = response.headers.get('content-type') ?? ''
    // Un 200 con text/html es la reescritura SPA, no el archivo.
    if (/text\/html/i.test(type)) return null
    const length = Number(response.headers.get('content-length'))
    return Number.isFinite(length) && length > 0 ? length : null
  } catch {
    return null
  }
}

export function useResourceSize(href?: string | null) {
  const [size, setSize] = useState<number | null>(() =>
    href ? (sizeCache.get(href) ?? null) : null,
  )

  useEffect(() => {
    if (!href || !canProbeSize(href)) {
      setSize(null)
      return
    }
    if (sizeCache.has(href)) {
      setSize(sizeCache.get(href) ?? null)
      return
    }
    let alive = true
    let request = pending.get(href)
    if (!request) {
      request = probeSize(href).then((value) => {
        sizeCache.set(href, value)
        pending.delete(href)
        return value
      })
      pending.set(href, request)
    }
    void request.then((value) => {
      if (alive) setSize(value)
    })
    return () => {
      alive = false
    }
  }, [href])

  return size
}

const durationCache = new Map<string, number | null>()

/** Duración real de un video directo, leída de sus metadatos (preload=metadata). */
export function useVideoDuration(src?: string | null) {
  const [duration, setDuration] = useState<number | null>(() =>
    src ? (durationCache.get(src) ?? null) : null,
  )

  useEffect(() => {
    if (!src) {
      setDuration(null)
      return
    }
    if (durationCache.has(src)) {
      setDuration(durationCache.get(src) ?? null)
      return
    }
    let alive = true
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    const done = (value: number | null) => {
      durationCache.set(src, value)
      if (alive) setDuration(value)
      video.removeAttribute('src')
      video.load()
    }
    video.addEventListener('loadedmetadata', () =>
      done(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null),
    )
    video.addEventListener('error', () => done(null))
    video.src = src
    return () => {
      alive = false
    }
  }, [src])

  return duration
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = value >= 10 ? 0 : 1
  return `${value.toLocaleString('es-CO', { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${units[unit]}`
}

export function formatDuration(seconds: number) {
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = String(total % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}
