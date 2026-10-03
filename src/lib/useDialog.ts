import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, video[controls], [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo modal accesible: bloquea el scroll del fondo, mueve el foco adentro,
 * lo encierra con Tab / Shift+Tab, cierra con Esc y devuelve el foco al disparador.
 */
export function useDialog(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.classList.add('legacy-modal-open')

    const frame = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? panelRef.current
      target?.focus({ preventScroll: true })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Un menú abierto adentro (p. ej. un select) cierra primero.
        if (event.defaultPrevented) return
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => !node.closest('[hidden], [inert]') && node.getClientRects().length > 0,
      )
      if (nodes.length === 0) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (active && !panelRef.current.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('legacy-modal-open')
      restore?.focus?.({ preventScroll: true })
    }
  }, [open, panelRef, initialFocusRef])
}
