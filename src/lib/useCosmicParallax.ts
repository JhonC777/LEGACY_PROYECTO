import { useEffect, type RefObject } from 'react'

/** Paralaje lento del cielo. Solo transform; se apaga si no hay vida. */
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

    const onMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.035
      currentY += (targetY - currentY) * 0.035
      node.style.setProperty('--orbit-x', currentX.toFixed(4))
      node.style.setProperty('--orbit-y', currentY.toFixed(4))
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
      node.style.setProperty('--orbit-x', '0')
      node.style.setProperty('--orbit-y', '0')
    }
  }, [root, live])
}
