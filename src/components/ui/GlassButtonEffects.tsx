import { useEffect } from 'react'

/** Solo botones e iconos — no cards (evita tilt que interfiere con scroll/lectura) */
const SELECTOR =
  '.btn:not(:disabled):not([aria-disabled="true"]), .liquid-icon:not(:disabled)'

/**
 * Microinteracción Liquid Glass en botones e iconos de recurso.
 */
export function GlassButtonEffects() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let frame = 0
    let pending: { target: HTMLElement; x: number; y: number } | null = null

    const applyTilt = () => {
      frame = 0
      const next = pending
      pending = null
      if (!next) return

      const rect = next.target.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const px = (next.x - rect.left) / rect.width
      const py = (next.y - rect.top) / rect.height
      next.target.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`)
      next.target.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`)
      next.target.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      next.target.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    }

    const onMove = (event: MouseEvent) => {
      if (reducedMotion.matches) return
      const target = (event.target as Element | null)?.closest?.(SELECTOR)
      if (!(target instanceof HTMLElement)) return

      // Una sola lectura de layout por cuadro en vez de una por evento de puntero.
      pending = { target, x: event.clientX, y: event.clientY }
      if (!frame) frame = window.requestAnimationFrame(applyTilt)
    }

    const onOut = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.(SELECTOR)
      if (!(target instanceof HTMLElement)) return
      const related = event.relatedTarget as Node | null
      if (related && target.contains(related)) return
      if (pending?.target === target) pending = null
      target.style.setProperty('--rx', '0deg')
      target.style.setProperty('--ry', '0deg')
    }

    const onClick = (event: MouseEvent) => {
      if (reducedMotion.matches) return
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

      const remove = () => ripple.remove()
      ripple.addEventListener('animationend', remove, { once: true })
      ripple.addEventListener('animationcancel', remove, { once: true })
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseout', onOut, true)
    document.addEventListener('click', onClick)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseout', onOut, true)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
