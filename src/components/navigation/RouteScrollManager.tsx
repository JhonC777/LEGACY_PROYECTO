import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function RouteScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ block: 'start' })
      })
      return
    }

    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [location.hash, location.pathname, location.search, navigationType])

  return null
}
