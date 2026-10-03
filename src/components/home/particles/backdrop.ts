/*
  LEGACY · Fondo del hero: oro + negro + plata, prerenderizado.
  - Atmósfera: lienzo pequeño (1/3) con auroras y barrido de luz. Los degradados se crean
    una vez y se mueven con transformaciones. Se redibuja a 30 Hz.
  - Textura: estática a resolución completa (metal cepillado, velo, viñeta, grano).
  Un solo compuesto normal, sin mix-blend-mode ni filtros.
*/

type Aurora = {
  cx: number
  cy: number
  rx: number
  ry: number
  per: number
  ax: number
  ay: number
  ph: number
  c: readonly [number, number, number]
  a: readonly [number, number, number]
  depth: number
}

const AUR: Aurora[] = [
  { cx: 0.7, cy: 0.33, rx: 0.39, ry: 0.31, per: 26, ax: 0.05, ay: 0.05, ph: 0.0, c: [214, 184, 120], a: [0.34, 0.13, 0], depth: 1.0 },
  { cx: 0.1, cy: 0.02, rx: 0.35, ry: 0.26, per: 32, ax: 0.08, ay: 0.06, ph: 1.7, c: [230, 232, 238], a: [0.2, 0.07, 0], depth: 0.6 },
  { cx: 0.08, cy: 1.02, rx: 0.32, ry: 0.22, per: 30, ax: 0.08, ay: 0.04, ph: 3.1, c: [240, 217, 160], a: [0.16, 0.05, 0], depth: 0.8 },
  { cx: 0.98, cy: 1.0, rx: 0.28, ry: 0.2, per: 36, ax: 0.07, ay: 0.04, ph: 4.4, c: [230, 232, 238], a: [0.15, 0.05, 0], depth: 0.5 },
]
/* Posiciones en vertical (móvil): la luz principal sube sobre la figura. */
const AUR_MOBILE = [
  { cx: 0.55, cy: 0.18, rx: 0.6, ry: 0.35 },
  { cx: 0.0, cy: -0.05, rx: 0.42, ry: 0.3 },
  { cx: 0.05, cy: 1.0, rx: 0.4, ry: 0.25 },
  { cx: 1.0, cy: 0.95, rx: 0.35, ry: 0.22 },
]

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

export class Backdrop {
  private ctx: CanvasRenderingContext2D
  private s = 0.34
  private w = 1
  private h = 1
  private coarse = false
  private base: CanvasGradient | null = null
  private aur: CanvasGradient[] = []
  private sheen: CanvasGradient | null = null
  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas 2D no disponible')
    this.ctx = ctx
  }

  resize(W: number, H: number, coarse: boolean) {
    this.coarse = coarse
    this.s = coarse ? 0.5 : 0.34
    this.canvas.width = this.w = Math.max(2, Math.ceil(W * this.s))
    this.canvas.height = this.h = Math.max(2, Math.ceil(H * this.s))
    const c = this.ctx
    const base = c.createRadialGradient(0, 0, 0, 0, 0, 1)
    base.addColorStop(0, '#101116')
    base.addColorStop(0.45, '#0a0b0f')
    base.addColorStop(1, '#060709')
    this.base = base
    this.aur = AUR.map((A) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1)
      g.addColorStop(0, `rgba(${A.c.join(',')},${A.a[0]})`)
      g.addColorStop(0.45, `rgba(${A.c.join(',')},${A.a[1]})`)
      g.addColorStop(1, `rgba(${A.c.join(',')},0)`)
      return g
    })
    const sheen = c.createLinearGradient(-1, 0, 1, 0)
    sheen.addColorStop(0, 'rgba(255,255,255,0)')
    sheen.addColorStop(0.3, 'rgba(240,217,160,0.05)')
    sheen.addColorStop(0.5, 'rgba(247,245,239,0.085)')
    sheen.addColorStop(0.7, 'rgba(230,232,238,0.045)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    this.sheen = sheen
  }

  /** t en segundos; par = paralaje del puntero (−1…1); fadeIn 0…1 para la entrada. */
  draw(t: number, par: { x: number; y: number }, fadeIn: number) {
    const c = this.ctx, w = this.w, h = this.h, vmax = Math.max(w, h)
    if (!this.base || !this.sheen) return
    c.globalAlpha = 1
    c.setTransform(w * 1.1, 0, 0, h * 1.25, w * 0.7, h * 0.4)
    c.fillStyle = this.base
    c.fillRect(-2, -2, 4, 4)
    for (let i = 0; i < AUR.length; i++) {
      const A = AUR[i]
      const P = this.coarse ? AUR_MOBILE[i] : A
      const u = (t / A.per) * Math.PI * 2 + A.ph
      const sc = 1 + 0.06 * Math.sin(u * 0.7 + 1.3)
      const cx = (P.cx + A.ax * Math.sin(u)) * w - par.x * 10 * this.s * A.depth
      const cy = (P.cy + A.ay * Math.sin(u * 0.8 + 0.6)) * h - par.y * 7 * this.s * A.depth
      c.setTransform(P.rx * vmax * sc, 0, 0, P.ry * vmax * sc, cx, cy)
      c.fillStyle = this.aur[i]
      c.fillRect(-1, -1, 2, 2)
    }
    // barrido de luz diagonal (oro → platino), lento y con pausa
    const su = (t % 19) / 19
    if (su < 0.62) {
      const pos = -0.4 + 1.8 * smooth(su / 0.62)
      const ang = 0.24
      c.setTransform(Math.cos(ang) * w * 0.3, Math.sin(ang) * w * 0.3, -Math.sin(ang) * h * 2, Math.cos(ang) * h * 2, pos * w, h * 0.5)
      c.fillStyle = this.sheen
      c.fillRect(-1, -1, 2, 2)
    }
    if (fadeIn < 1) {
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.globalAlpha = 1 - fadeIn
      c.fillStyle = '#060709'
      c.fillRect(0, 0, w, h)
      c.globalAlpha = 1
    }
  }
}

