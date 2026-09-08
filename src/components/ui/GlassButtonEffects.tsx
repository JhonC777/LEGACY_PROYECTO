import { useEffect } from 'react'

/** Solo botones e iconos — no cards (evita tilt que interfiere con scroll/lectura) */
const SELECTOR =
  '.btn:not(:disabled):not([aria-disabled="true"]), .liquid-icon:not(:disabled)'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Microinteracción Liquid Glass en botones e iconos de recurso.
 */
export function GlassButtonEffects() {
  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (prefersReducedMotion()) return
      const target = (event.target as Element | null)?.closest?.(SELECTOR)
      if (!(target instanceof HTMLElement)) return

      const rect = target.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      target.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`)
      target.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`)
      target.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      target.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    }

    const onOut = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.(SELECTOR)
      if (!(target instanceof HTMLElement)) return
      const related = event.relatedTarget as Node | null
      if (related && target.contains(related)) return
      target.style.setProperty('--rx', '0deg')
      target.style.setProperty('--ry', '0deg')
    }

    const onClick = (event: MouseEvent) => {
      if (prefersReducedMotion()) return
      const target = (event.target as Element | null)?.closest?.(SELECTOR)
      if (!(target instanceof HTMLElement)) return

      const rect = target.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'btn-ripple'
      const size = Math.max(rect.width, rect.height) * 1.8
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${event.clientX - rect.left}px`
      ripple.style.top = `${event.clientY - rect.top}px`
      target.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove())
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseout', onOut, true)
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseout', onOut, true)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
