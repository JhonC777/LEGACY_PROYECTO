/*
  LEGACY · Figuras para el enjambre de partículas.
  Cada figura se dibuja (o se carga) en un lienzo fuera de pantalla y se muestrea en
  puntos objetivo normalizados. Clase 2 = borde (silueta), 1 = relleno fuerte, 0 = relleno tenue.
*/
import { mulberry32, type Box, type Targets } from './field'

export type ShapeName = 'escudo' | 'libro' | 'birrete' | 'constelacion'

export type Shape = {
  edge: Float32Array
  strong: Float32Array
  weak: Float32Array
  aspect: number
  quota: [number, number]
}

type Sampled = { edge: number[]; strong: number[]; weak: number[] }

export const SHAPE_ORDER: ShapeName[] = ['escudo', 'libro', 'birrete', 'constelacion']

export const SHAPE_CAPTIONS: Record<ShapeName, { num: string; name: string }> = {
  escudo: { num: 'I', name: 'El escudo' },
  libro: { num: 'II', name: 'El libro abierto' },
  birrete: { num: 'III', name: 'El birrete' },
  constelacion: { num: 'IV', name: 'La constelación' },
}

/** Emblema servido desde el mismo origen (public/). */
const EMBLEM_URL = `${import.meta.env.BASE_URL}legacy-emblem-figura.png`

/* Muestrea un campo de valores (0–255) de w×h con interpolación bilineal. */
function sampleField(
  val: Uint8Array,
  w: number,
  h: number,
  step: number,
  hi: number,
  lo: number,
  weakP: number,
  seed: number,
): Sampled {
  const r = mulberry32(seed)
  const out: Sampled = { edge: [], strong: [], weak: [] }
  const px = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : val[y * w + x])
  const at = (x: number, y: number) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0
    return (
      (px(x0, y0) * (1 - fx) + px(x0 + 1, y0) * fx) * (1 - fy) +
      (px(x0, y0 + 1) * (1 - fx) + px(x0 + 1, y0 + 1) * fx) * fy
    )
  }
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const jx = x + (r() - 0.5) * step
      const jy = y + (r() - 0.5) * step
      const v = at(jx, jy)
      if (v >= hi) {
        const e =
          at(jx - step, jy) < lo || at(jx + step, jy) < lo || at(jx, jy - step) < lo || at(jx, jy + step) < lo
        ;(e ? out.edge : out.strong).push(jx / w, jy / h)
      } else if (v >= lo && r() < weakP) {
        out.weak.push(jx / w, jy / h)
      }
    }
  }
  return out
}

function alphaOf(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const d = ctx.getImageData(0, 0, w, h).data
  const a = new Uint8Array(w * h)
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]
  return a
}

function brightOf(d: Uint8ClampedArray, w: number, h: number) {
  const a = new Uint8Array(w * h)
  for (let i = 0; i < a.length; i++) a[i] = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) * (d[i * 4 + 3] / 255)
  return a
}

function offscreen(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D no disponible')
  return ctx
}

/* Normaliza los puntos a su caja real (la figura ocupa todo el escenario). */
function pack(s: Sampled, w: number, h: number, quota: [number, number]): Shape {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0
  for (const arr of [s.edge, s.strong, s.weak]) {
    for (let i = 0; i < arr.length; i += 2) {
      if (arr[i] < x0) x0 = arr[i]
      if (arr[i] > x1) x1 = arr[i]
      if (arr[i + 1] < y0) y0 = arr[i + 1]
      if (arr[i + 1] > y1) y1 = arr[i + 1]
    }
  }
  const bw = Math.max(1e-3, x1 - x0)
  const bh = Math.max(1e-3, y1 - y0)
  const norm = (arr: number[]) => {
    const o = new Float32Array(arr.length)
    for (let k = 0; k < arr.length; k += 2) {
      o[k] = (arr[k] - x0) / bw
      o[k + 1] = (arr[k + 1] - y0) / bh
    }
    return o
  }
  return { edge: norm(s.edge), strong: norm(s.strong), weak: norm(s.weak), aspect: (bw * w) / (bh * h), quota }
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    const na = a + Math.PI / 2
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    ctx.quadraticCurveTo(x, y, x + Math.cos(na) * r, y + Math.sin(na) * r)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/* 1. Emblema: silueta por brillo de la imagen. */
function emblem(): Promise<Shape> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      try {
        const S = 240
        const ctx = offscreen(S, S)
        ctx.drawImage(img, 0, 0, S, S)
        const v = brightOf(ctx.getImageData(0, 0, S, S).data, S, S)
        resolve(pack(sampleField(v, S, S, 1.12, 112, 66, 0.35, 11), S, S, [0.66, 0.28]))
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => reject(new Error('No se pudo cargar el emblema'))
    img.src = EMBLEM_URL
  })
}

