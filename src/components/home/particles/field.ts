/*
  LEGACY · Campo de partículas del hero (Canvas 2D, sin dependencias).
  - Deriva: rizo (curl) de ruido simplex en una rejilla interpolada.
  - Tres capas de profundidad con paralaje sutil al cursor.
  - Figuras: muelles con amortiguamiento crítico, llegada escalonada por orden y distancia,
    velocidad continua entre deriva → formación → reposo → disolución.
  - Un solo pase de dibujo por lotes + brillo (bloom) en un lienzo pequeño. Sin shadowBlur ni filtros.
  - Sin asignaciones por cuadro: arreglos tipados reutilizados.
*/

/* ---------- Ruido simplex 3D (Gustavson, dominio público) ---------- */
const F3 = 1 / 3
const G3 = 1 / 6
const GRAD3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
])
const PERM = new Uint8Array(512)
const PM12 = new Uint8Array(512)
;(function seedNoise(seed: number) {
  const p = new Uint8Array(256)
  let s = seed
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    const t = p[i]
    p[i] = p[j]
    p[j] = t
  }
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255]
    PM12[i] = PERM[i] % 12
  }
})(20261002)

function noise3(x: number, y: number, z: number): number {
  let n0 = 0
  let n1 = 0
  let n2 = 0
  let n3 = 0
  const s = (x + y + z) * F3
  const i = Math.floor(x + s)
  const j = Math.floor(y + s)
  const k = Math.floor(z + s)
  const t = (i + j + k) * G3
  const x0 = x - (i - t)
  const y0 = y - (j - t)
  const z0 = z - (k - t)
  let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1 }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1 }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1 }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1 }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
  }
  const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3
  const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3
  const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3
  const ii = i & 255, jj = j & 255, kk = k & 255
  let g: number
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
  if (t0 > 0) { g = PM12[ii + PERM[jj + PERM[kk]]] * 3; t0 *= t0; n0 = t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0) }
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
  if (t1 > 0) { g = PM12[ii + i1 + PERM[jj + j1 + PERM[kk + k1]]] * 3; t1 *= t1; n1 = t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1) }
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
  if (t2 > 0) { g = PM12[ii + i2 + PERM[jj + j2 + PERM[kk + k2]]] * 3; t2 *= t2; n2 = t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2) }
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
  if (t3 > 0) { g = PM12[ii + 1 + PERM[jj + 1 + PERM[kk + 1]]] * 3; t3 *= t3; n3 = t3 * t3 * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3) }
  return 32 * (n0 + n1 + n2 + n3)
}

/** PRNG determinista. */
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))
const smoother = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10))

/* Paleta Legacy: oro, oro suave, plata, platino, blanco (destello). 65 % oro · 35 % plata. */
const COLORS = [
  [214, 184, 120],
  [240, 217, 160],
  [200, 202, 211],
  [230, 232, 238],
  [255, 255, 255],
] as const
const CUM = [0.4, 0.65, 0.82, 0.96, 1.0]
const ALPHAS = [0.08, 0.17, 0.28, 0.41, 0.56, 0.74, 0.95]
const WIDTHS = [0.85, 1.25, 1.85] // capas de profundidad: lejos · medio · cerca
const NA = ALPHAS.length
const NC = COLORS.length
const NS = WIDTHS.length
const NB = NS * NC * NA
const STYLES: string[] = []
for (let s = 0; s < NS; s++)
  for (let c = 0; c < NC; c++)
    for (let a = 0; a < NA; a++) {
      const col = COLORS[c]
      const al = ALPHAS[a] * (c >= 2 ? 0.92 : 1)
      STYLES.push(`rgba(${col[0]},${col[1]},${col[2]},${al.toFixed(3)})`)
    }

/* Brillo: 2 tonos × 4 intensidades, acumulado en un lienzo pequeño. */
const BL_A = [0.035, 0.06, 0.09, 0.125]
const BL_N = BL_A.length
const BL_STYLES: string[] = []
for (const c of [[226, 196, 134], [214, 218, 228]]) for (const a of BL_A) BL_STYLES.push(`rgba(${c[0]},${c[1]},${c[2]},${a})`)

const DEF = { gather: 2.6, hold: 2.8, dissolve: 2.1, maxDelay: 1.0 }
const KS = 30 // rigidez del muelle (ω ≈ 5.5 rad/s), amortiguamiento crítico

export type Box = { x: number; y: number; w: number; h: number }
export type Targets = { pts: Float32Array; count: number; box: Box }
export type ShapeMode = 'center' | 'ltr' | 'btt'
export type FormOptions = {
  mode?: ShapeMode
  gather?: number
  hold?: number
  dissolve?: number
  maxDelay?: number
  everywhere?: boolean
}
export type ShapePhase = 'gather' | 'hold' | 'dissolve'
type ShapeState = {
  phase: ShapePhase
  t: number
  K: number
  idx: number[]
  cx: number
  cy: number
  box: Box
  TG: number
  TH: number
  TD: number
  MD: number
}
type Ellipse = { cx: number; cy: number; rx: number; ry: number }
type Halo = Ellipse & { t0: number; dur: number }

