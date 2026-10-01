import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { scrollLegacyTo } from '@/lib/legacyScroll'

export function RouteScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    let timer = 0
    const onScroll = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.matches('.explore-scroll, .home-entry-stage, .admin-content')) return
      const root = document.documentElement
      root.classList.add('is-scrolling')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => root.classList.remove('is-scrolling'), 160)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.clearTimeout(timer)
      document.documentElement.classList.remove('is-scrolling')
    }
  }, [])

  useEffect(() => {
    // Cambios solo en ?query (buscador, filtros) no deben reiniciar el scroll.
    const pathChanged = lastPathname.current !== location.pathname
    lastPathname.current = location.pathname

    if (location.hash) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ block: 'start' })
      })
      return
    }

    if (pathChanged && navigationType !== 'POP') {
      scrollLegacyTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [location.hash, location.pathname, location.search, navigationType])

  return null
}