/* 2. Libro abierto. */
function book(): Shape {
  const W = 600, H = 460
  const ctx = offscreen(W, H)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const page = (s: number) => {
    const cx = 300
    ctx.beginPath()
    ctx.moveTo(cx, 150)
    ctx.bezierCurveTo(cx - s * 70, 112, cx - s * 170, 108, cx - s * 262, 132)
    ctx.lineTo(cx - s * 262, 372)
    ctx.bezierCurveTo(cx - s * 170, 350, cx - s * 70, 356, cx, 392)
    ctx.closePath()
  }
  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  page(1); ctx.fill(); page(-1); ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 7
  page(1); ctx.stroke(); page(-1); ctx.stroke()
  ctx.lineWidth = 4
  for (let k = 1; k <= 2; k++) {
    for (const s of [1, -1]) {
      ctx.beginPath()
      ctx.moveTo(300 - s * (262 - k * 4), 372 + k * 13)
      ctx.bezierCurveTo(300 - s * 170, 350 + k * 14, 300 - s * 70, 356 + k * 14, 300, 392 + k * 12)
      ctx.stroke()
    }
  }
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.moveTo(300, 150); ctx.lineTo(300, 418); ctx.stroke()
  ctx.lineWidth = 3.4
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  for (let i = 0; i < 6; i++) {
    const y = 168 + i * 30
    for (const s of [1, -1]) {
      const len = i === 5 ? 120 : 190 - (i % 2) * 34
      ctx.beginPath()
      ctx.moveTo(300 - s * 36, y + 8)
      ctx.quadraticCurveTo(300 - s * (36 + len * 0.5), y - 10, 300 - s * (36 + len), y - 2)
      ctx.stroke()
    }
  }
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(318, 395); ctx.lineTo(326, 448); ctx.lineTo(336, 436); ctx.lineTo(344, 450); ctx.lineTo(336, 392)
  ctx.stroke()
  sparkle(ctx, 300, 62, 26)
  sparkle(ctx, 214, 84, 12)
  sparkle(ctx, 392, 80, 14)
  return pack(sampleField(alphaOf(ctx, W, H), W, H, 2.1, 150, 40, 0.4, 31), W, H, [0.6, 0.3])
}

/* 3. Birrete de grado. */
function cap(): Shape {
  const W = 600, H = 470
  const ctx = offscreen(W, H)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const board = () => {
    ctx.beginPath()
    ctx.moveTo(300, 60); ctx.lineTo(570, 170); ctx.lineTo(300, 280); ctx.lineTo(30, 170)
    ctx.closePath()
  }
  const skull = () => {
    ctx.beginPath()
    ctx.moveTo(150, 232); ctx.lineTo(150, 340)
    ctx.bezierCurveTo(200, 392, 400, 392, 450, 340)
    ctx.lineTo(450, 232)
  }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  skull(); ctx.closePath(); ctx.fill()
  board(); ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 7
  skull(); ctx.stroke()
  board(); ctx.stroke()
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(30, 170); ctx.lineTo(30, 184); ctx.lineTo(300, 294); ctx.lineTo(570, 184); ctx.lineTo(570, 170)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(300, 170, 11, 0, Math.PI * 2); ctx.fill()
  ctx.lineWidth = 4.5
  ctx.beginPath(); ctx.moveTo(300, 170); ctx.quadraticCurveTo(420, 172, 492, 200); ctx.lineTo(492, 330); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(480, 330); ctx.lineTo(504, 330); ctx.lineTo(512, 418); ctx.quadraticCurveTo(492, 430, 472, 418)
  ctx.closePath(); ctx.fill()
  return pack(sampleField(alphaOf(ctx, W, H), W, H, 2.1, 150, 40, 0.4, 41), W, H, [0.6, 0.3])
}

