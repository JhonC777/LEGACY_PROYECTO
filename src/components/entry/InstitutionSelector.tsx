import { Compass } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { Institution } from '@/data/mockInstitutions'
import { InstitutionCard } from './InstitutionCard'

type InstitutionSelectorProps = {
  institutions: Institution[]
  onSelect: (institution: Institution) => void
  onExploreAll: () => void
}

const VISIBLE_COUNT = 3

export function InstitutionSelector({
  institutions,
  onSelect,
  onExploreAll,
}: InstitutionSelectorProps) {
  const reduceMotion = useReducedMotion()
  const visible = institutions.slice(0, VISIBLE_COUNT)

  return (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.55, delay: 0.72, ease: [0.22, 1, 0.36, 1] }
        }
        className="entry-panel archive-vitrine entry-panel-live relative overflow-hidden rounded-2xl p-4 sm:p-5"
      >
        <div aria-hidden className="archive-vitrine-rails" />
        <div aria-hidden className="archive-vitrine-glow" />

        <div className="relative mb-4 flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-legacy-gold/80 uppercase">
              Salón de instituciones
            </p>
            <p className="mt-1.5 font-display text-xl font-semibold tracking-wide text-legacy-white sm:text-[1.35rem]">
              Selecciona una institución
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[0.65rem] tabular-nums tracking-wide text-legacy-muted/80">
            {Math.min(VISIBLE_COUNT, institutions.length)} / {institutions.length}
          </span>
        </div>

        <div className="relative flex flex-col gap-2.5">
          {visible.map((institution, index) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.5, delay: 1.1, ease: [0.22, 1, 0.36, 1] }
        }
        className="mt-4"
      >
        <Button variant="secondary" className="w-full" onClick={onExploreAll}>
          <Compass className="h-4 w-4" aria-hidden />
          Explorar todas las instituciones
        </Button>
      </motion.div>
    </div>
  )
}
