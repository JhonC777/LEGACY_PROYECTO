import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Compass,
  FileText,
  FolderKanban,
  HelpCircle,
  Image,
  Layers3,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

type Variant = 'public' | 'admin'

type OnboardingGuideProps = {
  variant: Variant
  identity?: string
}

type GuideStep = {
  eyebrow: string
  title: string
  description: string
  detail: string
  icon: typeof Compass
}

const PUBLIC_STEPS: GuideStep[] = [
  {
    eyebrow: '01 / DESCUBRIR',
    title: 'El conocimiento merece permanecer.',
    description: 'LEGACY reúne proyectos, ideas y experiencias académicas en un archivo creado para conservarlas.',
    detail: 'Comienza en la portada. Allí encontrarás proyectos destacados y las novedades de cada comunidad.',
    icon: Compass,
  },
  {
    eyebrow: '02 / INSTITUCIONES',
    title: 'Cada comunidad tiene su espacio.',
    description: 'Las instituciones conservan su identidad y organizan su memoria dentro de LEGACY.',
    detail: 'Elige una institución para conocer sus áreas, su historia y los proyectos que ha publicado.',
    icon: Building2,
  },
  {
    eyebrow: '03 / PROYECTOS',
    title: 'Una historia detrás de cada proyecto.',
    description: 'Consulta el trabajo de sus autores y descubre los recursos que documentan cada experiencia.',
    detail: 'Cada ficha puede incluir descripción, imágenes, documentos PDF y videos.',
    icon: BookOpen,
  },
]

const ADMIN_STEPS: GuideStep[] = [
  {
    eyebrow: '01 / TU ESPACIO',
    title: 'La memoria de tu institución, bajo tu cuidado.',
    description: 'Este espacio reúne las herramientas para organizar y mantener el archivo académico.',
    detail: 'El panel resume publicaciones, borradores y actividad. Tu acceso corresponde únicamente a esta institución.',
    icon: Layers3,
  },
  {
    eyebrow: '02 / PROYECTOS',
    title: 'Dale estructura a cada idea.',
    description: 'Registra la información esencial para que cada proyecto pueda encontrarse y comprenderse.',
    detail: 'Añade título, descripción, área, año, colección y autores. También puedes guardar un borrador.',
    icon: FolderKanban,
  },
  {
    eyebrow: '03 / RECURSOS',
    title: 'Conserva más que un documento.',
    description: 'Reúne en una misma ficha los materiales que dan contexto al trabajo.',
    detail: 'Adjunta imágenes, documentos PDF y videos. Comprueba que cada recurso corresponda al proyecto.',
    icon: Image,
  },
  {
    eyebrow: '04 / PUBLICACIÓN',
    title: 'Publica cuando todo esté listo.',
    description: 'Una revisión breve ayuda a que cada proyecto llegue al archivo con claridad.',
    detail: 'Verifica la información y los recursos antes de publicar. Después podrás consultar y actualizar tus proyectos.',
    icon: ShieldCheck,
  },
]

function makeKey(variant: Variant, identity?: string) {
  if (variant === 'public') return 'legacy.onboarding.public.v1'
  const value = identity || 'institution-admin'
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `legacy.onboarding.admin.v1.${(hash >>> 0).toString(36)}`
}

export function OnboardingGuide({ variant, identity }: OnboardingGuideProps) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const storageKey = useMemo(() => makeKey(variant, identity), [variant, identity])
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const steps = variant === 'admin' ? ADMIN_STEPS : PUBLIC_STEPS
  const step = steps[stepIndex]
  const StepIcon = step.icon
  const isLast = stepIndex === steps.length - 1
  const isVisible = variant !== 'public' || !location.pathname.startsWith('/admin')

  useEffect(() => {
    if (variant === 'public' && location.pathname.startsWith('/admin')) {
      setOpen(false)
      return
    }
    try {
      if (window.localStorage.getItem(storageKey) !== 'done') {
        setStepIndex(0)
        setOpen(true)
      }
    } catch {
      setOpen(false)
    }
  }, [storageKey, location.pathname, variant])

  const finish = () => {
    try {
      window.localStorage.setItem(storageKey, 'done')
    } catch {
      // El recorrido sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
    setOpen(false)
    setStepIndex(0)
  }

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: 'easeOut' as const }

  return (
    <>
      {isVisible ? (
        <button
          type="button"
          onClick={() => {
            setStepIndex(0)
            setOpen(true)
          }}
          className={`legacy-guide-trigger ${variant === 'admin' ? 'is-admin' : 'is-public'}`}
          aria-label="Abrir guía de LEGACY"
          title="Guía de LEGACY"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          <span>Guía</span>
        </button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            className="legacy-guide-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="legacy-guide-title"
              className="legacy-guide-dialog"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
              transition={transition}
            >
              <div className="legacy-guide-topline">
                <div className="legacy-guide-brand">
                  <span className="legacy-guide-monogram" aria-hidden> L </span>
                  <span className="legacy-guide-wordmark">LEGACY</span>
                  <span className="legacy-guide-divider" />
                  <span className="legacy-guide-context">{variant === 'admin' ? 'ESPACIO ADMINISTRATIVO' : 'ARCHIVO INSTITUCIONAL'}</span>
                </div>
                <button type="button" onClick={finish} aria-label="Cerrar guía" className="legacy-guide-close">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="legacy-guide-welcome">
                <span>{variant === 'admin' ? 'BIENVENIDO A TU ESPACIO' : 'BIENVENIDO A LEGACY'}</span>
                <p>MEMORIA ACADÉMICA <i>·</i> CONOCIMIENTO QUE PERMANECE</p>
              </div>

              <div className="legacy-guide-progress" aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}>
                {steps.map((item, index) => (
                  <span key={item.eyebrow} className={index <= stepIndex ? 'is-active' : ''} />
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step.eyebrow}
                  className="legacy-guide-content"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  transition={transition}
                >
                  <div className="legacy-guide-step-meta">
                    <span className="legacy-guide-icon"><StepIcon className="h-5 w-5" aria-hidden /></span>
                    <span className="legacy-guide-eyebrow">{step.eyebrow}</span>
                  </div>
                  <h2 id="legacy-guide-title">{step.title}</h2>
                  <p className="legacy-guide-description">{step.description}</p>
                  <div className="legacy-guide-detail">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden />
                    <p>{step.detail}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="legacy-guide-footer">
                <span className="legacy-guide-count">{String(stepIndex + 1).padStart(2, '0')} <i>/</i> {String(steps.length).padStart(2, '0')}</span>
                <div className="legacy-guide-actions">
                  {stepIndex > 0 ? (
                    <button type="button" className="legacy-guide-secondary" onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Atrás
                    </button>
                  ) : (
                    <button type="button" className="legacy-guide-secondary" onClick={finish}>Omitir</button>
                  )}
                  <button
                    type="button"
                    className="legacy-guide-primary"
                    onClick={() => (isLast ? finish() : setStepIndex((value) => Math.min(steps.length - 1, value + 1)))}
                  >
                    {isLast ? <><Check className="h-4 w-4" aria-hidden /> Entrar</> : <>Continuar <ArrowRight className="h-4 w-4" aria-hidden /></>}
                  </button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
