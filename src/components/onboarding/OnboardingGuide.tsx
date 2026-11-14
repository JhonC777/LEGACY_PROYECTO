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
    eyebrow: '01 · DESCUBRIR',
    title: 'Explora el archivo académico',
    description: 'LEGACY reúne proyectos, ideas y trabajos que merecen permanecer.',
    detail: 'Recorre la portada y descubre proyectos destacados, colecciones y novedades del archivo.',
    icon: Compass,
  },
  {
    eyebrow: '02 · INSTITUCIONES',
    title: 'Encuentra cada comunidad',
    description: 'Cada institución conserva su propio espacio dentro de LEGACY.',
    detail: 'Entra a una institución para conocer su historia, explorar sus áreas y consultar sus proyectos publicados.',
    icon: Building2,
  },
  {
    eyebrow: '03 · PROYECTOS',
    title: 'Consulta cada proyecto',
    description: 'Cada ficha reúne la información y los recursos de su trabajo.',
    detail: 'Abre un proyecto para revisar autores, descripción, imágenes, documentos PDF y videos disponibles.',
    icon: BookOpen,
  },
]

const ADMIN_STEPS: GuideStep[] = [
  {
    eyebrow: '01 · TU ESPACIO',
    title: 'Este es tu centro de control',
    description: 'Administra el archivo académico de tu institución desde un solo lugar.',
    detail: 'El resumen muestra publicaciones, borradores, archivos y tareas que necesitan atención. Tu acceso está limitado a esta institución.',
    icon: Layers3,
  },
  {
    eyebrow: '02 · PROYECTOS',
    title: 'Crea y organiza proyectos',
    description: 'Cada proyecto comienza con su información esencial.',
    detail: 'Añade título, descripción, área, año, colección y autores. Puedes guardar un borrador y continuar después.',
    icon: FolderKanban,
  },
  {
    eyebrow: '03 · RECURSOS',
    title: 'Completa la memoria multimedia',
    description: 'Un proyecto puede reunir distintos formatos en una sola ficha.',
    detail: 'Adjunta imágenes, documentos y videos. Revisa que los archivos correspondan al proyecto antes de publicarlo.',
    icon: Image,
  },
  {
    eyebrow: '04 · PUBLICACIÓN',
    title: 'Revisa antes de publicar',
    description: 'Tú decides cuándo un proyecto está listo para el público.',
    detail: 'Comprueba los datos y recursos, publica cuando todo esté completo y consulta el historial para seguir los cambios.',
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
  }, [storageKey, location.pathname])

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
    : { duration: 0.2, ease: 'easeOut' as const }

  return (
    <>
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
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
              transition={transition}
            >
              <div className="legacy-guide-topline">
                <span>LEGACY <i>·</i> {variant === 'admin' ? 'GUÍA DEL ADMINISTRADOR' : 'GUÍA DE EXPLORACIÓN'}</span>
                <button type="button" onClick={finish} aria-label="Cerrar guía" className="legacy-guide-close">
                  <X className="h-4 w-4" aria-hidden />
                </button>
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
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                  transition={transition}
                >
                  <div className="legacy-guide-icon">
                    <StepIcon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="legacy-guide-eyebrow">{step.eyebrow}</p>
                  <h2 id="legacy-guide-title">{step.title}</h2>
                  <p className="legacy-guide-description">{step.description}</p>
                  <div className="legacy-guide-detail">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden />
                    <p>{step.detail}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="legacy-guide-footer">
                <span className="legacy-guide-count">{String(stepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
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
                    {isLast ? <><Check className="h-4 w-4" aria-hidden /> Comenzar</> : <>Continuar <ArrowRight className="h-4 w-4" aria-hidden /></>}
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
