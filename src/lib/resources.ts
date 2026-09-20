/** Recursos de ficha: URL externa o archivo local (blob de la sesión). */

export function isHttpUrl(value?: string) {
  return Boolean(value && /^https?:\/\/\S+$/i.test(value))
}

export function isBlobUrl(value?: string) {
  return Boolean(value && value.startsWith('blob:'))
}

/** URL que se puede abrir o descargar (http, https o archivo de esta sesión). */
export function isFileResource(value?: string) {
  return isHttpUrl(value) || isBlobUrl(value)
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
