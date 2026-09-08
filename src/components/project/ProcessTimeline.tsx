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
    <section id="proceso" aria-labelledby="proceso-title">
      <motion.div
        {...(reduceMotion
          ? {}
          : {
              initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
              whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
              viewport: { once: true, amount: 0.3 },
              transition: { duration: 0.7, ease: EASE },
            })}
      >
        <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
          Recorrido del proyecto
        </p>
        <h2
          id="proceso-title"
          className="mt-1 font-display text-3xl font-semibold text-legacy-white"
        >
          Del problema al resultado
        </h2>
        <div className="project-section-rule mt-3" aria-hidden />
      </motion.div>

      <ol className="process-rail mt-8">
        <motion.span
          aria-hidden
          className="process-line"
          {...(reduceMotion
            ? {}
            : {
                initial: { scaleY: 0 },
                whileInView: { scaleY: 1 },
                viewport: { once: true, amount: 0.15 },
                transition: { duration: 1.4, ease: EASE },
              })}
        />

        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.li
              key={step.key}
              className="process-step"
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0, x: -18, filter: 'blur(6px)' },
                    whileInView: { opacity: 1, x: 0, filter: 'blur(0px)' },
                    viewport: { once: true, amount: 0.35 },
                    transition: { duration: 0.65, delay: 0.08 * index, ease: EASE },
                  })}
            >
              <span className="process-node" aria-hidden>
                <span className="process-node-index">{index + 1}</span>
                <span className="process-node-ring" />
              </span>

              <article className="process-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.62rem] font-bold tracking-[0.16em] text-legacy-gold/80 uppercase">
                      {step.eyebrow}
                    </p>
                    <h3 className="mt-1 font-display text-[1.45rem] leading-tight font-semibold text-legacy-white">
                      {step.title}
                    </h3>
                  </div>
                  <span className="process-card-icon">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-3.5 text-[0.95rem] leading-7 text-legacy-muted">
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
