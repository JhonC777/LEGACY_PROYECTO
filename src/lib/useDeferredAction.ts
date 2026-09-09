import { useCallback, useEffect, useRef } from 'react'

/**
 * Ejecuta una acción diferida y la cancela si el componente se desmonta antes.
 * Evita temporizadores huérfanos que actualizan estado de árboles ya desmontados.
 */
export function useDeferredAction() {
  const timers = useRef(new Set<number>())

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current.clear()
    },
    [],
  )

  return useCallback((action: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      action()
    }, delay)
    timers.current.add(timer)
  }, [])
}
