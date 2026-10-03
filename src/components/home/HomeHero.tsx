import { ArrowRight } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { createHero, SLOGAN_ENDINGS } from '@/components/home/particles/heroController'
import { SHAPE_TOTAL } from '@/components/home/particles/shapes'
import { LEGACY_SLOGAN } from '@/lib/brand'

export type HomeHeroStats = {
  projects: number
  participants: number
  categories: number
  years: string | null
}

type HomeHeroProps = {
  stats: HomeHeroStats
  onExplore: () => void
  onFragments?: () => void
  onScrollCue: () => void
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/**
 * Hero del Home: «Legacy» fijo en Ballet, eslogan con final rotativo («deja legado.»,
 * «trasciende.»…), partículas oro/plata que componen figuras (escudo, libro, árbol, bombilla, birrete,
 * constelación) y cifras reales del archivo. Con movimiento reducido todo queda estático.
 */
export function HomeHero({ stats, onExplore, onFragments, onScrollCue }: HomeHeroProps) {
  const heroRef = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bloomRef = useRef<HTMLCanvasElement>(null)
  const backdropRef = useRef<HTMLCanvasElement>(null)
  const textureRef = useRef<HTMLCanvasElement>(null)
  const typeTextRef = useRef<HTMLElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const capNumRef = useRef<HTMLSpanElement>(null)
  const capNameRef = useRef<HTMLSpanElement>(null)
  const capFillRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const hero = heroRef.current
    const inner = innerRef.current
    const content = contentRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const bloom = bloomRef.current
    const backdrop = backdropRef.current
    const texture = textureRef.current
    const typeText = typeTextRef.current
    const caret = caretRef.current
    const caption = captionRef.current
    const capNum = capNumRef.current
    const capName = capNameRef.current
    const capFill = capFillRef.current
    if (
      !hero || !inner || !content || !stage || !canvas || !bloom || !backdrop || !texture ||
      !typeText || !caret || !caption || !capNum || !capName || !capFill
    )
      return
    return createHero({
      hero, inner, content, stage, canvas, bloom, backdrop, texture,
      typeText, caret, caption, capNum, capName, capFill,
      scrollRoot: hero.closest<HTMLElement>('.home-entry-stage'),
    })
  }, [])

  return (
    <section ref={heroRef} className="home-hero" aria-labelledby="home-hero-title">
      <canvas ref={backdropRef} className="home-hero-layer is-backdrop" aria-hidden />
      <canvas ref={bloomRef} className="home-hero-layer is-bloom" aria-hidden />
      <canvas ref={canvasRef} className="home-hero-layer is-particles" aria-hidden />
      <canvas ref={textureRef} className="home-hero-layer is-texture" aria-hidden />

      <div ref={innerRef} className="home-hero-inner">
        <div ref={contentRef} className="home-hero-content">
          <p className="home-hero-kicker" data-intro="1">
            <span className="home-hero-kicker-line" aria-hidden />
            Archivo académico institucional
          </p>

          {/* El lector de pantalla oye el eslogan completo; lo que se escribe es decorativo. */}
          <h1 id="home-hero-title" className="home-hero-heading" aria-label={`LEGACY. ${LEGACY_SLOGAN}`}>
            <span className="home-hero-wordmark" data-intro="2" aria-hidden>
              <span className="home-hero-wordmark-text">Legacy</span>
            </span>
            <span className="home-hero-slogan" data-intro="3" aria-hidden>
              <span className="home-slogan-fixed">Donde el conocimiento </span>
              <span className="home-slogan-end">
                {SLOGAN_ENDINGS.map((ending) => (
                  <span key={ending} className="home-slogan-ghost">
                    {ending}
                  </span>
                ))}
                <span className="home-slogan-live">
                  <em ref={typeTextRef} className="home-slogan-typed">
                    {SLOGAN_ENDINGS[0]}
                  </em>
                  <span ref={caretRef} className="home-caret" />
                </span>
              </span>
            </span>
          </h1>
          <p className="home-hero-lede" data-intro="4">
            La plataforma donde cada institución preserva, organiza y exhibe los proyectos de grado de
            sus estudiantes.
          </p>

          <div className="home-hero-cta" data-intro="5">
            <button type="button" className="home-btn is-gold" onClick={onExplore}>
              Explorar instituciones
              <ArrowRight className="home-btn-icon" aria-hidden />
            </button>
            {onFragments ? (
              <button type="button" className="home-btn is-ghost" onClick={onFragments}>
                Ver fragmentos
              </button>
            ) : null}
          </div>

          {stats.projects > 0 ? (
            <ul className="home-hero-facts" data-intro="6" aria-label="El archivo en cifras">
              <li>
                <b>{stats.projects}</b> {plural(stats.projects, 'proyecto', 'proyectos')}
              </li>
              {stats.participants > 0 ? (
                <li>
                  <b>{stats.participants}</b> {plural(stats.participants, 'participante', 'participantes')}
                </li>
              ) : null}
              {stats.categories > 0 ? (
                <li>
                  <b>{stats.categories}</b> {plural(stats.categories, 'categoría', 'categorías')}
                </li>
              ) : null}
              {stats.years ? (
                <li>
                  <b>{stats.years}</b>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div ref={stageRef} className="home-hero-stage" aria-hidden>
          <p ref={captionRef} className="home-stage-caption">
            <span className="home-cap-num">
              <span ref={capNumRef}>I</span>
              <span className="home-cap-of">&thinsp;/&thinsp;{SHAPE_TOTAL}</span>
            </span>
            <span className="home-cap-track">
              <i ref={capFillRef} />
            </span>
            <span ref={capNameRef} className="home-cap-name">
              El escudo
            </span>
          </p>
        </div>
      </div>

      <button type="button" className="home-scroll-cue" data-intro="7" onClick={onScrollCue}>
        <span>Descubre el archivo</span>
        <i aria-hidden>
          <b />
        </i>
      </button>
    </section>
  )
}
