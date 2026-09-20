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
