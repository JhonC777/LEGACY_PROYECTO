import { useEffect, useState } from 'react'

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return reduceMotion
}

/** Auras vivas solo si hay movimiento permitido y la pestaña está visible. */
export function useAuraPlayback() {
  const reduceMotion = usePrefersReducedMotion()
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
