import type { CSSProperties } from 'react'

/** Misma curva, duración y distancia que el fade-up que antes hacía Framer en el home. */
export function riseStyle(delay: number, duration = 0.85, distance = 16): CSSProperties {
  return {
    '--rise-delay': `${delay}s`,
    '--rise-dur': `${duration}s`,
    '--rise-y': `${distance}px`,
  } as CSSProperties
}
