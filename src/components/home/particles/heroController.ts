/*
  LEGACY · Orquestador del hero: partículas + figuras, fondo, final rotativo del eslogan,
  leyenda de la figura, secuencia de entrada y paralaje de scroll.
  Solo escribe estilos vía CSSOM (element.style), compatible con CSP 'self'.
*/
import { Backdrop, drawTexture } from './backdrop'
import { ParticleField, type FormOptions } from './field'
import { getShape, SHAPE_CAPTIONS, SHAPE_MODES, SHAPE_ORDER, shapeTargets, type Shape, type ShapeName } from './shapes'

export type HeroElements = {
  hero: HTMLElement
  inner: HTMLElement
  content: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  bloom: HTMLCanvasElement
  backdrop: HTMLCanvasElement
  texture: HTMLCanvasElement
  typeText: HTMLElement
  caret: HTMLElement
  caption: HTMLElement
  capNum: HTMLElement
  capName: HTMLElement
  capFill: HTMLElement
  scrollRoot: HTMLElement | null
}

/*
  «Donde el conocimiento …» queda fijo; solo el final se escribe y se borra.
  El primero es el eslogan oficial (estado inicial, sin JS y con movimiento reducido).
*/
export const SLOGAN_ENDINGS = ['deja legado.', 'trasciende.', 'inspira.', 'perdura.', 'construye futuro.'] as const
const MODES = SHAPE_MODES

/* La entrada larga se ve una vez por visita (memoria de la SPA). */
let introPlayed = false

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smooth = (v: number) => {
  const x = clamp01(v)
  return x * x * (3 - 2 * x)
}
const smoother = (v: number) => {
  const x = clamp01(v)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 4)
const hash = (a: number, b: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return h - Math.floor(h)
}