/* Rellena todo el lienzo con un degradado radial unitario deformado en elipse. */
function ell(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, g: CanvasGradient, W: number, H: number) {
  c.save()
  c.setTransform(rx, 0, 0, ry, cx, cy)
  c.fillStyle = g
  c.fillRect(-cx / rx, -cy / ry, W / rx, H / ry)
  c.restore()
}

/** Textura estática: metal cepillado enmascarado, velo de lectura, viñeta, fundidos y grano. */
export function drawTexture(canvas: HTMLCanvasElement, W: number, H: number, coarse: boolean) {
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')
  if (!c) return
  let seed = 777
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  // 1) metal cepillado: vetas horizontales irregulares, enmascaradas donde hay luz
  const bw = Math.max(1, Math.round(W / 3))
  const tmp = document.createElement('canvas')
  tmp.width = bw
  tmp.height = H
  const tc = tmp.getContext('2d')
  if (tc) {
    const img = tc.createImageData(bw, H)
    const d = img.data
    const KN = 18
    const knots = new Float32Array(Math.ceil(bw / KN) + 2)
    for (let y = 0; y < H; y++) {
      const row = rnd()
      const row2 = rnd() < 0.08 ? 1.6 : 1
      for (let k = 0; k < knots.length; k++) knots[k] = rnd()
      for (let x = 0; x < bw; x++) {
        const kx = x / KN, k0 = kx | 0, f = kx - k0
        const v = row * 0.65 + (knots[k0] * (1 - f) + knots[k0 + 1] * f) * 0.35
        const a = v * v * 9 * row2
        const o = (y * bw + x) * 4
        d[o] = 246; d[o + 1] = 238; d[o + 2] = 220; d[o + 3] = a > 255 ? 255 : a
      }
    }
    tc.putImageData(img, 0, 0)
    tc.globalCompositeOperation = 'destination-in'
    const mk = tc.createRadialGradient(0, 0, 0, 0, 0, 1)
    mk.addColorStop(0, 'rgba(0,0,0,1)')
    mk.addColorStop(0.55, 'rgba(0,0,0,0.4)')
    mk.addColorStop(0.88, 'rgba(0,0,0,0)')
    mk.addColorStop(1, 'rgba(0,0,0,0)')
    if (coarse) ell(tc, bw * 0.5, H * 0.25, bw * 0.9, H * 0.4, mk, bw, H)
    else ell(tc, bw * 0.7, H * 0.44, bw * 0.62, H * 0.58, mk, bw, H)
    c.imageSmoothingEnabled = true
    c.drawImage(tmp, 0, 0, W, H)
  }
  // 2) velo de lectura + viñeta + fundido inferior hacia la sección siguiente
  const lin = (x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => {
    const g = c.createLinearGradient(x0, y0, x1, y1)
    for (const [o, col] of stops) g.addColorStop(o, col)
    c.fillStyle = g
    c.fillRect(0, 0, W, H)
  }
  const vg = c.createRadialGradient(0, 0, 0, 0, 0, 1)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(0.52, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.62)')
  ell(c, W * (coarse ? 0.5 : 0.55), H * 0.45, W * 1.3, H * 0.95, vg, W, H)
  if (!coarse) lin(0, 0, W, 0, [[0, 'rgba(8,9,12,0.58)'], [0.34, 'rgba(8,9,12,0.3)'], [0.58, 'rgba(8,9,12,0)']])
  lin(0, 0, 0, 150, [[0, 'rgba(8,9,12,0.5)'], [1, 'rgba(8,9,12,0)']])
  lin(0, H, 0, H - 200, [[0, 'rgba(8,9,12,1)'], [0.35, 'rgba(8,9,12,0.7)'], [1, 'rgba(8,9,12,0)']])
  // 3) grano fino (claro/oscuro), compuesto normal
  const gw = Math.ceil(W / 1.5), gh = Math.ceil(H / 1.5)
  const gc = document.createElement('canvas')
  gc.width = gw
  gc.height = gh
  const gx = gc.getContext('2d')
  if (gx) {
    const gi = gx.createImageData(gw, gh)
    const gd = gi.data
    seed = 12345
    for (let i = 0; i < gd.length; i += 4) {
      const n = rnd()
      const lum = n > 0.5 ? 255 : 0
      gd[i] = gd[i + 1] = gd[i + 2] = lum
      gd[i + 3] = Math.abs(n - 0.5) * 2 * 10
    }
    gx.putImageData(gi, 0, 0)
    c.drawImage(gc, 0, 0, W, H)
  }
}
