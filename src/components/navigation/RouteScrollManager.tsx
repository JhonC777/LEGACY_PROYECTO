import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function RouteScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const lastPathname = useRef<string | null>(null)

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
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [location.hash, location.pathname, location.search, navigationType])

  return null
}