/* 4. Constelación con estrella central. */
function constellation(): Shape {
  const W = 560, H = 520
  const ctx = offscreen(W, H)
  ctx.lineCap = 'round'
  const nodes = [[92, 140], [190, 70], [318, 98], [452, 66], [500, 210], [430, 372], [282, 452], [130, 380], [62, 262]]
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 2.6
  ctx.beginPath()
  nodes.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(318, 98); ctx.lineTo(280, 250); ctx.lineTo(430, 372); ctx.stroke()
  nodes.forEach(([x, y], i) => {
    const r = i % 3 === 0 ? 10 : 7
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill()
  })
  sparkle(ctx, 280, 250, 96)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.beginPath(); ctx.arc(280, 250, 46, 0, Math.PI * 2); ctx.fill()
  return pack(sampleField(alphaOf(ctx, W, H), W, H, 2.1, 150, 40, 0.4, 51), W, H, [0.58, 0.3])
}

const BUILDERS: Record<ShapeName, () => Shape | Promise<Shape>> = {
  escudo: emblem,
  libro: book,
  birrete: cap,
  constelacion: constellation,
}

const cache = new Map<ShapeName, Promise<Shape>>()

export function getShape(name: ShapeName): Promise<Shape> {
  let p = cache.get(name)
  if (!p) {
    p = Promise.resolve().then(BUILDERS[name])
    cache.set(name, p)
  }
  return p
}

/**
 * Convierte una figura en K objetivos de pantalla dentro de una caja.
 * Prioriza bordes (silueta nítida) y completa con relleno.
 */
export function shapeTargets(shape: Shape, box: Box, want: number, seed: number, edgeBias = 1): Targets {
  const r = mulberry32(seed)
  const a = shape.aspect
  const w = Math.min(box.w, box.h * a)
  const h = w / a
  const ox = box.x + (box.w - w) / 2
  const oy = box.y + (box.h - h) / 2
  const pools = [shape.edge, shape.strong, shape.weak]
  const total = (pools[0].length + pools[1].length + pools[2].length) / 2
  const K = Math.min(want, total | 0)
  const qt: [number, number] = [shape.quota[0], shape.quota[1]]
  if (edgeBias !== 1) {
    qt[0] = Math.min(0.8, qt[0] * edgeBias)
    qt[1] = Math.min(qt[1], 1 - qt[0])
  }
  const quota = [Math.round(K * qt[0]), Math.round(K * qt[1]), K]
  const out = new Float32Array(K * 3)
  let n = 0
  for (let p = 0; p < 3 && n < K; p++) {
    const pool = pools[p]
    const cnt = pool.length / 2
    const take = p === 2 ? K - n : Math.min(cnt, quota[p])
    const idx = new Uint32Array(cnt)
    for (let i = 0; i < cnt; i++) idx[i] = i
    for (let i = 0; i < take && i < cnt; i++) {
      const j = i + ((r() * (cnt - i)) | 0)
      const t = idx[i]
      idx[i] = idx[j]
      idx[j] = t
      const q = idx[i] * 2
      out[n * 3] = ox + pool[q] * w
      out[n * 3 + 1] = oy + pool[q + 1] * h
      out[n * 3 + 2] = 2 - p
      n++
      if (n >= K) break
    }
  }
  return { pts: out.subarray(0, n * 3), count: n, box: { x: ox, y: oy, w, h } }
}
