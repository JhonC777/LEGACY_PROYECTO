/*
  LEGACY · Figuras para el enjambre de partículas.
  Cada figura se dibuja (o se carga) en un lienzo fuera de pantalla y se muestrea en
  puntos objetivo normalizados. Clase 2 = borde (silueta), 1 = relleno fuerte, 0 = relleno tenue.
*/
import { mulberry32, type Box, type ShapeMode, type Targets } from './field'

export type ShapeName =
  | 'escudo'
  | 'libro'
  | 'birrete'
  | 'constelacion'
  | 'bombilla'
  | 'arbol'
  | 'pluma'
  | 'reloj'
  | 'brujula'
  | 'llave'

export type Shape = {
  edge: Float32Array
  strong: Float32Array
  weak: Float32Array
  aspect: number
  quota: [number, number]
}

type Sampled = { edge: number[]; strong: number[]; weak: number[] }

/** Todas las figuras disponibles. */
export const ALL_SHAPES: ShapeName[] = [
  'escudo', 'libro', 'birrete', 'constelacion', 'bombilla', 'arbol', 'pluma', 'reloj', 'brujula', 'llave',
]

/** Ciclo curado del Home (la leyenda numera I–VI en este orden). */
export const SHAPE_ORDER: ShapeName[] = ['escudo', 'libro', 'arbol', 'bombilla', 'birrete', 'constelacion']

