import { useEffect } from 'react'

/**
 * Título y metadatos por ruta, sin dependencias: actualiza document.title,
 * la descripción, Open Graph/Twitter y robots cada vez que cambia la página.
 * Los valores por defecto viven también en index.html (lo que ven los
 * rastreadores que no ejecutan JavaScript).
 */

export const SITE_NAME = 'Legacy'
export const SITE_URL = 'https://legacy-proyecto.vercel.app'
export const DEFAULT_TITLE = 'Legacy — Donde el conocimiento deja legado'
export const DEFAULT_DESCRIPTION =
  'Legacy es el museo digital del legado estudiantil: archivo académico donde cada institución preserva y proyecta los proyectos de sus estudiantes.'

type PageMeta = {
  /** Título de la página; se completa con « · Legacy». Vacío = título por defecto. */
  title?: string
  description?: string
  /** Rutas privadas o sin valor para buscadores (admin, login, 404). */
  noindex?: boolean
}

const MAX_DESCRIPTION = 160

function clip(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= MAX_DESCRIPTION) return clean
  const cut = clean.slice(0, MAX_DESCRIPTION - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[\s,;:.·—-]+$/, '')}…`
}

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) {
    tag?.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

export function usePageMeta({ title, description, noindex = false }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE
    const fullDescription = clip(description || DEFAULT_DESCRIPTION)
    const url = `${SITE_URL}${window.location.pathname}`

    document.title = fullTitle
    setMeta('name', 'description', fullDescription)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : null)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', fullDescription)
    setMeta('property', 'og:url', url)
    setCanonical(url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', fullDescription)
  }, [title, description, noindex])
}
