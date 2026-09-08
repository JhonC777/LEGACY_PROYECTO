import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { cn } from '@/lib/cn'

const EASE = [0.22, 1, 0.36, 1] as const

type ProjectGalleryProps = {
  title: string
  images: readonly string[]
}

/** Galería con visor a pantalla completa: teclado, flechas y miniaturas. */
export function ProjectGallery({ title, images }: ProjectGalleryProps) {
  const reduceMotion = useReducedMotion()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const total = images.length
  const isOpen = openIndex !== null

  const open = (index: number, trigger: HTMLElement) => {
    triggerRef.current = trigger
    setDirection(1)
    setOpenIndex(index)
  }

  const close = useCallback(() => {
    setOpenIndex(null)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  const step = useCallback(
    (delta: 1 | -1) => {
      setDirection(delta)
      setOpenIndex((current) =>
        current === null ? current : (current + delta + total) % total,
      )
    },
    [total],
  )

  useEffect(() => {
    if (!isOpen) return

    document.body.classList.add('legacy-modal-open')
    window.requestAnimationFrame(() => closeRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('legacy-modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, close, step])

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 26, filter: 'blur(8px)' },
        whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7, ease: EASE },
      }

  return (
    <>
      <motion.section id="galeria" aria-labelledby="galeria-title" {...reveal}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
              Evidencias
            </p>
            <h2
              id="galeria-title"
              className="mt-1 font-display text-3xl font-semibold text-legacy-white"
            >
              Galería del proyecto
            </h2>
          </div>
          <p className="text-xs text-legacy-muted">
            {total} {total === 1 ? 'imagen' : 'imágenes'} · clic para ampliar
          </p>
        </div>
        <div className="project-section-rule mt-3" aria-hidden />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <motion.button
              key={image}
              type="button"
              onClick={(event) => open(index, event.currentTarget)}
              className={cn(
                'gallery-tile group relative w-full overflow-hidden rounded-2xl bg-legacy-surface text-left',
                index === 0 ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/3]',
              )}
              aria-label={`Ampliar imagen ${index + 1} de ${total}`}
              {...(reduceMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 18 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.2 },
                    transition: { duration: 0.6, delay: 0.06 * index, ease: EASE },
                  })}
            >
              <SmartImage
                src={image}
                alt={`Evidencia demostrativa ${index + 1} de ${title}`}
                fallbackLabel="Evidencia demo no disponible"
                className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
              <span aria-hidden className="gallery-tile-scrim" />
              <span aria-hidden className="gallery-tile-zoom">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
              <span aria-hidden className="gallery-tile-index">
                {String(index + 1).padStart(2, '0')}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      <AnimatePresence>
        {isOpen && openIndex !== null ? (
          <motion.div
            className="lightbox fixed inset-0 z-[60] flex flex-col"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Galería de ${title}`}
          >
            <button
              type="button"
              aria-label="Cerrar galería"
              className="lightbox-backdrop absolute inset-0"
              onClick={close}
            />

            <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold tracking-[0.16em] text-legacy-gold uppercase">
                  Evidencia {String(openIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </p>
                <p className="mt-0.5 truncate text-sm text-legacy-white/85">{title}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="liquid-icon liquid-touch flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-legacy-white"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
              {total > 1 ? (
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="lightbox-arrow left-3 sm:left-6"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
              ) : null}

              <AnimatePresence mode="wait" initial={false}>
                <motion.figure
                  key={images[openIndex]}
                  className="lightbox-figure relative flex max-h-full w-full max-w-5xl items-center justify-center"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, x: 40 * direction, scale: 0.97, filter: 'blur(10px)' }
                  }
                  animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { opacity: 0, x: -40 * direction, scale: 0.97, filter: 'blur(10px)' }
                  }
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <div className="lightbox-frame relative aspect-[16/10] w-full overflow-hidden rounded-[1.4rem] bg-legacy-surface">
                    <SmartImage
                      src={images[openIndex] ?? ''}
                      alt={`Evidencia demostrativa ${openIndex + 1} de ${title}`}
                      fallbackLabel="Evidencia demo no disponible"
                      className="object-contain"
                    />
                  </div>
                </motion.figure>
              </AnimatePresence>

              {total > 1 ? (
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="lightbox-arrow right-3 sm:right-6"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>

            {total > 1 ? (
              <div className="relative z-10 flex justify-center gap-2 px-5 pt-3 pb-5 sm:pb-6">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => {
                      setDirection(index > openIndex ? 1 : -1)
                      setOpenIndex(index)
                    }}
                    className={cn(
                      'lightbox-thumb relative h-12 w-16 overflow-hidden rounded-lg',
                      index === openIndex && 'is-active',
                    )}
                    aria-label={`Ir a la imagen ${index + 1}`}
                    aria-current={index === openIndex}
                  >
                    <SmartImage
                      src={image}
                      alt=""
                      fallbackLabel=""
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
