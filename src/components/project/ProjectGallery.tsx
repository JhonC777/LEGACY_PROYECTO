import { motion, useReducedMotion } from 'framer-motion'
import { Maximize2 } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { cn } from '@/lib/cn'

const EASE = [0.22, 1, 0.36, 1] as const

type ProjectGalleryProps = {
  title: string
  images: readonly string[]
  /** Abre el visor de recursos de la ficha en la imagen indicada. */
  onOpen: (index: number) => void
}

/** Galería de evidencias. Al pulsar una imagen se abre el visor de la ficha. */
export function ProjectGallery({ title, images, onOpen }: ProjectGalleryProps) {
  const reduceMotion = useReducedMotion()
  const total = images.length

  return (
    <section className="project-block" aria-labelledby="galeria-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="home-threshold-kicker">Evidencias</p>
          <h2 id="galeria-title" className="mt-1 font-brand text-[1.85rem] font-semibold text-legacy-white">
            Galería del proyecto
          </h2>
        </div>
        <p className="text-xs text-legacy-muted">
          {total} {total === 1 ? 'imagen' : 'imágenes'} · clic para ampliar
        </p>
      </div>
      <div className="project-section-rule mt-3" aria-hidden />

      {total === 0 ? (
        <p className="resource-empty">Este proyecto todavía no tiene imágenes.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <motion.button
              key={`${index}-${image}`}
              type="button"
              onClick={() => onOpen(index)}
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
                alt={`Imagen ${index + 1} de ${title}`}
                fallbackLabel="Imagen no disponible"
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
      )}
    </section>
  )
}
