import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FolderKanban,
  Layers3,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { GlassBadge } from '@/components/ui/GlassBadge'
import { SmartImage } from '@/components/ui/SmartImage'
import type { DemoInstitution } from '@/data/demoData'
import { cn } from '@/lib/cn'

export type HeroPreviewItem = {
  id: string
  title: string
  coverImage: string
  href: string
}

type InstitutionHeroProps = {
  institution: DemoInstitution
  projectsHref: string
  stats: {
    projects: number
    areas: number
    years: number
    collections: number
  }
  /** Portadas reales del catálogo demo para el mosaico */
  preview: HeroPreviewItem[]
  yearRange: string
  topAreas: string[]
}

const STATS: {
  key: keyof InstitutionHeroProps['stats']
  icon: LucideIcon
  label: string
}[] = [
  { key: 'projects', icon: FolderKanban, label: 'Proyectos demo' },
  { key: 'areas', icon: Layers3, label: 'Áreas' },
  { key: 'years', icon: CalendarDays, label: 'Años ≥ 2024' },
  { key: 'collections', icon: BookOpen, label: 'Colecciones' },
]

export function InstitutionHero({
  institution,
  projectsHref,
  stats,
  preview,
  yearRange,
  topAreas,
}: InstitutionHeroProps) {
  const reduceMotion = useReducedMotion()
  const [lead, ...rest] = preview
  const secondary = rest.slice(0, 2)

  const reveal = (delay: number, y = 22) =>
    reduceMotion
      ? { initial: { opacity: 1, filter: 'blur(0px)' }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y, filter: 'blur(14px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: {
            duration: 0.85,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }

  return (
    <section className="institution-hero px-6 pt-10 pb-12 text-white lg:px-8 lg:pt-14 lg:pb-16">
      <div aria-hidden className="institution-hero-grid" />
      <div aria-hidden className="institution-hero-grain" />
      <div aria-hidden className="institution-blur-streak institution-blur-streak-a" />
      <div aria-hidden className="institution-blur-streak institution-blur-streak-b" />
      <div aria-hidden className="institution-blur-streak institution-blur-streak-c" />

      {!reduceMotion ? (
        <>
          <motion.span
            aria-hidden
            className="institution-orb institution-orb-a"
            animate={{ y: [0, -20, 10, 0], opacity: [0.55, 0.85, 0.6, 0.55] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            aria-hidden
            className="institution-orb institution-orb-b"
            animate={{ y: [0, 16, -12, 0], opacity: [0.4, 0.7, 0.45, 0.4] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            }}
          />
        </>
      ) : (
        <>
          <span aria-hidden className="institution-orb institution-orb-a" />
          <span aria-hidden className="institution-orb institution-orb-b" />
        </>
      )}

      <div className="relative mx-auto max-w-[1200px]">
        <motion.nav
          {...reveal(0.02, 8)}
          aria-label="Ruta"
          className="mb-7 flex items-center gap-1.5 text-xs text-white/45"
        >
          <Link to="/" className="transition-colors hover:text-legacy-gold">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="text-white/70">{institution.name}</span>
        </motion.nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          <div>
            <motion.div {...reveal(0.05, 12)}>
              <GlassBadge className="border-white/20 bg-white/10 text-white">
                {institution.isDemo
                  ? 'Contenido institucional demo'
                  : 'Espacio institucional'}
              </GlassBadge>
            </motion.div>

            <motion.p
              {...reveal(0.14, 14)}
              className="mt-7 text-xs font-semibold tracking-[0.22em] text-[#d6b878] uppercase"
            >
              Espacio institucional
            </motion.p>

            <motion.div
              {...reveal(0.22, 28)}
              className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center"
            >
              <motion.span
                className="institution-mark h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl text-xl font-bold text-white lg:h-20 lg:w-20 lg:text-2xl"
                style={{ backgroundColor: institution.accent }}
                whileHover={reduceMotion ? undefined : { scale: 1.04, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                {institution.shortName}
              </motion.span>
              <h1 className="font-display text-[clamp(2.6rem,6vw,4.25rem)] leading-[0.94] font-semibold tracking-tight">
                {institution.name}
              </h1>
            </motion.div>

            <motion.p
              {...reveal(0.34, 16)}
              className="mt-6 max-w-2xl text-base leading-relaxed text-white/70"
            >
              {institution.description}
            </motion.p>

            <motion.ul
              {...reveal(0.4, 14)}
              className="mt-6 flex flex-wrap gap-2"
              aria-label="Resumen del archivo"
            >
              <li className="institution-meta-pill">
                <Sparkles className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
                Archivo activo
              </li>
              <li className="institution-meta-pill">
                <CalendarDays className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
                {yearRange}
              </li>
              {topAreas.map((area) => (
                <li key={area} className="institution-meta-pill">
                  {area}
                </li>
              ))}
            </motion.ul>

            <motion.div {...reveal(0.48, 14)} className="mt-8 flex flex-wrap gap-3">
              <Link to={projectsHref} className="btn btn-primary btn-md">
                Explorar proyectos
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/" className="btn btn-secondary btn-md">
                Cambiar institución
              </Link>
            </motion.div>
          </div>

          {lead ? (
            <motion.div
              {...reveal(0.32, 30)}
              className="institution-mosaic grid grid-cols-2 gap-3"
            >
              <Link
                to={lead.href}
                className="institution-mosaic-tile group relative col-span-2 block aspect-[16/9] overflow-hidden rounded-2xl"
              >
                <SmartImage
                  src={lead.coverImage}
                  alt={`Portada demostrativa de ${lead.title}`}
                  className="transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-legacy-black/85 via-legacy-black/15 to-transparent"
                />
                <span className="absolute inset-x-4 bottom-4">
                  <span className="block text-[10px] font-semibold tracking-[0.16em] text-legacy-gold uppercase">
                    Del archivo
                  </span>
                  <span className="mt-1 line-clamp-2 block font-display text-lg leading-snug font-semibold text-legacy-white">
                    {lead.title}
                  </span>
                </span>
              </Link>

              {secondary.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="institution-mosaic-tile group relative block aspect-[4/3] overflow-hidden rounded-2xl"
                >
                  <SmartImage
                    src={item.coverImage}
                    alt={`Portada demostrativa de ${item.title}`}
                    className="transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-legacy-black/80 to-transparent"
                  />
                  <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-xs leading-snug font-medium text-legacy-white/90">
                    {item.title}
                  </span>
                </Link>
              ))}
            </motion.div>
          ) : null}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-3.5 lg:mt-12 lg:grid-cols-4">
          {STATS.map(({ key, icon: Icon, label }, index) => (
            <motion.div
              key={key}
              className={cn('institution-stat rounded-2xl p-4 lg:p-5')}
              initial={
                reduceMotion ? false : { opacity: 0, y: 28, filter: 'blur(12px)' }
              }
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.75,
                      delay: 0.5 + index * 0.09,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              whileHover={reduceMotion ? undefined : { y: -4 }}
            >
              <Icon className="relative h-5 w-5 text-[#d6b878]" aria-hidden />
              <p className="relative mt-4 font-display text-3xl font-semibold lg:text-4xl">
                {stats[key]}
              </p>
              <p className="relative mt-1 text-xs tracking-wide text-white/55">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
