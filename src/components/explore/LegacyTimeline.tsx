import { CalendarDays, Layers3, Library } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DEMO_PROJECTS } from '@/data/demoData'

const YEARS = [...new Set(DEMO_PROJECTS.map((project) => project.year))].sort(
  (a, b) => b - a,
)

const AREAS = [...new Set(DEMO_PROJECTS.map((project) => project.area))]

const COLLECTIONS = [
  ...new Set(
    DEMO_PROJECTS.map((project) => project.collection).filter(
      (collection): collection is string => Boolean(collection),
    ),
  ),
]

function countByYear(year: number) {
  return DEMO_PROJECTS.filter((project) => project.year === year).length
}

/** Accesos rápidos del catálogo demo: años, áreas y colecciones. */
export function LegacyTimeline() {
  return (
    <section className="explore-card mt-6 rounded-2xl p-5 lg:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-explore-purple/10 text-explore-purple">
          <CalendarDays className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-explore-ink">
            Recorre el legado
          </h2>
          <p className="text-xs text-explore-muted">
            Atajos al catálogo de demostración
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2.5 text-[11px] font-semibold tracking-[0.14em] text-explore-muted uppercase">
            Por año
          </p>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((year) => (
              <Link
                key={year}
                to={`/proyectos?year=${year}`}
                className="chip-liquid"
              >
                <span className="font-semibold">{year}</span>
                <span className="text-explore-muted">{countByYear(year)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-explore-muted uppercase">
            <Layers3 className="h-3.5 w-3.5" aria-hidden />
            Por área
          </p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <Link
                key={area}
                to={`/proyectos?area=${encodeURIComponent(area)}`}
                className="chip-liquid"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>

        {COLLECTIONS.length > 0 ? (
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-explore-muted uppercase">
              <Library className="h-3.5 w-3.5" aria-hidden />
              Colecciones
            </p>
            <div className="flex flex-wrap gap-2">
              {COLLECTIONS.map((collection) => (
                <Link
                  key={collection}
                  to={`/proyectos?collection=${encodeURIComponent(collection)}`}
                  className="chip-liquid"
                >
                  {collection}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
