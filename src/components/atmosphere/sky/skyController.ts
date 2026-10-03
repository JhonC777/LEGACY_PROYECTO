/*
  LEGACY · Cielo de partículas compartido para las páginas internas.
  Reutiliza el motor del Home (campo, fondo oro/negro/plata y figuras) en una variante
  serena: menos partículas, menos brillo, sin cursor fantasma y figuras ocasionales
  (cada ~16–20 s) que solo se forman en espacio libre, nunca bajo texto ni tarjetas.
  Un solo lienzo fijo para toda la app: navegar entre páginas no lo reinicia.
  Solo escribe estilos vía CSSOM/clases, compatible con CSP 'self'.
*/
import { Backdrop } from '@/components/home/particles/backdrop'
import { ParticleField } from '@/components/home/particles/field'
import { getShape, SHAPE_MODES, shapeTargets, type Shape, type ShapeName } from '@/components/home/particles/shapes'

export type SkyElements = {
  root: HTMLElement
  backdrop: HTMLCanvasElement
  canvas: HTMLCanvasElement
}

export type SkyController = {
  setActive: (on: boolean) => void
  setRoute: (path: string, hash: string) => void
  destroy: () => void
}

type Box = { x: number; y: number; w: number; h: number }

const MODES = SHAPE_MODES

/**
 * Figuras con sentido según la página (se alternan en este orden):
 * explorar → brújula + libro · archivo → llave + libro · ficha → birrete + bombilla + pluma ·
 * institución → escudo + árbol · resto → constelación + reloj de arena.
 */
export function shapesForRoute(path: string, hash: string): ShapeName[] {
  if (/^\/instituciones\/[^/]+\/proyectos\/[^/]+/.test(path)) return ['birrete', 'bombilla', 'pluma']
  if (/^\/instituciones\/[^/]+\/proyectos\/?$/.test(path)) return ['llave', 'libro']
  if (/^\/instituciones\/[^/]+\/?$/.test(path)) return ['escudo', 'arbol']
  if (path === '/explorar' || path === '/instituciones') {
    return hash === '#categorias' ? ['constelacion', 'brujula'] : ['brujula', 'libro']
  }
  return ['constelacion', 'reloj']
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoother = (v: number) => {
  const x = clamp01(v)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

/* Elementos que nunca deben quedar debajo de una figura. */
const SOLID_TAGS = new Set(['IMG', 'VIDEO', 'SVG', 'CANVAS', 'PICTURE', 'IFRAME', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'])

function hasOwnText(el: Element) {
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 3 && (n.textContent ?? '').trim()) return true
  }
  return false
}

function isPainted(cs: CSSStyleDeclaration) {
  if (cs.backgroundImage !== 'none') return true
  const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor)
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean)
    const a = parts.length > 3 ? parseFloat(parts[3]) : 1
    if (a > 0.02) return true
  }
  return parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0
}

/**
 * Busca el mayor hueco libre del viewport (rejilla de ocupación + tabla de sumas):
 * nada de texto, imágenes, controles ni tarjetas dentro, con margen de respiro.
 */
