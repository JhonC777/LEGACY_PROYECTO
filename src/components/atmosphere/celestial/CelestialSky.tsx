import { useEffect, useRef } from 'react'
import '@/styles/celestial-sky.css'
import { createCelestialSky } from './celestialSky'

/**
 * Cielo celestial a pantalla completa para el acceso administrador:
 * atmósfera oro/plata, nebulosa, estrellas en tres profundidades, constelaciones y destellos.
 * Decorativo (aria-hidden); sin estilos en línea (CSP 'self').
 */
export function CelestialSky() {
  const rootRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLCanvasElement>(null)
  const nebulaRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const backdrop = backdropRef.current
    const nebula = nebulaRef.current
    const stars = starsRef.current
    if (!root || !backdrop || !nebula || !stars) return
    const sky = createCelestialSky({ root, backdrop, nebula, stars })
    return () => sky.destroy()
  }, [])

  return (
    <div ref={rootRef} className="celestial-sky" aria-hidden>
      <canvas ref={backdropRef} className="celestial-sky-layer is-backdrop" />
      <canvas ref={nebulaRef} className="celestial-sky-layer is-nebula" />
      <canvas ref={starsRef} className="celestial-sky-layer is-stars" />
      <div className="celestial-sky-vignette" />
    </div>
  )
}
