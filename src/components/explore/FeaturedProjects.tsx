import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Circle,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { SmartImage } from '@/components/ui/SmartImage'
import { MOCK_FEATURED_PROJECTS } from '@/data/mockExplore'
import { DEMO_PROJECTS, getProjectHref } from '@/data/demoData'
import { cn } from '@/lib/cn'

function hrefFor(projectId: string) {
  const project =
    DEMO_PROJECTS.find((item) => item.id === projectId) ?? DEMO_PROJECTS[0]!
  return getProjectHref(project)
}

export function FeaturedProjects() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const total = MOCK_FEATURED_PROJECTS.length

  const syncPosition = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const { scrollLeft, scrollWidth, clientWidth } = track
    const maxScroll = scrollWidth - clientWidth
    const step = total > 0 ? scrollWidth / total : 1

    setActiveIndex(Math.min(total - 1, Math.max(0, Math.round(scrollLeft / step))))
    setAtStart(scrollLeft <= 8)
    setAtEnd(scrollLeft >= maxScroll - 8)
  }, [total])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    syncPosition()
    track.addEventListener('scroll', syncPosition, { passive: true })
    window.addEventListener('resize', syncPosition)
    return () => {
      track.removeEventListener('scroll', syncPosition)
      window.removeEventListener('resize', syncPosition)
    }
  }, [syncPosition])

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const step = track.scrollWidth / total
    track.scrollTo({ left: step * index, behavior: 'smooth' })
  }

  const nudge = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section id="proyectos">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-explore-ink lg:text-[1.75rem]">
          Proyectos destacados
        </h2>

        <div className="flex items-center gap-3">
          <Link
            to="/proyectos"
            className="text-sm font-semibold text-explore-purple transition-opacity hover:opacity-80"
          >
            Ver todos los proyectos →
          </Link>
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => nudge(-1)}
              disabled={atStart}
              aria-label="Proyectos anteriores"
              className="liquid-icon liquid-touch flex h-8 w-8 items-center justify-center rounded-full text-legacy-muted disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              disabled={atEnd}
              aria-label="Proyectos siguientes"
              className="liquid-icon liquid-touch flex h-8 w-8 items-center justify-center rounded-full text-legacy-muted disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="featured-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        role="group"
        aria-roledescription="carrusel"
        aria-label="Proyectos destacados de demostración"
      >
        {MOCK_FEATURED_PROJECTS.map((project, index) => (
          <article
            key={project.id}
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${total}`}
            className="explore-card group flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl sm:w-[48%] xl:w-[47%]"
          >
            <Link
              to={hrefFor(project.id)}
              className="relative block aspect-[16/10] overflow-hidden bg-legacy-surface"
            >
              <SmartImage
                src={project.imageUrl}
                alt={`Portada demostrativa de ${project.title}`}
                className="transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="absolute top-3 left-3 rounded-md bg-explore-purple px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                {project.badge}
              </span>
              <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-explore-muted shadow-sm transition-colors group-hover:text-explore-purple">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>

            <div className="flex flex-1 flex-col gap-2.5 p-4">
              <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-semibold text-explore-ink">
                <Link to={hrefFor(project.id)} className="hover:text-explore-purple">
                  {project.title}
                </Link>
              </h3>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-explore-muted">
                <span className="inline-flex items-center gap-1">
                  <Circle
                    className="h-2 w-2 fill-explore-purple text-explore-purple"
                    aria-hidden
                  />
                  {project.category}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <User className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{project.authors}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {project.year}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {MOCK_FEATURED_PROJECTS.map((project, index) => (
          <button
            key={project.id}
            type="button"
            onClick={() => scrollToIndex(index)}
            aria-label={`Ir al proyecto ${index + 1}`}
            aria-current={index === activeIndex}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === activeIndex
                ? 'w-5 bg-explore-purple'
                : 'w-2 bg-explore-purple/25 hover:bg-explore-purple/45',
            )}
          />
        ))}
      </div>
    </section>
  )
}
