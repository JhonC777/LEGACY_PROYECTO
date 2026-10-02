const SCROLL_ROOT_SELECTOR =
  '.explore-scroll, .home-entry-stage, .admin-content'

export function getLegacyScrollRoot(from?: Element | null): HTMLElement | null {
  if (from) {
    const closest = from.closest<HTMLElement>(SCROLL_ROOT_SELECTOR)
    if (closest) return closest
  }
  return document.querySelector<HTMLElement>(SCROLL_ROOT_SELECTOR)
}

export function scrollLegacyTo(options: ScrollToOptions) {
  const root = getLegacyScrollRoot()
  if (root) {
    root.scrollTo(options)
    return
  }
  window.scrollTo(options)
}

/**
 * Mueve solo el panel con scroll (cámara, archivo o admin).
 * Devuelve false si el destino ya está a la vista o el panel no puede desplazarse.
 */
export function scrollLegacyElementIntoView(
  node: HTMLElement,
  align: 'start' | 'nearest' = 'start',
): boolean {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth'
  const root = getLegacyScrollRoot(node)

  if (!root) {
    node.scrollIntoView({
      block: align === 'start' ? 'start' : 'nearest',
      behavior,
    })
    return true
  }

  const nodeBox = node.getBoundingClientRect()
  const rootBox = root.getBoundingClientRect()
  const maxScroll = root.scrollHeight - root.clientHeight
  const marginTop = Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0
  let top = root.scrollTop

  if (align === 'nearest') {
    const visibleTop = Math.max(nodeBox.top, rootBox.top)
    const visibleBottom = Math.min(nodeBox.bottom, rootBox.bottom)
    const visible = Math.max(0, visibleBottom - visibleTop)
    const height = nodeBox.height || 1
    if (visible / height >= 0.85) return false
    top =
      nodeBox.top < rootBox.top
        ? root.scrollTop + (nodeBox.top - rootBox.top) - marginTop
        : root.scrollTop + (nodeBox.bottom - rootBox.bottom)
  } else {
    top = root.scrollTop + (nodeBox.top - rootBox.top) - marginTop
  }

  const next = Math.max(0, Math.min(Math.max(0, maxScroll), top))
  if (maxScroll <= 1 || Math.abs(next - root.scrollTop) < 2) return false
  root.scrollTo({ top: next, behavior })
  return true
}