export const SHAPE_NAMES: Record<ShapeName, string> = {
  escudo: 'El escudo',
  libro: 'El libro abierto',
  birrete: 'El birrete',
  constelacion: 'La constelación',
  bombilla: 'La idea',
  arbol: 'El árbol del legado',
  pluma: 'La pluma',
  reloj: 'El reloj de arena',
  brujula: 'La brújula',
  llave: 'La llave del archivo',
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** Número romano de la figura dentro del ciclo del Home. */
export const SHAPE_CAPTIONS = Object.fromEntries(
  ALL_SHAPES.map((n) => [n, { num: ROMAN[SHAPE_ORDER.indexOf(n)] ?? '', name: SHAPE_NAMES[n] }]),
) as Record<ShapeName, { num: string; name: string }>

export const SHAPE_TOTAL = ROMAN[SHAPE_ORDER.length - 1]

/** Cómo se compone cada figura: desde el centro, de izquierda a derecha o de abajo arriba. */
export const SHAPE_MODES: Record<ShapeName, ShapeMode> = {
  escudo: 'center',
  libro: 'btt',
  birrete: 'btt',
  constelacion: 'center',
  bombilla: 'center',
  arbol: 'btt',
  pluma: 'ltr',
  reloj: 'btt',
  brujula: 'center',
  llave: 'ltr',
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


/* Utilidades de trazo para las figuras nuevas: contorno blanco + velo de relleno tenue. */
type Ctx = CanvasRenderingContext2D
function begin(W: number, H: number) {
  const ctx = offscreen(W, H)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#fff'
  return ctx
}
function veil(ctx: Ctx, path: () => void, a = 0.26) {
  ctx.fillStyle = `rgba(255,255,255,${a})`
  path()
  ctx.fill()
}
function line(ctx: Ctx, w: number, pts: number[][], close = false) {
  ctx.lineWidth = w
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  if (close) ctx.closePath()
  ctx.stroke()
}
/* Rectángulo redondeado sin depender de ctx.roundRect (Safari antiguo). */
function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
function dot(ctx: Ctx, x: number, y: number, r: number) {
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}
const sampleLine = (ctx: Ctx, W: number, H: number, seed: number, quota: [number, number] = [0.62, 0.28]) =>
  pack(sampleField(alphaOf(ctx, W, H), W, H, 2.1, 150, 40, 0.4, seed), W, H, quota)

/* 5. Bombilla: la idea. Ampolla, filamento, rosca y rayos. */
function bulb(): Shape {
  const W = 520, H = 600
  const ctx = begin(W, H)
  const glass = () => {
    ctx.beginPath()
    ctx.moveTo(206, 404)
    ctx.bezierCurveTo(200, 352, 150, 318, 150, 248)
    ctx.arc(260, 236, 112, Math.PI * 1.03, Math.PI * 1.97)
    ctx.bezierCurveTo(370, 318, 320, 352, 314, 404)
    ctx.closePath()
  }
  veil(ctx, glass, 0.2)
  ctx.lineWidth = 8
  glass(); ctx.stroke()
  // filamento
  line(ctx, 4.5, [[226, 404], [232, 300], [244, 282], [252, 302], [260, 282], [268, 302], [276, 282], [288, 300], [294, 404]])
  dot(ctx, 260, 268, 7)
  // rosca
  for (let i = 0; i < 3; i++) line(ctx, 7, [[210 + i * 3, 424 + i * 22], [310 - i * 3, 424 + i * 22]])
  ctx.lineWidth = 7
  ctx.beginPath(); ctx.moveTo(232, 490); ctx.quadraticCurveTo(260, 512, 288, 490); ctx.stroke()
  // rayos
  const rays = [-150, -120, -90, -60, -30, 0, 180]
  for (const deg of rays) {
    const a = (deg * Math.PI) / 180
    const r0 = 150, r1 = deg === -90 ? 214 : 194
    line(ctx, 6, [[260 + Math.cos(a) * r0, 236 + Math.sin(a) * r0], [260 + Math.cos(a) * r1, 236 + Math.sin(a) * r1]])
  }
  return sampleLine(ctx, W, H, 61)
}

/* 6. Árbol con raíces: el legado. Copa ondulada, tronco, ramas, suelo y raíces. */
function tree(): Shape {
  const W = 560, H = 620
  const ctx = begin(W, H)
  const cx = 280, cy = 196, rx = 210, ry = 150
  const crown = () => {
    const N = 11
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const a = Math.PI * 0.62 + (i / N) * Math.PI * 1.76
      const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry
      if (i === 0) { ctx.moveTo(x, y); continue }
      const am = a - (Math.PI * 1.76) / N / 2
      ctx.quadraticCurveTo(cx + Math.cos(am) * rx * 1.2, cy + Math.sin(am) * ry * 1.2, x, y)
    }
    ctx.closePath()
  }
  ctx.lineWidth = 7.5
  crown(); ctx.stroke()
  // tronco
  const trunk = () => {
    ctx.beginPath()
    ctx.moveTo(262, 286); ctx.bezierCurveTo(264, 340, 258, 388, 232, 418)
    ctx.lineTo(328, 418); ctx.bezierCurveTo(302, 388, 296, 340, 298, 286)
    ctx.closePath()
  }
  veil(ctx, trunk, 0.34)
  ctx.lineWidth = 7
  trunk(); ctx.stroke()
  // ramas dentro de la copa
  ctx.lineWidth = 5
  ctx.lineWidth = 6
  for (const [x1, y1, x2, y2] of [[266, 292, 176, 208], [294, 292, 388, 200], [280, 290, 282, 128], [214, 244, 150, 214], [350, 238, 414, 214], [281, 200, 232, 150], [282, 190, 336, 146]]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2 + 6, (y1 + y2) / 2 + 12, x2, y2); ctx.stroke()
  }
  // suelo
  line(ctx, 5, [[110, 420], [450, 420]])
  // raíces
  ctx.lineWidth = 5.5
  for (const [x2, y2, c] of [[120, 520, -40], [190, 576, -10], [280, 596, 0], [370, 576, 10], [440, 520, 40]]) {
    ctx.beginPath(); ctx.moveTo(280 + (x2 - 280) * 0.12, 420); ctx.quadraticCurveTo(280 + (x2 - 280) * 0.5 + c, 470, x2, y2); ctx.stroke()
  }
  ctx.lineWidth = 3.5
  for (const [x1, y1, x2, y2] of [[176, 470, 140, 470], [384, 470, 420, 470], [230, 520, 214, 552], [330, 520, 346, 552]]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  }
  return sampleLine(ctx, W, H, 71)
}

