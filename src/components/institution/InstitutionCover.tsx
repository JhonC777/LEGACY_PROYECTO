import { ArrowRight, Compass } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import type { DemoInstitution } from '@/data/demoData'

type InstitutionCoverProps = {
  institution: DemoInstitution
  projectsHref: string
  archiveHref: string
}

const EASE = [0.22, 1, 0.36, 1] as const

/** Portada de entrada al espacio institucional. No vuelca el archivo completo. */
export function InstitutionCover({
  institution,
  projectsHref,
  archiveHref,
}: InstitutionCoverProps) {
  const reduceMotion = useReducedMotion()

  const fade = (delay: number, y = 18) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        }

  return (
    <main id="contenido" className="institution-cover">
      <div className="institution-cover-sky" aria-hidden>
        <span className="institution-cover-nebula is-gold" />
        <span className="institution-cover-nebula is-violet" />
        <span className="institution-cover-dust" />
      </div>

      <div className="institution-cover-stage">
        <motion.p {...fade(0.08, 10)} className="institution-cover-kicker">
          {institution.isDemo ? 'Núcleo de conocimiento · Demo' : 'Núcleo de conocimiento'}
        </motion.p>

        <motion.div {...fade(0.18, 16)} className="institution-cover-mark">
          <InstitutionLogo
            name={institution.name}
            logoUrl={institution.logoUrl}
            fallback={institution.shortName}
            accent={institution.accent}
            decorative
            className="institution-mark institution-mark-logo h-[4.6rem] w-[4.6rem] rounded-full text-xl font-bold text-white sm:h-[5.6rem] sm:w-[5.6rem] sm:text-2xl"
            imageClassName="rounded-full bg-white/95 p-2"
          />
        </motion.div>

        <motion.h1 {...fade(0.3, 20)} className="institution-cover-title">
          {institution.name}
        </motion.h1>

        <motion.p {...fade(0.42, 14)} className="institution-cover-copy">
          {institution.description}
        </motion.p>

        <motion.div {...fade(0.54, 12)} className="institution-cover-actions">
          <Link to={archiveHref} className="btn btn-primary btn-md">
            Abrir el archivo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link to={projectsHref} className="btn btn-secondary btn-md">
            Explorar proyectos
          </Link>
          <Link to="/" className="institution-cover-change">
            <Compass className="h-3.5 w-3.5" aria-hidden />
            Cambiar institución
          </Link>
        </motion.div>

        <motion.p {...fade(0.7, 8)} className="institution-cover-phrase">
          Los archivos no se guardan, <em>trascienden</em>.
        </motion.p>
      </div>
    </main>
  )
}
