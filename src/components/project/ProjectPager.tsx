import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SmartImage } from '@/components/ui/SmartImage'
import { getProjectHref, type DemoProject } from '@/data/demoData'
import { cn } from '@/lib/cn'

const EASE = [0.22, 1, 0.36, 1] as const

type ProjectPagerProps = {
  previous: DemoProject
  next: DemoProject
  position: number
  total: number
}

/** Navegación anterior / siguiente dentro del archivo de la institución. */
export function ProjectPager({ previous, next, position, total }: ProjectPagerProps) {
  return (
    <nav aria-label="Recorrer el archivo" className="mt-14">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
          Recorre el archivo
        </p>
        <p className="text-xs tabular-nums text-legacy-muted">
          {String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PagerCard project={previous} direction="prev" />
        <PagerCard project={next} direction="next" delay={0.08} />
      </div>
    </nav>
  )
}

function PagerCard({
  project,
  direction,
  delay = 0,
}: {
  project: DemoProject
  direction: 'prev' | 'next'
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  const isNext = direction === 'next'

  return (
    <motion.div
      {...(reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 22, filter: 'blur(8px)' },
            whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
            viewport: { once: true, amount: 0.25 },
            transition: { duration: 0.65, delay, ease: EASE },
          })}
    >
      <Link
        to={getProjectHref(project)}
        className={cn('pager-card group', isNext && 'pager-card-next')}
      >
        <span className="pager-card-thumb">
          <SmartImage
            src={project.coverImage}
            alt=""
            fallbackLabel=""
            className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold tracking-[0.16em] text-legacy-muted uppercase">
            {isNext ? null : <ArrowLeft className="h-3 w-3" aria-hidden />}
            {isNext ? 'Siguiente proyecto' : 'Proyecto anterior'}
            {isNext ? <ArrowRight className="h-3 w-3" aria-hidden /> : null}
          </span>
          <span className="mt-1.5 block font-display text-[1.15rem] leading-snug font-semibold text-legacy-white transition-colors group-hover:text-legacy-gold-soft">
            {project.title}
          </span>
          <span className="mt-1 block truncate text-xs text-legacy-muted">
            {project.area} · {project.year}
          </span>
        </span>
      </Link>
    </motion.div>
  )
}