/* 7. Pluma: el conocimiento escrito. Pluma de ave asimétrica, cañón desnudo, plumín y trazo de tinta. */
function quill(): Shape {
  const W = 600, H = 580
  const ctx = begin(W, H)
  // raquis: Bézier cuadrática del plumín a la punta
  const P0 = [118, 500], C = [250, 250], P2 = [540, 46]
  const at = (t: number) => {
    const u = 1 - t
    const x = u * u * P0[0] + 2 * u * t * C[0] + t * t * P2[0]
    const y = u * u * P0[1] + 2 * u * t * C[1] + t * t * P2[1]
    const dx = 2 * u * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0])
    const dy = 2 * u * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1])
    const l = Math.hypot(dx, dy)
    return { x, y, nx: -dy / l, ny: dx / l }
  }
  const T0 = 0.26
  const width = (t: number, max: number) => max * Math.pow(Math.sin((Math.PI * (t - T0)) / (1 - T0)), 0.62) * (t > 0.9 ? 1 - (t - 0.9) * 4 : 1)
  const notches = [0.48, 0.7]
  const edge = (side: 1 | -1, max: number) => {
    const pts: number[][] = []
    for (let i = 0; i <= 48; i++) {
      const t = T0 + ((1 - T0) * i) / 48
      const p = at(t)
      let w = width(t, max)
      if (side === 1) for (const n of notches) if (Math.abs(t - n) < 0.025) w *= 0.55 + (Math.abs(t - n) / 0.025) * 0.45
      pts.push([p.x + p.nx * w * side, p.y + p.ny * w * side])
    }
    return pts
  }
  const left = edge(1, 84)
  const right = edge(-1, 46)
  ctx.lineWidth = 7
  ctx.beginPath()
  left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1])
  ctx.closePath()
  ctx.stroke()
  // raquis completo (cañón desnudo incluido)
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(C[0], C[1], P2[0], P2[1]); ctx.stroke()
  // barbas inclinadas hacia la punta
  ctx.lineWidth = 3.6
  for (let i = 1; i <= 7; i++) {
    const t = T0 + ((1 - T0) * i) / 8.5
    const p = at(t), q = at(Math.min(1, t + 0.07))
    for (const [side, max] of [[1, 84], [-1, 46]] as const) {
      const w = width(Math.min(1, t + 0.07), max) * 0.86
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x + q.nx * w * side, q.y + q.ny * w * side); ctx.stroke()
    }
  }
  // plumín
  line(ctx, 6, [[P0[0] + 10, P0[1] - 16], [96, 534], [P0[0] + 18, P0[1] - 4]], true)
  // trazo de tinta
  ctx.lineWidth = 5
  ctx.beginPath(); ctx.moveTo(96, 556); ctx.bezierCurveTo(180, 530, 230, 572, 300, 548); ctx.bezierCurveTo(350, 530, 400, 560, 450, 548); ctx.stroke()
  return sampleLine(ctx, W, H, 81)
}

/* 8. Reloj de arena: lo que perdura. Marco, cristal y arena. */
function hourglass(): Shape {
  const W = 440, H = 600
  const ctx = begin(W, H)
  const glass = () => {
    ctx.beginPath()
    ctx.moveTo(110, 80)
    ctx.bezierCurveTo(110, 200, 200, 250, 206, 300)
    ctx.bezierCurveTo(200, 350, 110, 400, 110, 520)
    ctx.lineTo(330, 520)
    ctx.bezierCurveTo(330, 400, 240, 350, 234, 300)
    ctx.bezierCurveTo(240, 250, 330, 200, 330, 80)
    ctx.closePath()
  }
  veil(ctx, glass, 0.16)
  ctx.lineWidth = 7
  glass(); ctx.stroke()
  // tapas y columnas
  for (const y of [62, 538]) {
    ctx.lineWidth = 8
    rrect(ctx, 56, y - 12, 328, 24, 12); ctx.stroke()
  }
  line(ctx, 6, [[74, 74], [74, 526]])
  line(ctx, 6, [[366, 74], [366, 526]])
  // arena: montículo abajo, resto arriba y hilo que cae
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath(); ctx.moveTo(122, 512); ctx.quadraticCurveTo(220, 400, 318, 512); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(150, 190); ctx.quadraticCurveTo(220, 214, 290, 190); ctx.bezierCurveTo(270, 240, 236, 262, 220, 286); ctx.bezierCurveTo(204, 262, 170, 240, 150, 190); ctx.fill()
  line(ctx, 3.5, [[220, 300], [220, 440]])
  return sampleLine(ctx, W, H, 91, [0.58, 0.32])
}

