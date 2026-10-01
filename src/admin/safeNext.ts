/**
 * Ruta interna del panel. Descarta URLs absolutas, protocol-relative
 * y secuencias que el navegador podría resolver fuera del sitio.
 */
export function safeAdminNext(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/admin/')) return null
  if (next.startsWith('//') || next.includes('\\') || next.includes('://')) return null
  if (/[\u0000-\u001F\u007F]/.test(next)) return null

  try {
    const base = 'https://legacy.local'
    const url = new URL(next, base)
    if (url.origin !== base) return null
    if (!url.pathname.startsWith('/admin/')) return null
    if (url.pathname.split('/').includes('..')) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