export function findFreeStage(coarse: boolean, aspect = 1): Box | null {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const header = document.querySelector('.legacy-header')
  const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0
  const CELL = coarse ? 12 : 16
  const gw = Math.ceil(vw / CELL)
  const gh = Math.ceil(vh / CELL)
  const occ = new Uint8Array(gw * gh)
  const pad = coarse ? 12 : 16
  const scope = document.querySelector('.explore-shell') ?? document.body
  const area = vw * vh
  const all = scope.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') continue
    if (el.closest('.legacy-sky, [data-sky-photo]')) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || r.bottom < top || r.top > vh || r.right < 0 || r.left > vw) continue
    if (r.width * r.height > area * 0.5) continue // contenedores y fondos de página
    let solid = SOLID_TAGS.has(el.tagName.toUpperCase()) || hasOwnText(el)
    if (!solid) {
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue
      solid = isPainted(cs)
    }
    if (!solid) continue
    const x0 = Math.max(0, Math.floor((r.left - pad) / CELL))
    const x1 = Math.min(gw - 1, Math.floor((r.right + pad) / CELL))
    const y0 = Math.max(0, Math.floor((r.top - pad) / CELL))
    const y1 = Math.min(gh - 1, Math.floor((r.bottom + pad) / CELL))
    for (let y = y0; y <= y1; y++) occ.fill(1, y * gw + x0, y * gw + x1 + 1)
  }
  // la franja del header y los bordes del viewport también cuentan como ocupados
  const topRows = Math.ceil((top + pad) / CELL)
  for (let y = 0; y < Math.min(gh, topRows); y++) occ.fill(1, y * gw, (y + 1) * gw)
  const edge = Math.ceil(pad / CELL)
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < edge; x++) {
      occ[y * gw + x] = 1
      occ[y * gw + gw - 1 - x] = 1
    }
  }
  for (let y = gh - edge; y < gh; y++) if (y >= 0) occ.fill(1, y * gw, (y + 1) * gw)

  const sat = new Uint32Array((gw + 1) * (gh + 1))
  for (let y = 0; y < gh; y++) {
    let row = 0
    for (let x = 0; x < gw; x++) {
      row += occ[y * gw + x]
      sat[(y + 1) * (gw + 1) + x + 1] = sat[y * (gw + 1) + x + 1] + row
    }
  }
  const sum = (x: number, y: number, w: number, h: number) =>
    sat[(y + h) * (gw + 1) + x + w] - sat[y * (gw + 1) + x + w] - sat[(y + h) * (gw + 1) + x] + sat[y * (gw + 1) + x]

  // en el celular solo la zona alta (bajo el header); si no hay sitio, no hay figura
  const maxRows = coarse ? Math.min(gh, Math.ceil((top + vh * 0.42) / CELL)) : gh
  const pref = coarse ? { x: vw / 2, y: top + 80 } : { x: vw * 0.86, y: vh * 0.4 }
  // cajas candidatas (anchas, cuadradas o altas para los márgenes laterales), de mayor a menor figura
  const dims = coarse ? [96, 120, 150, 180, 210, 240] : [104, 128, 160, 200, 240, 280, 320, 360, 420]
  const minFit = coarse ? 92 : 100
  const cands: { w: number; h: number; fit: number }[] = []
  for (const w of dims) {
    for (const h of dims) {
      const fit = Math.min(w, h * aspect) // ancho real de la figura dentro de la caja
      if (fit >= minFit && Math.abs(Math.log((w / h) / aspect)) < 1.1) cands.push({ w, h, fit })
    }
  }
  cands.sort((p, q) => q.fit - p.fit || p.w * p.h - q.w * q.h)
  for (const c of cands) {
    const w = Math.ceil(c.w / CELL)
    const h = Math.ceil(c.h / CELL)
    if (w > gw || h > maxRows) continue
    let best: Box | null = null
    let bestD = Infinity
    for (let y = 0; y + h <= maxRows; y++) {
      for (let x = 0; x + w <= gw; x++) {
        if (sum(x, y, w, h)) continue
        const cx = (x + w / 2) * CELL
        const cy = (y + h / 2) * CELL
        const d = (cx - pref.x) ** 2 + (cy - pref.y) ** 2
        if (d < bestD) {
          bestD = d
          best = { x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL }
        }
      }
    }
    if (best) return best
  }
  return null
}