/* 9. Brújula: explorar. Doble aro, marcas, rosa de cuatro puntas y norte destacado. */
function compass(): Shape {
  const W = 560, H = 560
  const ctx = begin(W, H)
  const c = 280
  ctx.lineWidth = 8
  ctx.beginPath(); ctx.arc(c, c, 236, 0, Math.PI * 2); ctx.stroke()
  ctx.lineWidth = 3.5
  ctx.beginPath(); ctx.arc(c, c, 206, 0, Math.PI * 2); ctx.stroke()
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    const r0 = i % 4 === 0 ? 176 : i % 2 === 0 ? 188 : 196
    line(ctx, i % 2 ? 3 : 5, [[c + Math.cos(a) * r0, c + Math.sin(a) * r0], [c + Math.cos(a) * 206, c + Math.sin(a) * 206]])
  }
  const point = (a: number, len: number, half: number) => {
    const ax = Math.cos(a), ay = Math.sin(a), px = -ay, py = ax
    return [[c + ax * len, c + ay * len], [c + px * half, c + py * half], [c - px * half, c - py * half]]
  }
  // rosa secundaria (diagonales)
  for (let i = 0; i < 4; i++) {
    const [t, l, r] = point(Math.PI / 4 + (i * Math.PI) / 2, 110, 22)
    line(ctx, 4, [l, t, r])
  }
  // aguja: norte relleno, el resto en contorno
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 2
    const [t, l, r] = point(a, i === 0 ? 170 : 150, 34)
    ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(l[0], l[1]); ctx.lineTo(r[0], r[1]); ctx.closePath()
    ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'
    ctx.fill()
    ctx.lineWidth = 6
    ctx.stroke()
  }
  dot(ctx, c, c, 14)
  // marca del norte sobre el aro
  ctx.beginPath(); ctx.moveTo(c, 12); ctx.lineTo(c - 20, 44); ctx.lineTo(c + 20, 44); ctx.closePath()
  ctx.fillStyle = '#fff'; ctx.fill()
  return sampleLine(ctx, W, H, 101, [0.6, 0.3])
}

/* 10. Llave antigua: el archivo. Ojo ornamental, caña y paletón. */
function key(): Shape {
  const W = 680, H = 300
  const ctx = begin(W, H)
  const by = 150
  // ojo: aro exterior con tres lóbulos e interior hueco
  const bow = () => {
    ctx.beginPath()
    ctx.arc(150, by, 96, 0, Math.PI * 2)
  }
  veil(ctx, bow, 0.18)
  ctx.lineWidth = 8
  bow(); ctx.stroke()
  ctx.lineWidth = 5
  ctx.beginPath(); ctx.arc(150, by, 52, 0, Math.PI * 2); ctx.stroke()
  for (const a of [Math.PI, Math.PI * 0.62, Math.PI * 1.38]) {
    ctx.beginPath(); ctx.arc(150 + Math.cos(a) * 74, by + Math.sin(a) * 74, 14, 0, Math.PI * 2); ctx.stroke()
  }
  // collar y caña
  line(ctx, 7, [[246, by - 22], [246, by + 22]])
  line(ctx, 7, [[270, by - 18], [270, by + 18]])
  ctx.lineWidth = 7
  rrect(ctx, 246, by - 13, 400, 26, 13); ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill()
  // paletón con dientes
  const bit = () => {
    ctx.beginPath()
    ctx.moveTo(530, by + 13); ctx.lineTo(530, by + 96); ctx.lineTo(560, by + 96); ctx.lineTo(560, by + 66)
    ctx.lineTo(586, by + 66); ctx.lineTo(586, by + 110); ctx.lineTo(620, by + 110); ctx.lineTo(620, by + 13)
    ctx.closePath()
  }
  veil(ctx, bit, 0.3)
  ctx.lineWidth = 7
  bit(); ctx.stroke()
  sparkle(ctx, 150, by, 22)
  return sampleLine(ctx, W, H, 111, [0.6, 0.3])
}

const BUILDERS: Record<ShapeName, () => Shape | Promise<Shape>> = {
  escudo: emblem,
  libro: book,
  birrete: cap,
  constelacion: constellation,
  bombilla: bulb,
  arbol: tree,
  pluma: quill,
  reloj: hourglass,
  brujula: compass,
  llave: key,
}

const cache = new Map<ShapeName, Promise<Shape>>()

/* Las figuras se construyen de una en una, cada una en su propia tarea (5–15 ms),
   para no encadenar un bloque largo en el hilo principal al cargar. */
let queue: Promise<unknown> = Promise.resolve()
// MessageChannel cede el hilo sin la limitación de setTimeout en pestañas en segundo plano
const nextTask = () =>
  new Promise<void>((resolve) => {
    const ch = new MessageChannel()
    ch.port1.onmessage = () => {
      ch.port1.close()
      resolve()
    }
    ch.port2.postMessage(0)
  })

export function getShape(name: ShapeName): Promise<Shape> {
  let p = cache.get(name)
  if (!p) {
    p = queue.then(nextTask).then(BUILDERS[name])
    queue = p.catch(() => undefined)
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
