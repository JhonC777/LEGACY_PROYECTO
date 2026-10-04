/*
  LEGACY · Cielo celestial del acceso administrador (selector de institución y login).
  Capas, de atrás hacia adelante:
  1. Atmósfera oro/plata: el mismo `Backdrop` del Home (auroras + barrido de luz), a 10 Hz.
  2. Nebulosa: bruma oro/plata prerenderizada UNA vez en un lienzo pequeño; se mueve solo
     con `transform` (compositor), sin redibujar.
  3. Estrellas en tres profundidades con paralaje (deriva + puntero), centelleo, constelaciones
     que se trazan y se apagan despacio, y un destello fugaz ocasional.
  Ligero: se pausa con la pestaña oculta, movimiento reducido = un cuadro estático,
  menos estrellas y 30 fps en equipos modestos o táctiles. Sin violeta.
  Solo escribe estilos vía CSSOM (CSP 'self').
*/
import { Backdrop } from '@/components/home/particles/backdrop'
import { mulberry32 } from '@/components/home/particles/field'

export type CelestialElements = {
  root: HTMLElement
  backdrop: HTMLCanvasElement
  nebula: HTMLCanvasElement
  stars: HTMLCanvasElement
}

export type CelestialController = { destroy: () => void }

/* Paleta Legacy: oro, oro suave, plata, platino, blanco. */
const COLORS = ['214,184,120', '240,217,160', '200,202,211', '230,232,238', '247,245,239'] as const
const ALPHA_STEPS = 8

type Layer = {
  n: number
  x: Float32Array
  y: Float32Array
  r: Float32Array
  a: Float32Array
  f: Float32Array
  ph: Float32Array
  c: Uint8Array
  /** velocidad de deriva (px/s) y fuerza del paralaje del puntero */
  vx: number
  vy: number
  par: number
  ox: number
  oy: number
}

type Constellation = {
  pts: number[] // x,y relativos (px) al ancla
  edges: number[] // pares de índices
  ax: number
  ay: number
  per: number
  ph: number
}

/* Plantillas de constelaciones (coordenadas en una caja de ~1). */
const TEMPLATES: { pts: number[]; edges: number[] }[] = [
  { pts: [0, 0.3, 0.22, 0.12, 0.45, 0.2, 0.62, 0.05, 0.8, 0.22, 0.58, 0.48, 0.36, 0.62], edges: [0, 1, 1, 2, 2, 3, 3, 4, 2, 5, 5, 6] },
  { pts: [0, 0, 0.18, 0.28, 0.4, 0.34, 0.55, 0.62, 0.32, 0.8, 0.74, 0.5], edges: [0, 1, 1, 2, 2, 3, 3, 4, 2, 5] },
  { pts: [0.1, 0.5, 0.3, 0.42, 0.5, 0.5, 0.7, 0.38, 0.9, 0.46, 0.5, 0.15, 0.52, 0.85], edges: [0, 1, 1, 2, 2, 3, 3, 4, 5, 2, 2, 6] },
  { pts: [0, 0.2, 0.25, 0, 0.5, 0.18, 0.42, 0.5, 0.15, 0.55, 0.7, 0.7], edges: [0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 3, 5] },
  { pts: [0, 0.6, 0.2, 0.35, 0.38, 0.4, 0.5, 0.15, 0.68, 0.3, 0.86, 0.12, 0.6, 0.62], edges: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 2, 6] },
]

/** Destello suave pre-renderizado (núcleo + halo) para las estrellas cercanas. */
function sprite(rgb: string, size: number, cross: boolean) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  if (!g) return c
  const h = size / 2
  const rg = g.createRadialGradient(h, h, 0, h, h, h)
  rg.addColorStop(0, `rgba(${rgb},1)`)
  rg.addColorStop(0.12, `rgba(${rgb},0.85)`)
  rg.addColorStop(0.32, `rgba(${rgb},0.22)`)
  rg.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = rg
  g.fillRect(0, 0, size, size)
  if (cross) {
    // destello en cruz muy fino (estrella de cuatro puntas)
    g.globalCompositeOperation = 'lighter'
    for (const [w, hgt] of [[size, size * 0.06], [size * 0.06, size]]) {
      const lg = g.createRadialGradient(h, h, 0, h, h, h)
      lg.addColorStop(0, `rgba(${rgb},0.75)`)
      lg.addColorStop(1, `rgba(${rgb},0)`)
      g.fillStyle = lg
      g.fillRect(h - w / 2, h - hgt / 2, w, hgt)
    }
  }
  return c
}

