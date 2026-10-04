import { useEffect, useRef, type ReactNode, type RefObject, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import '@/styles/nav-drawer.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

type MobileNavDrawerProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  label?: string
  id?: string
  /** El panel se portaliza fuera del shell; el tono no se hereda del padre. */
  tone?: 'brand' | 'institution'
}

export function usePublishHeaderHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current
    if (!node) return

    const apply = () => {
      document.documentElement.style.setProperty(
        '--legacy-header-h',
        `${Math.round(node.getBoundingClientRect().height)}px`,
      )
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
}

export function MobileNavDrawer({
  open,
  onClose,
  children,
  label = 'Menú',
  id = 'site-mobile-nav',
  tone = 'brand',
}: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    onCloseRef.current()
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    document.documentElement.classList.add('legacy-nav-open')

    const focusable = () =>
      [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => !node.hasAttribute('disabled') && node.tabIndex !== -1,
      )

    const frame = window.setTimeout(() => {
      const items = focusable()
      ;(items[0] ?? panel).focus()
    }, 0)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.documentElement.classList.remove('legacy-nav-open')
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [open])

  // Deslizar hacia abajo cierra la hoja (sin seguimiento visual: la CSP no admite estilos en línea).
  const swipeStart = useRef<{ y: number; x: number } | null>(null)
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const panel = panelRef.current
    if (!panel || panel.scrollTop > 0 || event.touches.length !== 1) {
      swipeStart.current = null
      return
    }
    const touch = event.touches[0]
    swipeStart.current = { y: touch.clientY, x: touch.clientX }
  }
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const dy = touch.clientY - start.y
    const dx = Math.abs(touch.clientX - start.x)
    if (dy > 80 && dy > dx * 1.5) onCloseRef.current()
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={cn('nav-drawer-root', tone === 'institution' && 'is-institution')}>
      <div className="nav-drawer-veil" onClick={onClose} />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="nav-drawer-panel"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          swipeStart.current = null
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
