import { motion, useReducedMotion } from 'framer-motion'
import { CircleAlert, Lightbulb, Route, Target } from 'lucide-react'
import type { DemoProject } from '@/data/demoData'

const EASE = [0.22, 1, 0.36, 1] as const

type Step = {
  key: string
  eyebrow: string
  title: string
  text: string
  icon: typeof CircleAlert
}

/** Problema → solución → metodología → resultados como recorrido, sin alterar el texto. */
export function ProcessTimeline({ project }: { project: DemoProject }) {
  const reduceMotion = useReducedMotion()

  const steps: Step[] = [
    {
      key: 'problema',
      eyebrow: 'Punto de partida',
      title: 'Problema abordado',
      text: project.problem,
      icon: CircleAlert,
    },
    {
      key: 'solucion',
      eyebrow: 'Propuesta',
      title: 'Solución propuesta',
      text: project.solution,
      icon: Lightbulb,
    },
    {
      key: 'metodologia',
      eyebrow: 'Cómo se hizo',
      title: 'Proceso y metodología',
      text: project.methodology,
      icon: Route,
    },
    {
      key: 'resultados',
      eyebrow: 'Lo que quedó',
      title: 'Resultados e impacto demostrativo',
      text: project.results,
      icon: Target,
    },
  ]

  return (
    <section id="proceso" className="project-block" aria-labelledby="proceso-title">
      <motion.div
        {...(reduceMotion
          ? {}
          : {
              initial: { opacity: 0, y: 16 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, amount: 0.3 },
              transition: { duration: 0.65, ease: EASE },
            })}
      >
        <p className="home-threshold-kicker">Recorrido del proyecto</p>
        <h2
          id="proceso-title"
          className="mt-1 font-display text-[1.85rem] font-semibold text-legacy-white"
        >
          Del problema al resultado
        </h2>
        <div className="project-section-rule mt-3" aria-hidden />
      </motion.div>

      <ol className="process-grid mt-7">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.li
              key={step.key}
              className="process-cell"
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 14 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.3 },
                    transition: { duration: 0.55, delay: 0.06 * index, ease: EASE },
                  })}
            >
              <article className="process-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="process-cell-index">{String(index + 1).padStart(2, '0')}</p>
                    <p className="mt-2 text-[0.62rem] font-bold tracking-[0.16em] text-legacy-gold/80 uppercase">
                      {step.eyebrow}
                    </p>
                    <h3 className="mt-1 font-display text-[1.35rem] leading-tight font-semibold text-legacy-white">
                      {step.title}
                    </h3>
                  </div>
                  <span className="process-card-icon">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-3.5 text-[0.92rem] leading-7 text-legacy-muted">
                  {step.text}
                </p>
              </article>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}