/** Bruma de nebulosa oro/plata en un lienzo pequeño (se escala por CSS). */
function paintNebula(canvas: HTMLCanvasElement, W: number, H: number, portrait: boolean, seed: number) {
  const s = 0.25
  const w = (canvas.width = Math.max(2, Math.ceil(W * s * 1.2)))
  const h = (canvas.height = Math.max(2, Math.ceil(H * s * 1.2)))
  const g = canvas.getContext('2d')
  if (!g) return
  const rnd = mulberry32(seed)
  g.clearRect(0, 0, w, h)
  g.globalCompositeOperation = 'lighter'
  // banda diagonal tipo vía láctea: muchas elipses suaves a lo largo de una curva
  const blobs = portrait ? 26 : 34
  for (let i = 0; i < blobs; i++) {
    const u = i / (blobs - 1)
    const bx = portrait ? w * (0.08 + 0.84 * u) : w * (-0.05 + 1.1 * u)
    const by = portrait ? h * (0.12 + 0.62 * u + 0.08 * Math.sin(u * 5.2)) : h * (0.78 - 0.6 * u + 0.1 * Math.sin(u * 4.4))
    const rr = Math.max(w, h) * (0.06 + 0.12 * rnd())
    const gold = rnd() < 0.62
    const col = gold ? (rnd() < 0.5 ? '214,184,120' : '240,217,160') : rnd() < 0.5 ? '200,202,211' : '230,232,238'
    const a = (gold ? 0.07 : 0.05) * (0.6 + 0.8 * rnd())
    g.setTransform(1, 0, 0, 0.55 + 0.5 * rnd(), bx, by)
    g.rotate((rnd() - 0.5) * 1.2)
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, rr)
    rg.addColorStop(0, `rgba(${col},${a})`)
    rg.addColorStop(0.5, `rgba(${col},${a * 0.38})`)
    rg.addColorStop(1, `rgba(${col},0)`)
    g.fillStyle = rg
    g.fillRect(-rr, -rr, rr * 2, rr * 2)
  }
  // dos núcleos luminosos (oro y platino) para dar profundidad
  const cores: [number, number, number, string, number][] = portrait
    ? [[0.72, 0.16, 0.3, '240,217,160', 0.12], [0.2, 0.86, 0.26, '230,232,238', 0.07]]
    : [[0.78, 0.22, 0.24, '240,217,160', 0.12], [0.14, 0.82, 0.22, '230,232,238', 0.07]]
  for (const [cx, cy, cr, col, a] of cores) {
    g.setTransform(1, 0, 0, 1, cx * w, cy * h)
    const rr = Math.max(w, h) * cr
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, rr)
    rg.addColorStop(0, `rgba(${col},${a})`)
    rg.addColorStop(0.4, `rgba(${col},${a * 0.35})`)
    rg.addColorStop(1, `rgba(${col},0)`)
    g.fillStyle = rg
    g.fillRect(-rr, -rr, rr * 2, rr * 2)
  }
  // polvo fino dentro de la bruma
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.globalCompositeOperation = 'source-over'
  for (let i = 0; i < (portrait ? 220 : 380); i++) {
    const u = rnd()
    const bx = portrait ? w * (0.08 + 0.84 * u) : w * (-0.05 + 1.1 * u)
    const by = (portrait ? h * (0.12 + 0.62 * u) : h * (0.78 - 0.6 * u)) + (rnd() - 0.5) * h * 0.22
    g.fillStyle = `rgba(${COLORS[(rnd() * 4) | 0]},${0.08 + 0.18 * rnd()})`
    g.fillRect(bx, by, 0.6, 0.6)
  }
}

