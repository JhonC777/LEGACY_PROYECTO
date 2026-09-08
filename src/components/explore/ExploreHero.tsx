import { Landmark, Play, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { HERO_IMAGE } from '@/data/mockExplore'

export function ExploreHero() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden px-6 pt-8 pb-6 lg:px-8 lg:pt-10">
      <div className="explore-hero-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-legacy-gold uppercase">
            Bienvenido a LEGACY
          </p>
          <h1 className="font-display text-[clamp(2.4rem,4.5vw,3.6rem)] leading-[1.12] font-semibold text-legacy-white">
            Ideas que hoy,{' '}
            <span className="text-legacy-gold-soft italic">legado</span> para siempre.
          </h1>
          <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-legacy-muted">
            Explora proyectos académicos de demostración organizados por institución, área y
            año. Contenido claramente identificado como DEMO.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/proyectos" className="btn btn-primary btn-md">
              Explorar proyectos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href="#mision" className="btn btn-secondary btn-md">
              <Play className="h-4 w-4 fill-current" aria-hidden />
              Conocer más
            </a>
          </div>

          <p className="mt-7 flex items-start gap-2 text-sm text-legacy-muted">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-legacy-gold" aria-hidden />
            Preservamos conocimiento. Reconocemos talento. Proyectamos futuro.
          </p>
        </div>

        <div className="explore-hero-stage relative perspective-[1200px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-6 h-48 w-48 rounded-full bg-legacy-violet/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 left-4 h-40 w-40 rounded-full bg-legacy-gold/15 blur-3xl"
          />

          {/* Marco vivo — no “foto pegada” */}
          <motion.div
            className="explore-hero-frame relative overflow-hidden rounded-[1.35rem] border border-white/12"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 28, rotateX: 8, filter: 'blur(10px)' }
            }
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            }
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="explore-hero-frame-shine" aria-hidden />
            <motion.img
              src={HERO_IMAGE}
              alt="Edificio institucional de demostración"
              className="aspect-[4/3] w-full object-cover"
              animate={
                reduceMotion
                  ? undefined
                  : { scale: [1.04, 1.1, 1.04], x: [0, -6, 0], y: [0, 4, 0] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
              }
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090c]/55 via-transparent to-white/5"
            />
          </motion.div>

          {/* Cita flotante estilo iOS glass */}
          <motion.div
            className="explore-quote-float absolute right-3 bottom-3 z-10 max-w-[240px] sm:right-[-14px] sm:bottom-6 sm:max-w-[270px]"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 36, scale: 0.92, filter: 'blur(12px)' }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: [0, -10, 0],
                    scale: 1,
                    filter: 'blur(0px)',
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    opacity: { duration: 0.7, delay: 0.35 },
                    filter: { duration: 0.7, delay: 0.35 },
                    scale: {
                      type: 'spring',
                      stiffness: 160,
                      damping: 16,
                      delay: 0.35,
                    },
                    y: {
                      duration: 5.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1.1,
                    },
                  }
            }
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -14,
                    rotate: -1.5,
                    scale: 1.03,
                    transition: { type: 'spring', stiffness: 280, damping: 18 },
                  }
            }
          >
            <GlassSurface
              variant="strong"
              className="explore-quote-card relative overflow-hidden rounded-[1.35rem] p-4"
            >
              <span aria-hidden className="explore-quote-specular" />
              <span aria-hidden className="explore-quote-glow" />

              <span className="relative mb-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-legacy-gold/25 bg-legacy-gold/10 text-legacy-gold">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M7.17 6A5.17 5.17 0 0 1 12.34 11.17V13H6V6.83A.83.83 0 0 1 6.83 6h.34Zm8 0A5.17 5.17 0 0 1 20.34 11.17V13H14V6.83A.83.83 0 0 1 14.83 6h.34Z"
                  />
                </svg>
              </span>
              <p className="relative font-display text-[0.95rem] leading-snug text-legacy-white italic">
                “La educación no cambia el mundo: cambia a las personas que van a cambiar el
                mundo.”
              </p>
              <p className="relative mt-2.5 text-xs font-medium tracking-wide text-legacy-gold">
                — Paulo Freire
              </p>
            </GlassSurface>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
