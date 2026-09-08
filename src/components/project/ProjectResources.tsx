import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Download, FileText, Play } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import type { DemoProject } from '@/data/demoData'

const EASE = [0.22, 1, 0.36, 1] as const

function youtubeId(url: string) {
  const match =
    url.match(/[?&]v=([\w-]{6,})/) ??
    url.match(/youtu\.be\/([\w-]{6,})/) ??
    url.match(/youtube\.com\/embed\/([\w-]{6,})/)
  return match?.[1] ?? null
}

/** Reproductor con portada: el iframe solo se carga al pulsar reproducir. */
function VideoFacade({
  url,
  poster,
  title,
}: {
  url: string
  poster: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  const id = youtubeId(url)

  if (!id) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary btn-sm pickup"
      >
        <Play className="h-4 w-4" aria-hidden />
        Ver video
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    )
  }

  if (playing) {
    return (
      <div className="video-facade relative aspect-video w-full overflow-hidden rounded-[1.4rem]">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={`Video de ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="video-facade group relative aspect-video w-full overflow-hidden rounded-[1.4rem] text-left"
      aria-label={`Reproducir video de ${title}`}
    >
      <SmartImage
        src={poster}
        alt=""
        fallbackLabel="Portada del video no disponible"
        className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
      />
      <span aria-hidden className="video-facade-scrim" />
      <span aria-hidden className="video-facade-play">
        <span className="video-facade-play-ring" />
        <Play className="ml-0.5 h-6 w-6 fill-current" />
      </span>
      <span className="video-facade-caption">
        <span className="text-[0.62rem] font-bold tracking-[0.16em] text-legacy-gold uppercase">
          Video del proyecto
        </span>
        <span className="mt-1 block text-sm font-medium text-legacy-white">
          Reproducir sin salir de LEGACY
        </span>
      </span>
    </button>
  )
}

export function ProjectResources({ project }: { project: DemoProject }) {
  const reduceMotion = useReducedMotion()

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
          whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.7, delay, ease: EASE },
        }

  const docHref = project.docUrl?.startsWith('#')
    ? '#recursos'
    : project.docUrl || '#recursos'
  const docIsInternal = docHref.startsWith('#')

  return (
    <section id="recursos" aria-labelledby="recursos-title">
      <motion.div {...reveal()}>
        <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
          Material consultable
        </p>
        <h2
          id="recursos-title"
          className="mt-1 font-display text-3xl font-semibold text-legacy-white"
        >
          Recursos del proyecto
        </h2>
        <div className="project-section-rule mt-3" aria-hidden />
      </motion.div>

      {project.videoUrl ? (
        <motion.div {...reveal(0.08)} className="mt-6">
          <VideoFacade
            url={project.videoUrl}
            poster={project.coverImage}
            title={project.title}
          />
        </motion.div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <motion.a
          {...reveal(0.14)}
          href={docHref}
          className="resource-card group"
          {...(docIsInternal ? {} : { target: '_blank', rel: 'noreferrer' })}
        >
          <span className="resource-card-icon">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-legacy-white">
              Documentación
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-legacy-muted">
              Ficha técnica, bitácora y anexos del proceso.
            </span>
          </span>
          <span className="resource-card-action">
            {docIsInternal ? 'Demo' : 'Abrir'}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </motion.a>

        {project.pdfUrl ? (
          <motion.a
            {...reveal(0.2)}
            href={project.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="resource-card group"
          >
            <span className="resource-card-icon">
              <Download className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-legacy-white">
                Informe en PDF
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-legacy-muted">
                Versión imprimible del proyecto para consulta offline.
              </span>
            </span>
            <span className="resource-card-action">
              Descargar
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </motion.a>
        ) : null}
      </div>
    </section>
  )
}