export function createCelestialSky(el: CelestialElements): CelestialController {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const mqCoarse = window.matchMedia('(pointer: coarse)')
  const nav = navigator as Navigator & { deviceMemory?: number }
  const lowEnd = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
  const rnd = mulberry32(20261003)
  let reduced = mqReduce.matches
  let coarse = mqCoarse.matches
  let W = 1
  let H = 1
  let dpr = 1
  let dead = false
  let raf = 0
  let last = 0
  let acc = 0
  let time = 0
  let bdTimer = 0
  const ctx = el.stars.getContext('2d', { alpha: true })
  let backdrop: Backdrop | null = null
  try {
    backdrop = new Backdrop(el.backdrop)
  } catch {
    backdrop = null
  }
  const par = { x: 0, y: 0, tx: 0, ty: 0 }
  const layers: Layer[] = []
  let constellations: Constellation[] = []
  const glint = { t: -1, x: 0, y: 0, dx: 0, dy: 0, len: 0, next: 4 + rnd() * 4 }
  const styles: string[] = []
  for (const c of COLORS) for (let a = 1; a <= ALPHA_STEPS; a++) styles.push(`rgba(${c},${((a / ALPHA_STEPS) * 0.95).toFixed(3)})`)
  const sprites = COLORS.map((c, i) => sprite(c, 32, i >= 3))
  const lineStyles = [0.08, 0.14, 0.2, 0.27, 0.34].map((a) => `rgba(214,184,120,${a})`)

  const makeLayer = (n: number, rMin: number, rMax: number, aMin: number, aMax: number, vx: number, vy: number, parK: number): Layer => {
    const L: Layer = {
      n,
      x: new Float32Array(n),
      y: new Float32Array(n),
      r: new Float32Array(n),
      a: new Float32Array(n),
      f: new Float32Array(n),
      ph: new Float32Array(n),
      c: new Uint8Array(n),
      vx,
      vy,
      par: parK,
      ox: 0,
      oy: 0,
    }
    for (let i = 0; i < n; i++) {
      L.x[i] = rnd() * W
      L.y[i] = rnd() * H
      L.r[i] = rMin + (rMax - rMin) * Math.pow(rnd(), 2.2)
      L.a[i] = aMin + (aMax - aMin) * rnd()
      L.f[i] = 0.4 + rnd() * 1.8
      L.ph[i] = rnd() * Math.PI * 2
      const k = rnd()
      L.c[i] = k < 0.36 ? 0 : k < 0.58 ? 1 : k < 0.78 ? 2 : k < 0.94 ? 3 : 4
    }
    return L
  }

  const build = () => {
    const area = W * H
    const k = (lowEnd ? 0.55 : 1) * (coarse ? 0.85 : 1)
    layers.length = 0
    // lejos: polvo fino plateado · medio: oro y plata · cerca: pocas estrellas con halo
    layers.push(makeLayer(Math.round((area / 1000) * k), 0.35, 1, 0.22, 0.66, -1.6, -0.7, 5))
    layers.push(makeLayer(Math.round((area / 4200) * k), 0.7, 1.55, 0.35, 0.88, -3.6, -1.4, 13))
    layers.push(makeLayer(Math.round((area / 24000) * k) + 8, 1.4, 2.6, 0.55, 1, -7, -2.6, 26))
    // constelaciones repartidas por los bordes (el centro lo ocupa la tarjeta)
    const portrait = H > W
    const size = Math.min(W, H) * (portrait ? 0.42 : 0.26)
    const anchors: [number, number][] = portrait
      ? [[0.08, 0.06], [0.52, 0.12], [0.1, 0.76], [0.55, 0.8], [0.3, 0.42]]
      : [[0.05, 0.1], [0.72, 0.08], [0.06, 0.62], [0.78, 0.6], [0.4, 0.78]]
    constellations = TEMPLATES.map((T, i) => {
      const s = size * (0.8 + 0.4 * rnd())
      const pts: number[] = []
      for (let j = 0; j < T.pts.length; j++) pts.push(T.pts[j] * s)
      return { pts, edges: T.edges, ax: anchors[i][0] * W, ay: anchors[i][1] * H, per: 18 + rnd() * 10, ph: rnd() * 6.28 }
    })
  }

  const size = () => {
    const w = el.root.clientWidth
    const h = el.root.clientHeight
    if (w < 2 || h < 2) return
    if (w === W && h === H && layers.length) return
    W = w
    H = h
    coarse = mqCoarse.matches || w < 700
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.5)
    el.stars.width = Math.round(W * dpr)
    el.stars.height = Math.round(H * dpr)
    backdrop?.resize(W, H, coarse || H > W)
    paintNebula(el.nebula, W, H, H > W, 7)
    build()
    drawFrame(0, true)
  }

  /* ---------- dibujo ---------- */
  const buckets: number[][] = Array.from({ length: COLORS.length * ALPHA_STEPS }, () => [])
  function drawFrame(dt: number, still: boolean) {
    if (!ctx) return
    time += dt
    const t = time
    // paralaje del puntero, suavizado
    const f = 1 - Math.exp(-dt * 2.2)
    par.x += (par.tx - par.x) * f
    par.y += (par.ty - par.y) * f
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const twk = still ? 0 : 1

    for (let li = 0; li < layers.length; li++) {
      const L = layers[li]
      L.ox = (((L.ox + L.vx * dt) % W) + W) % W
      L.oy = (((L.oy + L.vy * dt) % H) + H) % H
      const px = L.ox - par.x * L.par
      const py = L.oy - par.y * L.par
      if (li === 0) {
        for (const b of buckets) b.length = 0
        for (let i = 0; i < L.n; i++) {
          const tw = 0.62 + 0.38 * Math.sin(t * L.f[i] + L.ph[i]) * twk
          let ai = Math.round(L.a[i] * tw * ALPHA_STEPS) - 1
          if (ai < 0) continue
          if (ai >= ALPHA_STEPS) ai = ALPHA_STEPS - 1
          buckets[L.c[i] * ALPHA_STEPS + ai].push(i)
        }
        for (let b = 0; b < buckets.length; b++) {
          const list = buckets[b]
          if (!list.length) continue
          ctx.fillStyle = styles[b]
          for (const i of list) {
            let x = L.x[i] + px
            let y = L.y[i] + py
            if (x > W) x -= W
            if (y > H) y -= H
            const r = L.r[i]
            ctx.fillRect(x - r / 2, y - r / 2, r, r)
          }
        }
        continue
      }
      for (let i = 0; i < L.n; i++) {
        let x = L.x[i] + px
        let y = L.y[i] + py
        if (x > W) x -= W
        if (y > H) y -= H
        const s = Math.sin(t * L.f[i] + L.ph[i])
        let a = L.a[i] * (0.6 + 0.4 * s * twk)
        let r = L.r[i]
        if (li === 2 && !still) {
          // centelleo: de vez en cuando una estrella cercana se enciende
          const flare = Math.pow(Math.max(0, Math.sin(t * L.f[i] * 0.37 + L.ph[i] * 3)), 18)
          a = Math.min(1, a + flare * 0.7)
          r *= 1 + flare * 1.2
        }
        const d = r * (li === 2 ? 7 : 5)
        ctx.globalAlpha = a
        ctx.drawImage(sprites[L.c[i]], x - d / 2, y - d / 2, d, d)
      }
      ctx.globalAlpha = 1

      // las constelaciones viven en la capa media
      if (li === 1) drawConstellations(px, py, t, still)
    }
    if (!still) drawGlint(dt)
  }

  function drawConstellations(px: number, py: number, t: number, still: boolean) {
    if (!ctx) return
    ctx.lineWidth = 0.7
    ctx.lineCap = 'round'
    for (const C of constellations) {
      // ciclo: se traza, permanece, se apaga y descansa
      const u = still ? 0.45 : (((t + C.ph * C.per) / C.per) % 1 + 1) % 1
      const draw = u < 0.22 ? u / 0.22 : 1
      const vis = u < 0.22 ? 1 : u < 0.68 ? 1 : u < 0.86 ? 1 - (u - 0.68) / 0.18 : 0
      if (vis <= 0.01) continue
      let ox = C.ax + px * 0.35
      let oy = C.ay + py * 0.35
      ox = ((ox % W) + W) % W
      oy = ((oy % H) + H) % H
      const P = C.pts
      const E = C.edges
      const ne = E.length / 2
      const shown = draw * ne
      ctx.strokeStyle = lineStyles[Math.min(lineStyles.length - 1, Math.round(vis * (lineStyles.length - 1)))]
      ctx.beginPath()
      for (let e = 0; e < ne; e++) {
        const k = Math.min(1, shown - e)
        if (k <= 0) break
        const a = E[e * 2]
        const b = E[e * 2 + 1]
        const x0 = ox + P[a * 2], y0 = oy + P[a * 2 + 1]
        const x1 = ox + P[b * 2], y1 = oy + P[b * 2 + 1]
        ctx.moveTo(x0, y0)
        ctx.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)
      }
      ctx.stroke()
      // nodos: estrellas con halo oro
      for (let j = 0; j < P.length / 2; j++) {
        const tw = still ? 0.8 : 0.7 + 0.3 * Math.sin(t * 1.3 + j * 1.7 + C.ph)
        ctx.globalAlpha = Math.min(1, vis * tw)
        const d = j % 3 === 0 ? 13 : 9
        ctx.drawImage(sprites[j % 3 === 0 ? 4 : 1], ox + P[j * 2] - d / 2, oy + P[j * 2 + 1] - d / 2, d, d)
      }
      ctx.globalAlpha = 1
    }
  }

  function drawGlint(dt: number) {
    if (!ctx) return
    if (glint.t < 0) {
      glint.next -= dt
      if (glint.next > 0) return
      glint.t = 0
      glint.x = W * (0.15 + 0.8 * rnd())
      glint.y = H * (0.04 + 0.35 * rnd())
      const ang = Math.PI * (0.78 + 0.12 * rnd()) // hacia abajo a la izquierda
      const sp = Math.max(W, H) * (0.5 + 0.25 * rnd())
      glint.dx = Math.cos(ang) * sp
      glint.dy = Math.sin(ang) * sp * 0.55
      glint.len = 90 + rnd() * 110
      return
    }
    glint.t += dt
    const D = 1.1
    if (glint.t > D) {
      glint.t = -1
      glint.next = 7 + rnd() * 9
      return
    }
    const k = glint.t / D
    const env = Math.sin(Math.PI * k)
    const hx = glint.x + glint.dx * k
    const hy = glint.y + glint.dy * k
    const m = Math.hypot(glint.dx, glint.dy) || 1
    const tx = hx - (glint.dx / m) * glint.len
    const ty = hy - (glint.dy / m) * glint.len
    const lg = ctx.createLinearGradient(hx, hy, tx, ty)
    lg.addColorStop(0, `rgba(247,245,239,${0.85 * env})`)
    lg.addColorStop(0.25, `rgba(240,217,160,${0.45 * env})`)
    lg.addColorStop(1, 'rgba(214,184,120,0)')
    ctx.strokeStyle = lg
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(hx, hy)
    ctx.stroke()
    ctx.globalAlpha = env
    ctx.drawImage(sprites[4], hx - 8, hy - 8, 16, 16)
    ctx.globalAlpha = 1
  }

  /* ---------- bucle ---------- */
  const frameMin = () => (coarse || lowEnd ? 1 / 31 : 0) // 30 fps en táctiles y equipos modestos
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    acc += dt
    if (acc < frameMin()) return
    const step = Math.min(0.066, acc)
    acc = 0
    drawFrame(step, false)
    bdTimer += step
    if (backdrop && bdTimer > 0.1) {
      bdTimer = 0
      backdrop.draw(time, par, 1)
    }
    // la bruma se mueve solo por transformación (no se redibuja)
    el.nebula.style.transform = `translate3d(${(-par.x * 8 + Math.sin(time * 0.05) * 10).toFixed(1)}px, ${(-par.y * 6 + Math.cos(time * 0.04) * 8).toFixed(1)}px, 0) scale(1.08)`
  }

  const run = () => !dead && !reduced && !document.hidden
  const sync = () => {
    if (run()) {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    } else if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
  const still = () => {
    drawFrame(0, true)
    backdrop?.draw(0, par, 1)
  }

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    par.tx = (e.clientX / W - 0.5) * 2
    par.ty = (e.clientY / H - 0.5) * 2
  }
  let resizeTimer = 0
  const onResize = () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      if (dead) return
      size()
      if (reduced) still()
    }, 140)
  }
  const onMotion = () => {
    reduced = mqReduce.matches
    if (reduced) still()
    sync()
  }

  size()
  still()
  el.root.classList.add('is-ready')
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', sync)
  mqReduce.addEventListener('change', onMotion)
  const ro = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
  ro?.observe(el.root)
  sync()

  return {
    destroy() {
      dead = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      window.clearTimeout(resizeTimer)
      ro?.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', sync)
      mqReduce.removeEventListener('change', onMotion)
    },
  }
}
