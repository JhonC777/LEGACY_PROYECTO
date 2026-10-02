/** Recursos de ficha: URL externa o archivo local (blob de la sesión). */

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/

export function isHttpUrl(value?: string) {
  return Boolean(value && /^https?:\/\/\S+$/i.test(value))
}

/**
 * Destino de un enlace. Solo http(s), ruta del propio sitio, ancla o blob de la sesión.
 * Bloquea javascript:, data: y URLs protocol-relative.
 */
export function safeHref(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 4000 || CONTROL_CHARS.test(trimmed) || trimmed.includes('\\')) {
    return null
  }
  if (trimmed.startsWith('#') && !trimmed.includes(':') && !trimmed.startsWith('#//')) return trimmed
  if (trimmed.startsWith('blob:')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
      return trimmed
    } catch {
      return null
    }
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  return null
}

/** Origen de imagen o video. Rechaza SVG en data: y cualquier esquema que no sea http(s). */
export function safeMediaSrc(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 4000 || CONTROL_CHARS.test(trimmed) || trimmed.includes('\\')) {
    return null
  }
  if (trimmed.startsWith('blob:')) return trimmed
  if (/^data:image\/(?!svg)/i.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
      return trimmed
    } catch {
      return null
    }
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed.split('#')[0]
  return null
}

export function isBlobUrl(value?: string) {
  return Boolean(value && value.startsWith('blob:'))
}

export function isPublicFilePath(value?: string) {
  if (!value) return false
  const path = value.split('#')[0]
  return path.startsWith('/') && /\.[a-z0-9]{2,8}$/i.test(path)
}

/** URL que se puede abrir o descargar (http, blob de sesión o archivo público). */
export function isFileResource(value?: string) {
  return isHttpUrl(value) || isBlobUrl(value) || isPublicFilePath(value)
}

/**
 * Archivo o URL que se puede abrir. Una ancla (`#documentacion`) no es un documento:
 * el sello del catálogo debe ir a la sección de la ficha, no a un destino vacío.
 */
export function openableResourceHref(value?: string | null): string | null {
  if (!value || value.trim().startsWith('#')) return null
  const href = safeHref(value)
  if (!href || href.startsWith('#')) return null
  if (!isFileResource(value)) return null
  return href
}

export function isValidResourceUrl(value?: string) {
  if (!value) return true
  if (value.startsWith('#')) return true
  return isFileResource(value)
}

export function withResourceName(url: string, name: string) {
  const base = url.split('#')[0]
  const clean = name.trim()
  return clean ? `${base}#${encodeURIComponent(clean)}` : base
}

export function resourceFileName(url: string, fallback: string) {
  try {
    const hash = url.includes('#') ? decodeURIComponent(url.slice(url.indexOf('#') + 1)) : ''
    if (hash && !hash.includes('/') && /\.[a-z0-9]{2,8}$/i.test(hash)) return hash
    const path = new URL(url, 'https://legacy.local').pathname
    const last = path.split('/').pop()
    if (last && last.includes('.')) return decodeURIComponent(last)
  } catch {
    /* ignore */
  }
  return fallback
}

export function isDirectVideoFile(url: string) {
  return isBlobUrl(url) || /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(url)
}
