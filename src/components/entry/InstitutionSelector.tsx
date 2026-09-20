import { Compass } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Institution } from '@/data/mockInstitutions'
import { HomeIsland } from './HomeIsland'
import { InstitutionCard } from './InstitutionCard'

type InstitutionSelectorProps = {
  institutions: Institution[]
  onSelect: (institution: Institution) => void
  onExploreAll: () => void
  awakened?: boolean
  projectCounts?: Record<string, number>
}

const VISIBLE_COUNT = 3
const EASE = [0.22, 1, 0.36, 1] as const

export function InstitutionSelector({
  institutions,
  onSelect,
  onExploreAll,
  awakened = true,
  projectCounts,
}: InstitutionSelectorProps) {
  const reduceMotion = useReducedMotion()
  const visible = institutions.slice(0, VISIBLE_COUNT)
  const openCount = visible.filter((institution) => institution.isActive).length
  const soonCount = visible.length - openCount
  const empty = visible.length === 0

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col lg:mx-0 lg:max-w-none lg:flex-none">
      <motion.div
        initial={reduceMotion ? { opacity: awakened ? 1 : 0 } : { opacity: 0, y: 18 }}
        animate={
          reduceMotion
            ? { opacity: awakened ? 1 : 0 }
            : awakened
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 18 }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.75, delay: awakened ? 0.7 : 0, ease: EASE }
        }
      >
        <HomeIsland panelClassName="home-threshold-panel flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-none">
          <div className="home-threshold-head">
            <p className="home-threshold-kicker">Casas del archivo</p>
            <p className="home-threshold-title">Instituciones</p>
            <p className="home-threshold-copy">
              Cada institución conserva su propio archivo académico. Hoy está
              abierto el piloto; las demás casas siguen en preparación.
            </p>
            {!empty ? (
              <p className="home-threshold-ledger">
                {openCount} disponible
                {soonCount > 0
                  ? ` · ${soonCount} próxima${soonCount === 1 ? '' : 's'}`
                  : null}
              </p>
            ) : null}
          </div>

          {empty ? (
            <p className="home-threshold-copy" role="status">
              Aún no hay casas publicadas en este umbral.
            </p>
          ) : (
            <div className="legacy-hidden-scroll relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
              {visible.map((institution, index) => (
                <InstitutionCard
                  key={institution.id}
                  institution={institution}
                  index={index}
                  onSelect={onSelect}
                  awakened={awakened}
                  projectCount={projectCounts?.[institution.slug]}
                />
              ))}
            </div>
          )}
        </HomeIsland>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: awakened ? 1 : 0 } : { opacity: 0, y: 10 }}
        animate={
          reduceMotion
            ? { opacity: awakened ? 1 : 0 }
            : awakened
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 10 }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.55, delay: awakened ? 1.05 : 0, ease: EASE }
        }
        className="mt-4 shrink-0"
      >
        <button type="button" className="home-explore-link" onClick={onExploreAll}>
          <Compass className="h-3.5 w-3.5" aria-hidden />
          Explorar el archivo público
        </button>
      </motion.div>
    </div>
  )
}