export class ParticleField {
  readonly canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private bloom: HTMLCanvasElement | null
  private bctx: CanvasRenderingContext2D | null = null
  private scratch: HTMLCanvasElement | null = null
  private sctx: CanvasRenderingContext2D | null = null
  private bloomDirty = false
  private BS = 6
  private rand: () => number
  coarse: boolean
  W = 1
  H = 1
  dpr = 1
  private cap = 0
  n = 0
  maxN = 0
  time = 0
  /** Opacidad global (secuencia de entrada). */
  fade = 1
  private ptr = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false, strength: 0, lastMove: -1e9, seen: false }
  /** Paralaje (−1…1) suavizado; lo lee también el fondo. */
  readonly par = { x: 0, y: 0 }
  private auto = { strength: 0, x: 0, y: 0 }
  private autopilot: boolean
  private halo: Halo | null = null
  /** Zona del texto: las partículas se atenúan detrás de él. */
  quiet: Ellipse | null = null
  shape: ShapeState | null = null
  private shapeEnv = 0
  private sweepPos = -9
  private counts = new Uint16Array(NB + 1)
  private offs = new Uint16Array(NB)
  private bcount = new Uint16Array(2 * BL_N + 1)
  private boffs = new Uint16Array(2 * BL_N)

  // Datos por partícula (estructura de arreglos)
  private x = new Float32Array(0)
  private y = new Float32Array(0)
  private vx = new Float32Array(0)
  private vy = new Float32Array(0)
  private base = new Float32Array(0)
  private phase = new Float32Array(0)
  private tw = new Float32Array(0)
  private glow = new Float32Array(0)
  private age = new Float32Array(0)
  private life = new Float32Array(0)
  private tx = new Float32Array(0)
  private ty = new Float32Array(0)
  private delay = new Float32Array(0)
  private sweep = new Float32Array(0)
  private z = new Float32Array(0)
  private pk = new Float32Array(0)
  private wt = new Float32Array(0)
  private col = new Uint8Array(0)
  private role = new Uint8Array(0)
  private cls = new Uint8Array(0)
  private sz = new Uint8Array(0)
  private bucket = new Uint8Array(0)
  private bb = new Uint8Array(0)
  private order = new Uint16Array(0)
  private border = new Uint16Array(0)

  // Campo de flujo
  private cell = 34
  private gw = 1
  private gh = 1
  private GX = new Float32Array(1)
  private GY = new Float32Array(1)
  private gRow = 0

  constructor(
    canvas: HTMLCanvasElement,
    opts: { coarse?: boolean; seed?: number; bloom?: HTMLCanvasElement | null; autopilot?: boolean } = {},
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('Canvas 2D no disponible')
    this.ctx = ctx
    this.bloom = opts.bloom ?? null
    if (this.bloom) {
      this.bctx = this.bloom.getContext('2d')
      this.scratch = document.createElement('canvas')
      this.sctx = this.scratch.getContext('2d')
      if (!this.bctx || !this.sctx) this.bloom = null
    }
    this.rand = mulberry32(opts.seed ?? 7)
    this.coarse = Boolean(opts.coarse)
    this.autopilot = opts.autopilot !== false
  }

  private targetCount() {
    const area = this.W * this.H
    let n = this.coarse
      ? Math.max(600, Math.min(1800, Math.round(area / 205)))
      : Math.max(1800, Math.min(6400, Math.round(area / 215)))
    const hc = navigator.hardwareConcurrency || 8
    if (hc <= 4) n = Math.round(n * 0.7)
    return n
  }

  private alloc(cap: number) {
    const keep = Math.min(cap, this.cap)
    const f32 = (old: Float32Array) => {
      const a = new Float32Array(cap)
      if (this.cap) a.set(old.subarray(0, keep))
      return a
    }
    const u8 = (old: Uint8Array) => {
      const a = new Uint8Array(cap)
      if (this.cap) a.set(old.subarray(0, keep))
      return a
    }
    this.x = f32(this.x); this.y = f32(this.y); this.vx = f32(this.vx); this.vy = f32(this.vy)
    this.base = f32(this.base); this.phase = f32(this.phase); this.tw = f32(this.tw); this.glow = f32(this.glow)
    this.age = f32(this.age); this.life = f32(this.life); this.tx = f32(this.tx); this.ty = f32(this.ty)
    this.delay = f32(this.delay); this.sweep = f32(this.sweep); this.z = f32(this.z); this.pk = f32(this.pk); this.wt = f32(this.wt)
    this.col = u8(this.col); this.role = u8(this.role); this.cls = u8(this.cls); this.sz = u8(this.sz)
    this.bucket = u8(this.bucket); this.bb = u8(this.bb)
    this.order = new Uint16Array(cap)
    this.border = new Uint16Array(cap)
    const first = !this.cap
    for (let i = this.cap; i < cap; i++) this.spawn(i, first)
    this.cap = cap
  }

  private spawn(i: number, first: boolean) {
    const r = this.rand
    this.x[i] = r() * this.W
    this.y[i] = r() * this.H
    this.vx[i] = 0
    this.vy[i] = 0
    const c = r()
    let k = 0
    while (c > CUM[k]) k++
    this.col[i] = k
    const z = 0.25 + 0.75 * r()
    this.z[i] = z
    this.sz[i] = z < 0.5 ? 0 : z < 0.84 ? 1 : 2
    this.base[i] = (0.3 + 0.7 * Math.pow(r(), 1.6)) * (0.5 + 0.5 * z)
    this.phase[i] = r() * Math.PI * 2
    this.tw[i] = 0.5 + r() * 1.5
    this.glow[i] = 0
    this.life[i] = 8 + r() * 10
    this.age[i] = first ? r() * this.life[i] : 0
    this.role[i] = 0
    this.wt[i] = 0
  }

  /* Campo de flujo: rizo de ruido en una rejilla (bilineal), refrescada por franjas. */
  private flowGrid() {
    const cell = this.coarse ? 26 : 34
    this.cell = cell
    this.gw = Math.ceil(this.W / cell) + 2
    this.gh = Math.ceil(this.H / cell) + 2
    this.GX = new Float32Array(this.gw * this.gh)
    this.GY = new Float32Array(this.gw * this.gh)
    this.gRow = 0
    this.flowRows(this.gh)
  }

  private flowRows(rows: number) {
    const { gw, gh, cell, GX, GY } = this
    const FS = this.coarse ? 0.0024 : 0.0016
    const TZ = this.time * 0.045
    const SPEED = (this.coarse ? 16 : 20) * 0.55
    const E = 0.02
    const invE = SPEED / E
    for (let k = 0; k < rows; k++) {
      const gy = this.gRow
      this.gRow = (this.gRow + 1) % gh
      const ny = gy * cell * FS
      for (let gx = 0; gx < gw; gx++) {
        const nx = gx * cell * FS
        const n0 = noise3(nx, ny, TZ)
        const o = gy * gw + gx
        GX[o] = (noise3(nx, ny + E, TZ) - n0) * invE
        GY[o] = -(noise3(nx + E, ny, TZ) - n0) * invE
      }
    }
  }

  resize(w: number, h: number, dpr: number) {
    const oldW = this.W
    const oldH = this.H
    this.W = Math.max(1, w)
    this.H = Math.max(1, h)
    this.dpr = dpr
    this.canvas.width = Math.round(this.W * dpr)
    this.canvas.height = Math.round(this.H * dpr)
    if (this.bloom && this.scratch) {
      this.BS = this.coarse ? 4 : 6
      const bw = Math.ceil(this.W / (this.BS * 2))
      const bh = Math.ceil(this.H / (this.BS * 2))
      this.bloom.width = bw
      this.bloom.height = bh
      this.scratch.width = bw * 2
      this.scratch.height = bh * 2
    }
    if (this.cap) {
      const sx = this.W / oldW
      const sy = this.H / oldH
      for (let i = 0; i < this.cap; i++) {
        this.x[i] *= sx; this.y[i] *= sy; this.tx[i] *= sx; this.ty[i] *= sy
      }
    }
    const target = this.targetCount()
    if (target > this.cap) this.alloc(target)
    this.n = target
    this.maxN = target
    this.flowGrid()
  }

  setPointer(x: number, y: number) {
    const p = this.ptr
    if (!p.seen) { p.x = x; p.y = y; p.seen = true }
    p.tx = x; p.ty = y; p.active = true; p.lastMove = this.time
  }

  releasePointer() {
    this.ptr.active = false
  }

  /** Halo breve alrededor de la palabra recién escrita. */
  gather(rect: Box) {
    this.halo = {
      cx: rect.x + rect.w / 2,
      cy: rect.y + rect.h / 2,
      rx: rect.w / 2 + Math.min(80, rect.h * 0.5),
      ry: rect.h / 2 + Math.min(50, rect.h * 0.3),
      t0: this.time,
      dur: 2.1,
    }
  }

  shapePhase(): ShapePhase | 'drift' {
    return this.shape ? this.shape.phase : 'drift'
  }

  /** targets = { pts:[x,y,clase…], count, box } */
  formShape(targets: Targets, opts: FormOptions = {}): boolean {
    if (this.shape || !targets.count) return false
    const mode = opts.mode ?? 'center'
    const TG = opts.gather ?? DEF.gather
    const TH = opts.hold ?? DEF.hold
    const TD = opts.dissolve ?? DEF.dissolve
    const MD = opts.maxDelay ?? DEF.maxDelay
    const n = this.n
    const r = this.rand
    let K = Math.min(targets.count, n)
    const box = targets.box
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    // selección: ~75 % el polvo más cercano al escenario, ~25 % al azar; nunca detrás del texto.
    const X = this.x
    const Y = this.y
    const q = this.quiet
    const cand: number[] = []
    const lim = opts.everywhere ? 0 : this.coarse ? 0.55 : 1.15
    for (let i = 0; i < n; i++) {
      if (q && lim) {
        const qx = (X[i] - q.cx) / q.rx
        const qy = (Y[i] - q.cy) / q.ry
        if (qx * qx + qy * qy < lim) continue
      }
      cand.push(i)
    }
    K = Math.min(K, cand.length)
    const dist = this.wt // búfer reutilizado (wt se reinicia luego)
    for (const c0 of cand) {
      const ddx = X[c0] - cx
      const ddy = Y[c0] - cy
      dist[c0] = ddx * ddx + ddy * ddy + r() * 9000
    }
    cand.sort((a, b) => dist[a] - dist[b])
    const near = Math.round(K * (opts.everywhere ? 0.4 : 0.75))
    const chosen = cand.slice(0, near)
    const rest = cand.slice(near)
    for (let i = 0; i < K - near && i < rest.length; i++) {
      const j = i + ((r() * (rest.length - i)) | 0)
      const t = rest[i]
      rest[i] = rest[j]
      rest[j] = t
      chosen.push(rest[i])
    }
    K = chosen.length
    // emparejamiento por ángulo alrededor del centro: cada partícula llega desde su lado
    const P = targets.pts
    const ang = new Float32Array(n)
    for (const c1 of chosen) ang[c1] = Math.atan2(Y[c1] - cy, X[c1] - cx)
    chosen.sort((a, b) => ang[a] - ang[b])
    const TC = targets.count
    const all: number[] = new Array(TC)
    for (let i = 0; i < TC; i++) all[i] = i
    for (let i = 0; i < K && K < TC; i++) {
      const j = i + ((r() * (TC - i)) | 0)
      const t = all[i]
      all[i] = all[j]
      all[j] = t
    }
    const tid = all.slice(0, K)
    const tang = new Float32Array(TC)
    for (const id of tid) tang[id] = Math.atan2(P[id * 3 + 1] - cy, P[id * 3] - cx)
    tid.sort((a, b) => tang[a] - tang[b])
    const maxR = Math.sqrt(box.w * box.w + box.h * box.h) / 2
    const diag = Math.sqrt(this.W * this.W + this.H * this.H)
    for (let i = 0; i < K; i++) {
      const p = chosen[i]
      const qq = tid[i] * 3
      const tx = P[qq]
      const ty = P[qq + 1]
      this.role[p] = 1
      this.tx[p] = tx
      this.ty[p] = ty
      this.cls[p] = P[qq + 2]
      this.wt[p] = 0
      const u = (tx - box.x) / box.w
      const v = (ty - box.y) / box.h
      const d =
        mode === 'ltr' ? u : mode === 'btt' ? 1 - v : Math.sqrt((tx - cx) * (tx - cx) + (ty - cy) * (ty - cy)) / maxR
      // llegada escalonada: manda el orden de la figura; las que vienen de lejos salen antes
      const far = Math.min(1, Math.sqrt((X[p] - tx) * (X[p] - tx) + (Y[p] - ty) * (Y[p] - ty)) / (diag * 0.6))
      this.delay[p] = Math.max(0, Math.min(MD, MD * (0.72 * d + 0.28 * (1 - far)) + (r() - 0.5) * 0.12))
      this.sweep[p] = u * 0.8 + v * 0.35 // coordenada del destello metálico
      this.age[p] = Math.min(this.age[p], this.life[p] - 3)
    }
    for (let i = 0; i < n; i++) if (!this.role[i]) this.wt[i] = 0
    this.shape = { phase: 'gather', t: 0, K, idx: chosen, cx, cy, box, TG, TH, TD, MD }
    return true
  }

  cancelShape() {
    const S = this.shape
    if (!S) return
    for (let k = 0; k < S.K; k++) {
      this.role[S.idx[k]] = 0
      this.wt[S.idx[k]] = 0
    }
    this.shape = null
  }

  /** Suelta la figura antes de tiempo (p. ej. al hacer scroll o cambiar de página). */
  dissolveNow() {
    const S = this.shape
    if (!S || S.phase === 'dissolve') return
    S.phase = 'dissolve'
    S.t = 0
    for (let k = 0; k < S.K; k++) {
      const pi = S.idx[k]
      this.life[pi] = this.age[pi] + 1.2 + this.rand() * 2.0
    }
  }

  /** Movimiento reducido: la figura queda compuesta, sin animación. */
  placeStatic(targets: Targets) {
    const n = this.n
    const K = Math.min(targets.count, Math.round(n * 0.6))
    const P = targets.pts
    for (let i = 0; i < n; i++) {
      this.glow[i] = 0; this.role[i] = 0; this.wt[i] = 0; this.vx[i] = 0; this.vy[i] = 0
    }
    for (let i = 0; i < K; i++) {
      const p = (i * 7919) % n
      this.x[p] = P[i * 3]
      this.y[p] = P[i * 3 + 1]
      this.cls[p] = P[i * 3 + 2]
      this.glow[p] = 0.85
      this.base[p] = Math.max(this.base[p], 0.6)
      this.wt[p] = 1
    }
  }

  step(dtIn: number) {
    const dt = dtIn > 0.05 ? 0.05 : dtIn
    this.time += dt
    const t = this.time
    const { W, H, n } = this
    const X = this.x, Y = this.y, VX = this.vx, VY = this.vy, GL = this.glow, Z = this.z, WT = this.wt
    const ROLE = this.role, TX = this.tx, TY = this.ty, DL = this.delay, PH = this.phase
    const mobile = this.coarse
    const rnd = this.rand

    this.flowRows(Math.ceil(this.gh / 4))
    const GXa = this.GX, GYa = this.GY, gw = this.gw, gh = this.gh, invCell = 1 / this.cell

    /* --- fase de la figura --- */
    let S = this.shape
    let sw = 0
    let sweepPos = -9
    let dissolveStart = false
    if (S) {
      S.t += dt
      if (S.phase === 'gather' && S.t >= S.TG) { S.phase = 'hold'; S.t -= S.TG }
      else if (S.phase === 'hold' && S.t >= S.TH) { S.phase = 'dissolve'; S.t -= S.TH; dissolveStart = true }
      else if (S.phase === 'dissolve' && S.t >= S.TD) {
        for (let k = 0; k < S.K; k++) { ROLE[S.idx[k]] = 0; WT[S.idx[k]] = 0 }
        this.shape = S = null
      }
      if (S) {
        sw = S.phase === 'gather' ? smooth(S.t / S.TG) : S.phase === 'hold' ? 1 : 1 - smooth(S.t / S.TD)
        if (S.phase === 'hold') sweepPos = -0.3 + 1.8 * (S.t / S.TH)
      }
    }
    this.shapeEnv = sw
    if (dissolveStart && S) {
      // al liberarse, el polvo se evapora mientras se dispersa y renace en otro lugar
      for (let k = 0; k < S.K; k++) {
        const pi = S.idx[k]
        this.life[pi] = this.age[pi] + 1.2 + rnd() * 2.0
      }
    }

    /* --- puntero suavizado + paralaje --- */
    const p = this.ptr
    const follow = 1 - Math.exp(-dt * 9)
    const px0 = p.x
    const py0 = p.y
    p.x += (p.tx - p.x) * follow
    p.y += (p.ty - p.y) * follow
    p.vx = (p.x - px0) / Math.max(dt, 1e-3)
    p.vy = (p.y - py0) / Math.max(dt, 1e-3)
    const idle = t - p.lastMove > 3.2 || !p.seen
    const wantP = p.active && !idle ? 1 : 0
    p.strength += (wantP - p.strength) * (1 - Math.exp(-dt * 3))
    const pf0 = 1 - Math.exp(-dt * 1.8)
    const ptx = wantP ? (p.x / W - 0.5) * 2 : 0
    const pty = wantP ? (p.y / H - 0.5) * 2 : 0
    this.par.x += (ptx - this.par.x) * pf0
    this.par.y += (pty - this.par.y) * pf0

    /* --- cursor fantasma: solo durante la deriva, muy sutil --- */
    const A = this.auto
    const wantA = this.autopilot && wantP === 0 && !S ? 1 : 0
    A.strength += (wantA - A.strength) * (1 - Math.exp(-dt * (wantA ? 0.5 : 2.5)))
    A.x = W * (0.5 + 0.34 * Math.sin(t * 0.13 + 1.1))
    A.y = H * (0.52 + 0.3 * Math.sin(t * 0.21 + 0.3))

    const R = mobile ? 150 : 240, R2 = R * R, ring = R * 0.48
    const SW = mobile ? 230 : 300, RAD = mobile ? 560 : 720
    const AR = mobile ? 150 : 230, AR2 = AR * AR, aring = AR * 0.45

    let h = this.halo
    let he = 0
    if (h) {
      const ht = (t - h.t0) / h.dur
      if (ht >= 1) this.halo = h = null
      else he = Math.max(0, Math.sin(Math.PI * Math.min(1, ht * 1.15)) * (1 - ht * 0.35))
    }

    const resp = 1 - Math.exp(-dt * 3.0)
    const glowDecay = Math.exp(-dt * 2.4)
    const AGE = this.age, LIFE = this.life
    const phase = S ? S.phase : null
    const st = S ? S.t : 0
    const ramp = S ? 1 / (S.TG - S.MD) : 0
    const scx = S ? S.cx : 0
    const scy = S ? S.cy : 0
    const push = phase === 'dissolve' && st < 1.0 ? Math.sin(Math.PI * st) : 0 // empuje en campana

    for (let i = 0; i < n; i++) {
      let x = X[i], y = Y[i], ax = 0, ay = 0, g = GL[i] * glowDecay, vx = VX[i], vy = VY[i]
      const z = Z[i]
      const role = ROLE[i]

      // flujo (bilineal sobre la rejilla)
      const fxg = x * invCell + 1, fyg = y * invCell + 1
      let ix = fxg | 0, iy = fyg | 0
      if (ix < 0) ix = 0; else if (ix > gw - 2) ix = gw - 2
      if (iy < 0) iy = 0; else if (iy > gh - 2) iy = gh - 2
      let ux0 = fxg - ix, uy0 = fyg - iy
      if (ux0 < 0) ux0 = 0; else if (ux0 > 1) ux0 = 1
      if (uy0 < 0) uy0 = 0; else if (uy0 > 1) uy0 = 1
      const o0 = iy * gw + ix, o1 = o0 + gw
      const a00 = (1 - ux0) * (1 - uy0), a10 = ux0 * (1 - uy0), a01 = (1 - ux0) * uy0, a11 = ux0 * uy0
      const ds = 0.5 + 0.5 * z // las capas lejanas fluyen más lento
      const fx = (GXa[o0] * a00 + GXa[o0 + 1] * a10 + GXa[o1] * a01 + GXa[o1 + 1] * a11) * ds
      const fy = (GYa[o0] * a00 + GYa[o0 + 1] * a10 + GYa[o1] * a01 + GYa[o1 + 1] * a11) * ds - 2.2 * ds

      if (p.strength > 0.01) {
        const ddx = x - p.x, ddy = y - p.y, d2 = ddx * ddx + ddy * ddy
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.001
          let f = 1 - d / R
          f *= f * p.strength
          const ux = ddx / d, uy = ddy / d
          if (role) {
            // la figura se abre alrededor del cursor y se recompone al irse
            let pf = 1 - d / (R * 0.8)
            pf = pf > 0 ? pf * pf * p.strength * 2300 : 0
            ax += ux * pf - uy * SW * f * 1.4
            ay += uy * pf + ux * SW * f * 1.4
          } else {
            const dz = 0.6 + 0.4 * z
            ax += (-uy * SW + (ux * RAD * (ring - d)) / R) * f * dz
            ay += (ux * SW + (uy * RAD * (ring - d)) / R) * f * dz
          }
          ax += p.vx * 0.9 * f
          ay += p.vy * 0.9 * f
          if (f > g) g = f
        }
      }

      if (role) {
        /* ---- partícula de la figura: muelle con amortiguamiento crítico hacia su objetivo ---- */
        let w: number
        if (phase === 'gather') w = smoother((st - DL[i]) * ramp)
        else if (phase === 'hold') w = 1
        else w = 1 - smoother((st - DL[i] * 0.5) / 1.3)
        WT[i] = w
        const ex = TX[i] + Math.sin(t * 0.9 + PH[i]) * 0.35 - x
        const ey = TY[i] + Math.cos(t * 0.8 + PH[i] * 1.7) * 0.35 - y
        const kk = KS * w, cc = 2 * Math.sqrt(kk)
        ax += kk * ex - cc * vx
        ay += kk * ey - cc * vy
        const swl = w * (1 - w) * 1.5 // leve espiral durante el vuelo
        ax += -ey * swl
        ay += ex * swl
        let boost = 1
        if (phase === 'dissolve') {
          AGE[i] += dt
          boost = 1 + 2.6 * (1 - w)
          if (push > 0) {
            const ox = x - scx, oy = y - scy, od = Math.sqrt(ox * ox + oy * oy) + 1
            const F = push * (70 + 60 * (0.5 + 0.5 * Math.sin(PH[i] * 7.3)))
            ax += (ox / od) * F
            ay += (oy / od) * F - 22 * push
          }
        }
        const fr = resp * (1 - w)
        vx += (fx * boost - vx) * fr + ax * dt
        vy += (fy * boost - vy) * fr + ay * dt
        const s2 = vx * vx + vy * vy
        if (s2 > 490000) { const sc = 700 / Math.sqrt(s2); vx *= sc; vy *= sc } // vuelo sereno
        x += vx * dt
        y += vy * dt
        GL[i] = g; VX[i] = vx; VY[i] = vy; X[i] = x; Y[i] = y
        continue
      }

      if (A.strength > 0.01) {
        const adx = x - A.x, ady = y - A.y, ad2 = adx * adx + ady * ady
        if (ad2 < AR2) {
          const ad = Math.sqrt(ad2) + 0.001
          let af = 1 - ad / AR
          af *= af * A.strength * 0.4
          const aux = adx / ad, auy = ady / ad
          ax += (-auy * SW * 0.8 + (aux * RAD * 0.8 * (aring - ad)) / AR) * af
          ay += (aux * SW * 0.8 + (auy * RAD * 0.8 * (aring - ad)) / AR) * af
          if (af * 0.7 > g) g = af * 0.7
        }
      }
      if (h && he > 0) {
        const hx = (x - h.cx) / h.rx, hy = (y - h.cy) / h.ry, hr = Math.sqrt(hx * hx + hy * hy) + 1e-4
        const hex = h.cx + (hx / hr) * h.rx - x, hey = h.cy + (hy / hr) * h.ry - y
        const ed = Math.sqrt(hex * hex + hey * hey)
        const prox = 1 - ed / 170
        if (prox > 0) {
          const hf = he * prox * prox
          ax += hex * 4.2 * hf - (hy / hr) * 70 * hf
          ay += hey * 4.2 * hf + (hx / hr) * 70 * hf
          if (hf * 1.1 > g) g = hf * 1.1
        }
      }

      vx += (fx - vx) * resp + ax * dt
      vy += (fy - vy) * resp + ay * dt
      const sp2 = vx * vx + vy * vy
      if (sp2 > 360000) { const sc2 = 600 / Math.sqrt(sp2); vx *= sc2; vy *= sc2 }
      x += vx * dt
      y += vy * dt
      if (x < -12) x += W + 24; else if (x > W + 12) x -= W + 24
      if (y < -12) y += H + 24; else if (y > H + 12) y -= H + 24
      VX[i] = vx; VY[i] = vy; X[i] = x; Y[i] = y; GL[i] = g
      if ((AGE[i] += dt) > LIFE[i]) {
        AGE[i] = 0
        LIFE[i] = 8 + rnd() * 10
        X[i] = rnd() * W
        Y[i] = rnd() * H
        VX[i] = fx
        VY[i] = fy
        GL[i] = 0
      }
    }
    this.sweepPos = sweepPos
  }

  render(staticMode: boolean) {
    const ctx = this.ctx, dpr = this.dpr, n = this.n, t = this.time, H = this.H
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.W, this.H)
    ctx.lineCap = 'butt'

    const B = this.bucket, BBk = this.bb, O = this.order, counts = this.counts, bcount = this.bcount
    counts.fill(0)
    bcount.fill(0)
    const base = this.base, ph = this.phase, tw = this.tw, GL = this.glow, col = this.col, SZ = this.sz, Z = this.z
    const PK = this.pk, WT = this.wt, AGE = this.age, LIFE = this.life, X = this.x, Y = this.y
    const ROLE = this.role, SWP = this.sweep, CLS = this.cls
    const q = this.quiet
    const qcx = q ? q.cx : 0, qcy = q ? q.cy : 0, qrx = q ? 1 / q.rx : 0, qry = q ? 1 / q.ry : 0
    const S = this.shape, env = this.shapeEnv, sp = this.sweepPos, dim = 1 - 0.38 * env, fade = this.fade
    const dissolving = Boolean(S && S.phase === 'dissolve')
    const useBloom = Boolean(this.bloom)
    let nb = 0
    const FB = 1 / 110 // desvanecido inferior (transición a la sección siguiente)
    for (let i = 0; i < n; i++) {
      const tws = staticMode ? 0.85 : 0.64 + 0.36 * Math.sin(t * tw[i] + ph[i])
      let a: number
      let szc = SZ[i]
      let pk = Z[i] - 0.55
      let bl = -1
      if ((ROLE[i] && S) || (staticMode && WT[i] > 0)) {
        const w = staticMode ? 1 : WT[i]
        let free = base[i] * tws
        if (dissolving) free *= Math.max(0, Math.min(1, (LIFE[i] - AGE[i]) * 0.8))
        const cl = CLS[i]
        const shimmer = 0.74 + 0.18 * Math.sin(t * 2.6 + ph[i] * 3) + (cl === 2 ? 0.2 : cl === 0 ? -0.22 : 0)
        const dx = SWP[i] - sp
        const glint = sp > -9 ? Math.exp(-dx * dx * 120) * 0.5 : 0
        a = free + (Math.max(free, shimmer) - free) * w + glint * w + GL[i] * 0.5
        if (!dissolving) a *= 0.7 + 0.3 * w // en vuelo más tenue: la figura «se enciende» al llegar
        if (w > 0.85 && !dissolving) szc = cl === 2 ? 2 : this.coarse ? 2 : 1 // contorno nítido
        if (q && w < 1) {
          const fqx = (X[i] - qcx) * qrx, fqy = (Y[i] - qcy) * qry, fqd = fqx * fqx + fqy * fqy
          if (fqd < 1) a *= 1 - (1 - w * w) * (0.8 - 0.8 * fqd)
        }
        pk = pk * (1 - w) + 0.05 * w // la figura vive en un solo plano
        if (useBloom && w > 0.25) bl = (col[i] >= 2 ? BL_N : 0) + Math.min(BL_N - 1, (w * (0.6 + glint) * BL_N) | 0)
      } else {
        const e = staticMode ? 1 : Math.min(1, AGE[i] * 0.8, (LIFE[i] - AGE[i]) * 0.8)
        let qa = 1
        if (q) {
          const qx = (X[i] - qcx) * qrx, qy = (Y[i] - qcy) * qry, qd = qx * qx + qy * qy
          if (qd < 1) qa = 0.26 + 0.74 * qd
        }
        a = base[i] * tws * e * qa * dim + GL[i] * 0.7 * e
      }
      const by = H - Y[i]
      if (by < 110) a *= by > 0 ? by * FB : 0
      a *= fade
      PK[i] = pk
      let ai = (a * NA) | 0
      if (ai >= NA) ai = NA - 1
      if (ai < 0) ai = 0
      const b = (szc * NC + col[i]) * NA + ai
      B[i] = b
      counts[b + 1]++
      if (bl >= 0 && a > 0.05) { BBk[i] = bl; bcount[bl + 1]++; nb++ } else BBk[i] = 255
    }
    for (let i = 1; i <= NB; i++) counts[i] += counts[i - 1]
    const offs = this.offs
    offs.set(counts.subarray(0, NB))
    for (let i = 0; i < n; i++) O[offs[B[i]]++] = i

    const PX = this.coarse ? 0 : this.par.x * 22
    const PY = this.coarse ? 0 : this.par.y * 14
    const VX = this.vx, VY = this.vy
    const lw = this.coarse ? 0.85 : 1, maxL = this.coarse ? 6 : 8, kL = this.coarse ? 0.02 : 0.024
    const DOT2 = Math.pow((1.1 - 0.2) / kL, 2) // por debajo de ~1 px de estela se dibuja un punto
    // Un solo pase por lote: lentas como puntos (rect), rápidas como trazo corto (estela).
    for (let bk = 0; bk < NB; bk++) {
      const s = counts[bk], en = counts[bk + 1]
      if (s === en) continue
      const lwk = WIDTHS[(bk / (NC * NA)) | 0] * lw, hs = lwk * 0.5
      let streaks = 0
      ctx.fillStyle = STYLES[bk]
      for (let k = s; k < en; k++) {
        const j = O[k], vx = VX[j], vy = VY[j]
        if (!staticMode && vx * vx + vy * vy > DOT2) { streaks++; continue }
        const o = PK[j]
        ctx.fillRect(X[j] + PX * o - hs, Y[j] + PY * o - hs, lwk, lwk)
      }
      if (!streaks) continue
      if (this.coarse) {
        // móvil: la estela son 3 puntos alineados con la velocidad (rasterizado barato)
        for (let k = s; k < en; k++) {
          const j = O[k], vx = VX[j], vy = VY[j]
          let spd = vx * vx + vy * vy
          if (spd <= DOT2) continue
          const o = PK[j], x = X[j] + PX * o - hs, y = Y[j] + PY * o - hs
          spd = Math.sqrt(spd)
          const Lm = (Math.min(maxL, 0.2 + spd * kL) / spd) * 0.5, sx = vx * Lm, sy = vy * Lm
          ctx.fillRect(x, y, lwk, lwk)
          ctx.fillRect(x - sx, y - sy, lwk, lwk)
          ctx.fillRect(x - sx * 2, y - sy * 2, lwk, lwk)
        }
        continue
      }
      ctx.lineWidth = lwk
      ctx.strokeStyle = STYLES[bk]
      ctx.beginPath()
      for (let k = s; k < en; k++) {
        const j = O[k], vx = VX[j], vy = VY[j]
        let spd = vx * vx + vy * vy
        if (spd <= DOT2) continue
        const o = PK[j], x = X[j] + PX * o, y = Y[j] + PY * o
        spd = Math.sqrt(spd)
        const inv = Math.min(maxL, 0.2 + spd * kL) / spd // estela proporcional a la velocidad
        ctx.moveTo(x - vx * inv, y - vy * inv)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    if (useBloom) this.renderBloom(nb, PX, PY)
  }

  /* Brillo sin shadowBlur ni filtros: se acumula ('lighter') a 1/BS, se reduce a la mitad
     (promedio bilineal = desenfoque barato) y el navegador escala el resultado. */
  private renderBloom(nb: number, PX: number, PY: number) {
    const bloom = this.bloom, bc = this.bctx, sc = this.sctx, scratch = this.scratch
    if (!bloom || !bc || !sc || !scratch) return
    const bw = bloom.width, bh = bloom.height
    if (!nb) {
      if (this.bloomDirty) {
        bc.setTransform(1, 0, 0, 1, 0, 0)
        bc.clearRect(0, 0, bw, bh)
        this.bloomDirty = false
      }
      return
    }
    this.bloomDirty = true
    const NBB = 2 * BL_N, counts = this.bcount, offs = this.boffs, O = this.border, BBk = this.bb, n = this.n
    for (let i = 1; i <= NBB; i++) counts[i] += counts[i - 1]
    offs.set(counts.subarray(0, NBB))
    for (let i = 0; i < n; i++) if (BBk[i] !== 255) O[offs[BBk[i]]++] = i
    const inv = 1 / this.BS, r = this.BS * 0.6
    sc.setTransform(1, 0, 0, 1, 0, 0)
    sc.globalCompositeOperation = 'source-over'
    sc.clearRect(0, 0, scratch.width, scratch.height)
    sc.setTransform(inv, 0, 0, inv, 0, 0)
    sc.globalCompositeOperation = 'lighter'
    const X = this.x, Y = this.y, PK = this.pk
    for (let bk = 0; bk < NBB; bk++) {
      const s = counts[bk], en = counts[bk + 1]
      if (s === en) continue
      sc.fillStyle = BL_STYLES[bk]
      sc.beginPath()
      for (let k = s; k < en; k++) {
        const j = O[k]
        sc.rect(X[j] + PX * PK[j] - r, Y[j] + PY * PK[j] - r, r * 2, r * 2)
      }
      sc.fill()
    }
    sc.globalCompositeOperation = 'source-over'
    bc.setTransform(1, 0, 0, 1, 0, 0)
    bc.clearRect(0, 0, bw, bh)
    bc.imageSmoothingEnabled = true
    bc.drawImage(scratch, 0, 0, bw, bh)
    // desenfoque extra casi gratis: dos copias desplazadas medio píxel
    bc.globalAlpha = 0.5
    bc.drawImage(bloom, 0.6, 0.6)
    bc.drawImage(bloom, -0.6, -0.6)
    bc.globalAlpha = 1
  }
}
