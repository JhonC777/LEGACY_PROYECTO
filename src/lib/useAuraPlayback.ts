import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Auras vivas solo si hay movimiento permitido y la pestaña está visible. */
export function useAuraPlayback() {
  const reduceMotion = useReducedMotion()
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  )

  useEffect(() => {
    const sync = () => {
      const isHidden = document.hidden
      setHidden(isHidden)
      document.documentElement.classList.toggle('home-aura-paused', isHidden)
    }

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      document.documentElement.classList.remove('home-aura-paused')
    }
  }, [])

  return {
    live: !reduceMotion && !hidden,
    reduceMotion: Boolean(reduceMotion),
  }
}