export function createHero(el: HeroElements): () => void {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const mqCoarse = window.matchMedia('(pointer: coarse)')
  let reduced = mqReduce.matches
  let coarse = mqCoarse.matches || el.hero.clientWidth < 700
  let dead = false
  const introEls = Array.from(el.hero.querySelectorAll<HTMLElement>('[data-intro]'))

  /* ---------------- Final rotativo del eslogan ---------------- */
  // Arranca con «deja legado.» ya escrito: se lee el eslogan oficial y luego rota.
  const tw = { wi: 0, len: SLOGAN_ENDINGS[0].length, phase: 'hold' as 'gap' | 'typing' | 'hold' | 'deleting' | 'static', timer: 3.2, busy: false, since: 0, cycle: 0 }
  let caretOp = -1

  // Ritmo humano: variación pseudoaleatoria estable, pausa tras espacio y antes del punto.
  const typeDelay = () => {
    const word = SLOGAN_ENDINGS[tw.wi]
    const k = tw.len + tw.cycle * 13
    let d = 0.078 + (hash(tw.wi + 1, k) - 0.5) * 0.05
    if (tw.len === 0) d += 0.05 // el primer trazo se piensa
    if (word[tw.len - 1] === ' ') d += 0.06
    if (word[tw.len] === '.') d += 0.09
    if (hash(k + 3, tw.wi * 7 + 1) > 0.88) d += 0.06 // micro-pausa ocasional
    return d
  }
  const deleteDelay = () => {
    const pr = 1 - tw.len / SLOGAN_ENDINGS[tw.wi].length
    return 0.05 - 0.022 * pr + (hash(tw.len, tw.wi + 9) - 0.5) * 0.01
  }
  // El cursor sigue al texto con transform: escribir no mueve nada del layout.
  // En diseños centrados (el final en su propia línea) el texto se centra también con transform.
  const endBox = el.typeText.closest<HTMLElement>('.home-slogan-end')
  const live = el.typeText.parentElement
  let centered = false
  const readLayout = () => {
    centered = Boolean(endBox) && getComputedStyle(endBox as HTMLElement).display === 'grid'
    if (!centered && live) live.style.transform = ''
  }
  let caretX = -1
  let liveX = -1
  const placeCaret = () => {
    const w = el.typeText.offsetWidth
    const x = w + (tw.len ? 2 : 0)
    if (x !== caretX) {
      caretX = x
      el.caret.style.transform = `translate3d(${x}px,0,0)`
    }
    if (centered && endBox && live) {
      const off = Math.round((endBox.clientWidth - w - 4) / 2)
      if (off !== liveX) {
        liveX = off
        live.style.transform = `translate3d(${off}px,0,0)`
      }
    }
  }
  const relayout = () => {
    readLayout()
    caretX = -1
    liveX = -1
    placeCaret()
  }
  const paint = () => {
    el.typeText.textContent = SLOGAN_ENDINGS[tw.wi].slice(0, tw.len)
    placeCaret()
  }

  const onWordComplete = () => {
    if (!field || reduced) return
    const range = document.createRange()
    range.selectNodeContents(el.typeText)
    const r = range.getBoundingClientRect()
    const c = el.canvas.getBoundingClientRect()
    if (r.width < 2) return
    field.gather({ x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height })
  }

  const typeUpdate = (dt: number, now: number) => {
    tw.timer -= dt
    let guard = 0
    while (tw.timer <= 0 && guard++ < 8) {
      const word = SLOGAN_ENDINGS[tw.wi]
      switch (tw.phase) {
        case 'gap':
          tw.phase = 'typing'
          tw.busy = true
          tw.timer += typeDelay()
          break
        case 'typing':
          tw.len++
          paint()
          if (tw.len >= word.length) {
            tw.phase = 'hold'
            tw.busy = false
            tw.since = now
            tw.timer += tw.wi === 0 ? 3.0 : 2.4
            onWordComplete()
          } else tw.timer += typeDelay()
          break
        case 'hold':
          tw.phase = 'deleting'
          tw.busy = true
          tw.timer += 0.1
          break
        case 'deleting':
          tw.len--
          paint()
          if (tw.len <= 0) {
            tw.wi = (tw.wi + 1) % SLOGAN_ENDINGS.length
            if (!tw.wi) tw.cycle++
            tw.phase = 'gap'
            tw.busy = false
            tw.since = now
            tw.timer += 0.42
          } else tw.timer += deleteDelay()
          break
        default:
          tw.timer = 1e9
      }
    }
    // cursor: fijo mientras escribe/borra; en reposo, parpadeo con fundido
    let op = 1
    if (!tw.busy) {
      const ph = (now - tw.since) % 1.1
      op = ph < 0.55 ? 1 : ph < 0.72 ? 1 - smooth((ph - 0.55) / 0.17) : ph < 0.93 ? 0 : smooth((ph - 0.93) / 0.17)
    }
    op = Math.round(op * 50) / 50
    if (op !== caretOp) {
      el.caret.style.opacity = String(op)
      caretOp = op
    }
  }

  const typeReset = (staticWord: boolean) => {
    tw.wi = 0
    tw.cycle = 0
    tw.phase = staticWord ? 'static' : 'hold'
    tw.timer = staticWord ? 1e9 : introPlayed ? 2.6 : 4.4
    tw.len = SLOGAN_ENDINGS[0].length
    tw.busy = false
    tw.since = 0
    paint()
    caretOp = -1
    if (staticWord) el.caret.style.opacity = ''
  }

  /* ---------------- Partículas + figuras ---------------- */
  let field: ParticleField | null = null
  let backdrop: Backdrop | null = null
  try {
    field = new ParticleField(el.canvas, { coarse, seed: 11, bloom: el.bloom })
    backdrop = new Backdrop(el.backdrop)
  } catch {
    field = null
    backdrop = null
  }
  const built: Partial<Record<ShapeName, Shape>> = {}
  const order = SHAPE_ORDER
  const sched = { next: 1, wait: 3.4, current: null as ShapeName | null }
  const intro = { t0: -1, done: false, formed: false }
  const bg = { fade: 0, frame: 0 }
  let raf = 0
  let last = 0
  let heroVisible = true
  const perf = { acc: 0, frames: 0 }

  const stageBox = () => {
    const s = el.stage.getBoundingClientRect()
    const c = el.canvas.getBoundingClientRect()
    const pad = Math.min(s.width, s.height) * (coarse ? 0.04 : 0.07)
    return { x: s.left - c.left + pad, y: s.top - c.top + pad, w: s.width - pad * 2, h: s.height - pad * 2 - (coarse ? 14 : 32) }
  }

  const startShape = (name: ShapeName, opts: FormOptions & { share?: number; max?: number } = {}) => {
    const shape = built[name]
    if (!shape || !field) return false
    const share = opts.share ?? (coarse ? 0.72 : 0.46)
    const budget = coarse ? Math.min(1200, Math.round(field.n * share)) : Math.min(opts.max ?? 2900, Math.round(field.n * share))
    const tg = shapeTargets(shape, stageBox(), budget, 17 + sched.next, coarse ? 1.15 : 1.1)
    if (!field.formShape(tg, { ...opts, mode: MODES[name] })) return false
    sched.current = name
    el.capNum.textContent = SHAPE_CAPTIONS[name].num
    el.capName.textContent = SHAPE_CAPTIONS[name].name
    return true
  }

  const capState = { op: -1, fill: -1 }
  const captionUpdate = () => {
    if (!field) return
    const S = field.shape
    let op = 0
    let fill = 0
    if (S) {
      if (S.phase === 'gather') op = smooth((S.t - (S.TG - 0.9)) / 0.8)
      else if (S.phase === 'hold') { op = 1; fill = S.t / S.TH }
      else { op = 1 - smooth(S.t / 0.6); fill = 1 }
    }
    op = Math.round(op * 100) / 100
    fill = Math.round(fill * 200) / 200
    if (op !== capState.op) {
      el.caption.style.opacity = String(op)
      el.caption.style.transform = `translate3d(-50%,${((1 - op) * 8).toFixed(2)}px,0)`
      capState.op = op
    }
    if (fill !== capState.fill) {
      el.capFill.style.transform = `scaleX(${fill})`
      capState.fill = fill
    }
  }

  const scheduleUpdate = (dt: number) => {
    if (!field) return
    if (field.shapePhase() === 'drift' && intro.done) {
      if (sched.current) {
        sched.current = null
        sched.wait = 3.2 + hash(sched.next, 3) * 1.4
      }
      sched.wait -= dt
      if (sched.wait <= 0) {
        const name = order[sched.next % order.length]
        if (startShape(name)) sched.next++
        else sched.wait = 0.5
      }
    }
    captionUpdate()
  }

  /* ---------------- Entrada ---------------- */
  const introStart = () => {
    if (intro.t0 < 0 && field) intro.t0 = field.time
  }
  const introFinish = () => {
    intro.done = true
    intro.formed = true
    introPlayed = true
    el.hero.classList.remove('is-intro')
    if (field) field.fade = 1
    bg.fade = 1
    el.texture.style.opacity = ''
    for (const node of introEls) {
      node.style.opacity = ''
      node.style.transform = ''
    }
  }
  const introUpdate = () => {
    if (intro.done || !field) return
    const it = intro.t0 < 0 ? 0 : field.time - intro.t0
    const bgIn = smoother(it / 1.4)
    field.fade = smoother((it - 0.1) / 1.6)
    el.texture.style.opacity = bgIn.toFixed(3)
    bg.fade = bgIn
    if (!intro.formed && intro.t0 >= 0 && it >= 0.2) {
      intro.formed = true
      startShape('escudo', { gather: 3.0, hold: 2.6, maxDelay: 1.15, everywhere: true, share: coarse ? 0.66 : 0.55, max: 3300 })
    }
    for (const node of introEls) {
      const k = Number(node.dataset.intro) || 1
      const u = easeOut((it - 1.45 - 0.12 * (k - 1)) / 1.1)
      node.style.opacity = u.toFixed(3)
      node.style.transform = `translate3d(0,${(18 * (1 - u)).toFixed(2)}px,0)`
    }
    if (it > 3.6) introFinish()
  }

  const updateQuiet = () => {
    if (!field) return
    const hc = el.content.getBoundingClientRect()
    const cr = el.canvas.getBoundingClientRect()
    field.quiet = { cx: hc.left - cr.left + hc.width / 2, cy: hc.top - cr.top + hc.height * 0.55, rx: hc.width * 0.62, ry: hc.height * 0.62 }
  }

  const renderStatic = () => {
    if (!field || !backdrop) return
    field.n = Math.round(field.maxN * 0.6)
    field.fade = 1
    const s = built.escudo
    if (s) field.placeStatic(shapeTargets(s, stageBox(), coarse ? 700 : 2200, 5))
    backdrop.draw(0, field.par, 1)
    field.render(true)
  }

  let sized = ''
  const sizeCanvas = (force = true) => {
    if (!field || !backdrop) return
    const w = el.hero.clientWidth
    const h = el.hero.clientHeight
    if (w < 2 || h < 2) return
    const key = `${w}x${h}`
    if (!force && key === sized) return
    sized = key
    coarse = mqCoarse.matches || w < 700
    field.coarse = coarse
    // DPR limitado: 1.5 en móvil, ≤2 en escritorio con un tope de ~3 MP de dispositivo
    let dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)
    if (w * h * dpr * dpr > 3.0e6) dpr = Math.max(1, Math.sqrt(3.0e6 / (w * h)))
    field.resize(w, h, dpr)
    backdrop.resize(w, h, coarse)
    updateQuiet()
    drawTexture(el.texture, w, h, coarse)
    backdrop.draw(field.time, field.par, reduced ? 1 : bg.fade)
    if (reduced) renderStatic()
    else field.render(false)
  }

  const tick = (dt: number) => {
    if (!field || !backdrop) return
    field.step(dt)
    field.render(false)
    if (++bg.frame & 1 || bg.fade < 1) backdrop.draw(field.time, field.par, bg.fade) // 30 Hz basta
    if (intro.t0 >= 0) typeUpdate(dt, field.time)
    introUpdate()
    scheduleUpdate(dt)
  }

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    const dt = last ? (now - last) / 1000 : 1 / 60
    last = now
    tick(dt)
    // calidad adaptativa: si el equipo no sostiene ~45 fps se reducen partículas
    perf.acc += dt
    perf.frames++
    if (perf.frames >= 90 && field) {
      const avg = perf.acc / perf.frames
      const minN = coarse ? 450 : 1200
      if (avg > 0.022 && field.n > minN && !field.shape) field.n = Math.max(minN, Math.round(field.n * 0.85))
      perf.acc = 0
      perf.frames = 0
    }
  }

  const shouldRun = () => Boolean(field) && !reduced && !document.hidden && heroVisible && !dead
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

  /* ---------------- Puntero ---------------- */
  const local = (cx: number, cy: number) => {
    const r = el.canvas.getBoundingClientRect()
    return { x: cx - r.left, y: cy - r.top }
  }
  const onPointer = (e: PointerEvent) => {
    if (!field) return
    const p = local(e.clientX, e.clientY)
    field.setPointer(p.x, p.y)
  }
  const onLeave = () => field?.releasePointer()
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') field?.releasePointer()
  }
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t || !field) return
    const p = local(t.clientX, t.clientY)
    field.setPointer(p.x, p.y)
  }

  /* ---------------- Scroll: el contenido se aleja y se funde ---------------- */
  let scrollQueued = false
  const applyScroll = () => {
    scrollQueued = false
    if (reduced || !el.scrollRoot) return
    const y = el.scrollRoot.scrollTop
    const H = el.hero.clientHeight || 1
    if (y <= 0 || y > H * 1.2) {
      el.inner.style.transform = ''
      el.inner.style.opacity = ''
      return
    }
    el.inner.style.transform = `translate3d(0,${(y * 0.22).toFixed(1)}px,0)`
    el.inner.style.opacity = (1 - smooth(clamp01(y / H) * 1.25) * 0.9).toFixed(3)
  }
  const onScroll = () => {
    if (!scrollQueued) {
      scrollQueued = true
      requestAnimationFrame(applyScroll)
    }
  }

  let resizeTimer = 0
  const onResize = () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      if (dead) return
      relayout()
      sizeCanvas(false)
    }, 120)
  }

  const applyMotionMode = () => {
    reduced = mqReduce.matches
    el.hero.classList.toggle('is-reduced', reduced)
    typeReset(reduced)
    if (reduced) {
      field?.cancelShape()
      introFinish()
      el.inner.style.transform = ''
      el.inner.style.opacity = ''
    }
    sizeCanvas()
    sync()
  }

  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            heroVisible = entries[0]?.isIntersecting ?? true
            sync()
          },
          { root: el.scrollRoot, threshold: 0 },
        )
      : null

  /* ---------------- Arranque ---------------- */
  el.hero.classList.toggle('is-reduced', reduced)
  readLayout()
  typeReset(reduced)
  if (field) {
    if (!reduced && !introPlayed) field.fade = 0
    sizeCanvas()
    el.hero.addEventListener('pointermove', onPointer, { passive: true })
    el.hero.addEventListener('pointerdown', onPointer, { passive: true })
    el.hero.addEventListener('pointerleave', onLeave)
    el.hero.addEventListener('pointerup', onUp)
    el.hero.addEventListener('touchmove', onTouchMove, { passive: true })
    el.hero.addEventListener('touchend', onLeave, { passive: true })
    io?.observe(el.hero)
  }
  const ro = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
  ro?.observe(el.hero)
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', sync)
  mqReduce.addEventListener('change', applyMotionMode)
  el.scrollRoot?.addEventListener('scroll', onScroll, { passive: true })

  const repeat = introPlayed
  if (reduced || repeat || !field) introFinish()
  else {
    el.hero.classList.add('is-intro')
    introUpdate()
  }
  if (repeat) sched.wait = 1.2

  document.fonts.ready
    .then(() => {
      if (dead) return
      relayout() // la fuente final cambia el ancho del texto
      sizeCanvas()
      return Promise.all(
        order.map((name) =>
          getShape(name).then(
            (s) => {
              built[name] = s
            },
            () => undefined, // una figura que no carga se omite
          ),
        ),
      )
    })
    .then(() => {
      if (dead) return
      if (reduced) renderStatic()
      introStart()
    })
  const introFallback = window.setTimeout(introStart, 2500) // red lenta: la entrada no espera indefinidamente
  if (repeat) introStart()
  sync()

  return () => {
    dead = true
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    window.clearTimeout(resizeTimer)
    window.clearTimeout(introFallback)
    io?.disconnect()
    ro?.disconnect()
    el.hero.removeEventListener('pointermove', onPointer)
    el.hero.removeEventListener('pointerdown', onPointer)
    el.hero.removeEventListener('pointerleave', onLeave)
    el.hero.removeEventListener('pointerup', onUp)
    el.hero.removeEventListener('touchmove', onTouchMove)
    el.hero.removeEventListener('touchend', onLeave)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', sync)
    mqReduce.removeEventListener('change', applyMotionMode)
    el.scrollRoot?.removeEventListener('scroll', onScroll)
  }
}