export function createSky(el: SkyElements): SkyController {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const mqCoarse = window.matchMedia('(pointer: coarse)')
  let reduced = mqReduce.matches
  let coarse = mqCoarse.matches || window.innerWidth < 700
  let active = false
  let dead = false
  let field: ParticleField | null = null
  let backdrop: Backdrop | null = null
  const built: Partial<Record<ShapeName, Shape>> = {}
  let route = { path: '', hash: '', shapes: ['constelacion'] as ShapeName[], visit: 0 }
  const sched = { wait: 4.5, next: 0, scroller: null as HTMLElement | null, scrollTop: 0 }
  const fadeIn = { t: 0, done: false }
  let raf = 0
  let last = 0
  let frame = 0
  let lastScroll = -1e9
  const perf = { acc: 0, frames: 0 }
  // variante serena: densidad y brillo por debajo del Home
  const lowEnd =
    (navigator.hardwareConcurrency || 8) <= 4 ||
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4
  const density = () => (coarse ? 0.44 : 0.42) * (lowEnd ? 0.7 : 1)
  const BRIGHT = 0.95

  const ensure = () => {
    if (field || dead) return Boolean(field)
    try {
      // sin capa de brillo (bloom): componerla a pantalla completa cuesta cuadros y aquí
      // la variante es serena; las figuras se leen bien solo con las partículas
      field = new ParticleField(el.canvas, { coarse, seed: 23, bloom: null, autopilot: false })
      backdrop = new Backdrop(el.backdrop)
    } catch {
      field = null
      backdrop = null
      return false
    }
    preload(route.shapes)
    size()
    return true
  }

  /* Solo se construyen las figuras de la página actual (cada una cuesta unos ms una vez). */
  function preload(names: ShapeName[]) {
    for (const name of names) {
      if (built[name]) continue
      getShape(name).then(
        (s) => {
          built[name] = s
        },
        () => undefined,
      )
    }
  }

  const renderStatic = () => {
    if (!field || !backdrop) return
    field.cancelShape()
    field.fade = BRIGHT
    backdrop.draw(0, field.par, 0.6)
    field.render(true)
  }

  let sized = ''
  const size = () => {
    if (!field || !backdrop) return
    const w = el.root.clientWidth
    const h = el.root.clientHeight
    if (w < 2 || h < 2) return
    const key = `${w}x${h}`
    if (key === sized) return
    sized = key
    coarse = mqCoarse.matches || w < 700
    field.coarse = coarse
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    if (w * h * dpr * dpr > 2.6e6) dpr = Math.max(1, Math.sqrt(2.6e6 / (w * h)))
    if (field.shape) field.cancelShape()
    field.resize(w, h, dpr)
    field.n = Math.max(coarse ? 260 : 600, Math.round(field.maxN * density()))
    backdrop.resize(w, h, coarse)
    backdrop.draw(field.time, field.par, 0.6)
    if (reduced) renderStatic()
    else field.render(false)
  }

  /* ---------- Figuras: ocasionales, contextuales y en espacio libre ---------- */
  const scrollerNow = () => document.querySelector<HTMLElement>('.explore-scroll')
  const tryForm = () => {
    if (!field) return false
    const name = route.shapes[sched.next % route.shapes.length]
    const shape = built[name]
    if (!shape) return false
    const box = findFreeStage(coarse, shape.aspect)
    if (!box) return false
    const budget = Math.min(coarse ? 520 : 1500, Math.round(field.n * (coarse ? 0.62 : 0.58)))
    const tg = shapeTargets(shape, box, budget, 31 + sched.next, 1.1)
    if (!field.formShape(tg, { mode: MODES[name], gather: 3.2, hold: 3.6, everywhere: true })) return false
    sched.next++
    sched.scroller = scrollerNow()
    sched.scrollTop = sched.scroller?.scrollTop ?? 0
    return true
  }

  const schedule = (dt: number, now: number) => {
    if (!field) return
    if (field.shapePhase() !== 'drift') {
      // la figura se suelta si la página se desplaza: nunca queda encima del contenido
      const s = sched.scroller
      if (s && Math.abs(s.scrollTop - sched.scrollTop) > 28) field.dissolveNow()
      return
    }
    sched.wait -= dt
    if (sched.wait > 0) return
    if (now - lastScroll < 0.9) {
      sched.wait = 1
      return
    }
    // la cuenta solo corre en deriva (sin figura): restar la duración de la figura (~9,8 s)
    // deja ~16–20 s de inicio a inicio entre figuras
    sched.wait = tryForm() ? Math.max(5, 16 + Math.random() * 4 - 9.8) : 3.5
  }

  const surface = () => {
    const photo = Boolean(document.querySelector('[data-sky-photo]'))
    el.root.classList.toggle('is-photo', photo)
  }

  /* ---------- Bucle ---------- */
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    if (!field || !backdrop) return
    if (!fadeIn.done) {
      fadeIn.t += dt
      const k = smoother(fadeIn.t / 1.2)
      field.fade = BRIGHT * k
      if (k >= 1) fadeIn.done = true
    }
    field.step(dt)
    field.render(false)
    if (++frame % 6 === 0) backdrop.draw(field.time, field.par, 0.6) // el fondo se mueve muy despacio
    if (frame % 30 === 0) surface()
    schedule(dt, now / 1000)
    perf.acc += dt
    perf.frames++
    if (perf.frames >= 90) {
      const avg = perf.acc / perf.frames
      const minN = coarse ? 220 : 500
      if (avg > 0.021 && field.n > minN && !field.shape) field.n = Math.max(minN, Math.round(field.n * 0.85))
      perf.acc = 0
      perf.frames = 0
    }
  }

  const shouldRun = () => active && !reduced && !document.hidden && !dead && Boolean(field)
  const sync = () => {
    if (shouldRun()) {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    } else if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  /* ---------- Eventos ---------- */
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && field && active) field.setPointer(e.clientX, e.clientY)
  }
  const onPointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget) field?.releasePointer()
  }
  const onScroll = () => {
    lastScroll = performance.now() / 1000
  }
  let resizeTimer = 0
  const onResize = () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      if (!dead) size()
    }, 140)
  }
  const onMotion = () => {
    reduced = mqReduce.matches
    if (reduced) renderStatic()
    sync()
  }

  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('pointerout', onPointerOut, { passive: true })
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', sync)
  mqReduce.addEventListener('change', onMotion)
  const ro = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
  ro?.observe(el.root)

  return {
    setActive(on) {
      if (on === active) return
      active = on
      el.root.classList.toggle('is-on', on)
      // con el cielo activo, las tarjetas grandes dejan el desenfoque de fondo (ver sky.css)
      document.documentElement.classList.toggle('has-legacy-sky', on)
      if (on && ensure()) {
        surface()
        if (reduced) renderStatic()
        else if (!fadeIn.done && field) field.fade = 0
      }
      sync()
    },
    setRoute(path, hash) {
      if (path === route.path && hash === route.hash) return
      const samePage = path === route.path
      route = { path, hash, shapes: shapesForRoute(path, hash), visit: route.visit + 1 }
      if (field) preload(route.shapes)
      if (!samePage) {
        field?.dissolveNow()
        sched.wait = 4.5
        sched.next = 0
      }
      window.setTimeout(surface, 120)
      if (reduced) window.setTimeout(renderStatic, 160)
    },
    destroy() {
      dead = true
      document.documentElement.classList.remove('has-legacy-sky')
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      window.clearTimeout(resizeTimer)
      ro?.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerout', onPointerOut)
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', sync)
      mqReduce.removeEventListener('change', onMotion)
    },
  }
}
