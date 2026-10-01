import { useEffect, type RefObject } from 'react'

/** Paralaje lento del cielo. Solo transform; se apaga al quedar quieto y al hacer scroll. */
export function useCosmicParallax(
  root: RefObject<HTMLElement | null>,
  live: boolean,
) {
  useEffect(() => {
    const node = root.current
    if (!node || !live) {
      node?.style.setProperty('--orbit-x', '0')
      node?.style.setProperty('--orbit-y', '0')
      return
    }

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let frame = 0
    let running = false
    let bounds = node.getBoundingClientRect()

    const tick = () => {
      frame = 0
      if (document.hidden || document.documentElement.classList.contains('is-scrolling')) {
        running = false
        return
      }
      currentX += (targetX - currentX) * 0.035
      currentY += (targetY - currentY) * 0.035
      const dx = targetX - currentX
      const dy = targetY - currentY
      if (dx * dx + dy * dy < 0.000004) {
        currentX = targetX
        currentY = targetY
        running = false
      }
      node.style.setProperty('--orbit-x', currentX.toFixed(4))
      node.style.setProperty('--orbit-y', currentY.toFixed(4))
      if (running) frame = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (running || document.hidden) return
      if (document.documentElement.classList.contains('is-scrolling')) return
      running = true
      frame = requestAnimationFrame(tick)
    }

    const onMove = (event: PointerEvent) => {
      if (bounds.width === 0 || bounds.height === 0) return
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
      wake()
    }

    const refreshBounds = () => {
      bounds = node.getBoundingClientRect()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', refreshBounds)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', refreshBounds)
      if (frame) cancelAnimationFrame(frame)
      node.style.setProperty('--orbit-x', '0')
      node.style.setProperty('--orbit-y', '0')
    }
  }, [root, live])
}
