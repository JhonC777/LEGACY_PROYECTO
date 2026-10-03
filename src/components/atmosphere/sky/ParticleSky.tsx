import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { createSky, type SkyController } from '@/components/atmosphere/sky/skyController'
import '@/styles/sky.css'

/** El Home tiene su propio hero de partículas; login y admin conservan su fondo. */
export function isSkyRoute(pathname: string) {
  return pathname !== '/' && pathname !== '' && !pathname.startsWith('/admin')
}

/**
 * Cielo de partículas oro/plata compartido por las páginas internas.
 * Vive a nivel de la app (fuera de las rutas): un solo lienzo que no se reinicia al navegar.
 */
export function ParticleSky() {
  const { pathname, hash } = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctrl = useRef<SkyController | null>(null)
  const active = isSkyRoute(pathname)

  useLayoutEffect(() => {
    const root = rootRef.current
    const backdrop = backdropRef.current
    const canvas = canvasRef.current
    if (!root || !backdrop || !canvas) return
    const sky = createSky({ root, backdrop, canvas })
    ctrl.current = sky
    return () => {
      sky.destroy()
      ctrl.current = null
    }
  }, [])

  useLayoutEffect(() => {
    ctrl.current?.setRoute(pathname, hash)
    ctrl.current?.setActive(active)
  }, [pathname, hash, active])

  return (
    <div ref={rootRef} className="legacy-sky" aria-hidden>
      <canvas ref={backdropRef} className="legacy-sky-layer is-backdrop" />
      <canvas ref={canvasRef} className="legacy-sky-layer is-particles" />
      <span className="legacy-sky-layer is-veil" />
    </div>
  )
}
