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
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
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
  action: string
  target: string
}[] = [
  {
    key: 'projects',
    icon: FolderKanban,
    label: 'Proyectos publicados',
    action: 'Abrir catálogo',
    target: '',
  },
  {
    key: 'areas',
    icon: Layers3,
    label: 'Áreas de conocimiento',
    action: 'Explorar áreas',
    target: '#areas-de-conocimiento',
  },
  {
    key: 'years',
    icon: CalendarDays,
    label: 'Años documentados',
    action: 'Recorrer años',
    target: '#anos-de-legado',
  },
  {
    key: 'collections',
    icon: BookOpen,
    label: 'Colecciones temáticas',
    action: 'Ver colecciones',
    target: '#colecciones',
  },
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
  const statDetails = {
    projects: 'Fichas académicas listas para consultar',
    areas: topAreas.length > 0 ? topAreas.join(' · ') : 'Campos de estudio del archivo',
    years: yearRange,
    collections: 'Series que conectan proyectos relacionados',
  }

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
              <motion.div
                className="shrink-0"
                whileHover={reduceMotion ? undefined : { scale: 1.04, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <InstitutionLogo
                  name={institution.name}
                  logoUrl={institution.logoUrl}
                  fallback={institution.shortName}
                  accent={institution.accent}
                  decorative
                  className="institution-mark institution-mark-logo h-[5.5rem] w-[5.5rem] rounded-2xl text-xl font-bold text-white lg:h-28 lg:w-28 lg:text-2xl"
                  imageClassName="rounded-xl bg-white/95 p-2"
                />
              </motion.div>
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

        <div className="institution-archive-overview relative mt-10 lg:mt-12">
          {!reduceMotion ? (
            <>
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -top-12 -left-20 h-64 w-64 rounded-full bg-legacy-violet/20 blur-3xl"
                animate={{
                  x: [0, 110, 30, 0],
                  y: [0, 20, -18, 0],
                  scale: [1, 1.18, 0.95, 1],
                  opacity: [0.28, 0.48, 0.32, 0.28],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -right-16 -bottom-14 h-56 w-72 rounded-full bg-legacy-gold/10 blur-3xl"
                animate={{
                  x: [0, -90, -25, 0],
                  y: [0, -24, 12, 0],
                  scale: [1, 0.92, 1.15, 1],
                  opacity: [0.22, 0.42, 0.28, 0.22],
                }}
                transition={{
                  duration: 21,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1.2,
                }}
              />
              <motion.span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-legacy-gold/30 to-transparent blur-[1px]"
                animate={{ opacity: [0.15, 0.65, 0.15], scaleX: [0.75, 1, 0.75] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          ) : null}

          <motion.div
            {...reveal(0.48, 14)}
            className="relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-legacy-gold uppercase">
                Panorama del archivo
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-legacy-white sm:text-3xl">
                El legado, en contexto
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-white/50 sm:text-right">
              Accesos directos para recorrer el contenido académico de esta institución.
            </p>
          </motion.div>

          <div className="relative z-10 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
            {STATS.map(({ key, icon: Icon, label, action, target }, index) => (
              <motion.div
                key={key}
                className="h-full"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 28, filter: 'blur(12px)' }
                }
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.75,
                        delay: 0.54 + index * 0.09,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
              >
                <Link
                  to={target || projectsHref}
                  className={cn(
                    'institution-stat group flex h-full min-h-[12rem] flex-col rounded-2xl p-4 text-inherit no-underline hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-legacy-gold lg:p-5',
                    key === 'projects' && 'border-legacy-gold/25',
                  )}
                  aria-label={`${action}: ${label}`}
                >
                  {key === 'projects' ? (
                    <span
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_5%,rgb(214_184_120/0.16),transparent_44%)]"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className="pointer-events-none absolute -top-14 -right-14 h-32 w-32 rounded-full border border-legacy-gold/10 shadow-[0_0_0_20px_rgb(214_184_120/0.025),0_0_0_40px_rgb(118_98_201/0.018)] transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:scale-110"
                    aria-hidden
                  />
                  <span className="relative flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-legacy-gold/25 bg-legacy-gold/[0.08] text-legacy-gold shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105 group-hover:border-legacy-gold/45 group-hover:bg-legacy-gold/[0.14]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-[0.58rem] font-bold tracking-[0.16em] text-white/25">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </span>
                  <span className="relative mt-5 font-display text-4xl leading-none font-semibold text-legacy-white lg:text-5xl">
                    {stats[key]}
                  </span>
                  <span className="relative mt-2 text-xs font-semibold tracking-wide text-white/85">
                    {label}
                  </span>
                  <span className="relative mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/45">
                    {statDetails[key]}
                  </span>
                  <span className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-[0.67rem] font-semibold text-legacy-gold/75 transition-all duration-300 group-hover:gap-2.5 group-hover:text-legacy-gold-soft">
                    {action}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
