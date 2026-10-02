import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Download, FileText, Play } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { withLegacyName } from '@/components/brand/LegacyName'
import type { DemoProject } from '@/data/demoData'
import {
  isDirectVideoFile,
  openableResourceHref,
  resourceFileName,
  safeHref,
  safeMediaSrc,
} from '@/lib/resources'

const EASE = [0.22, 1, 0.36, 1] as const

function youtubeId(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] ?? ''
      return /^[\w-]{6,}$/.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = parsed.searchParams.get('v') ?? parsed.pathname.match(/\/embed\/([\w-]{6,})/)?.[1] ?? ''
      return /^[\w-]{6,}$/.test(id) ? id : null
    }
  } catch {
    return null
  }
  return null
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
  const mediaSrc = safeMediaSrc(url.split('#')[0])

  if (!id) {
    if (isDirectVideoFile(url) && mediaSrc) {
      const fileName = resourceFileName(url, 'video-del-proyecto.mp4')
      return (
        <div className="space-y-3">
          <video
            src={mediaSrc}
            controls
            className="aspect-video w-full overflow-hidden rounded-[1.4rem] bg-legacy-black"
            poster={poster}
          >
            Tu navegador no puede reproducir este video.
          </video>
          <a href={mediaSrc} download={fileName} className="btn btn-secondary btn-sm">
            <Download className="h-4 w-4" aria-hidden />
            Descargar video
          </a>
        </div>
      )
    }
    const href = safeHref(url)
    if (!href) return null
    return (
      <a
        href={href}
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
        <span className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
          Video del proyecto
        </span>
        <span className="mt-1 block text-sm font-medium text-legacy-white">
          {withLegacyName('Reproducir sin salir de LEGACY')}
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
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.7, delay, ease: EASE },
        }

  const docOpen = openableResourceHref(project.docUrl)
  const pdfOpen = openableResourceHref(project.pdfUrl)
  const videoOpen = openableResourceHref(project.videoUrl)
  const docExternal = Boolean(docOpen && /^https?:\/\//i.test(docOpen))
  const pdfExternal = Boolean(pdfOpen && /^https?:\/\//i.test(pdfOpen))
  const docName = project.docUrl
    ? resourceFileName(project.docUrl, 'documento-del-proyecto')
    : 'documento-del-proyecto'
  const pdfName = project.pdfUrl
    ? resourceFileName(project.pdfUrl, 'informe-del-proyecto.pdf')
    : 'informe-del-proyecto.pdf'

  return (
    <section id="recursos" className="project-block" aria-labelledby="recursos-title">
      <motion.div {...reveal()}>
        <p className="home-threshold-kicker">Material consultable</p>
        <h2
          id="recursos-title"
          className="mt-1 font-brand text-[1.85rem] font-semibold text-legacy-white"
        >
          Recursos del proyecto
        </h2>
        <div className="project-section-rule mt-3" aria-hidden />
      </motion.div>

      {videoOpen ? (
        <motion.div {...reveal(0.08)} className="mt-6">
          <VideoFacade
            url={videoOpen}
            poster={project.coverImage}
            title={project.title}
          />
        </motion.div>
      ) : null}

      <div id="documentacion" className="mt-5 grid gap-4 sm:grid-cols-2">
        {docOpen ? (
          <motion.a
            {...reveal(0.14)}
            href={docExternal ? docOpen : docOpen.split('#')[0]}
            className="resource-card group"
            {...(docExternal
              ? { target: '_blank', rel: 'noreferrer' }
              : { download: docName })}
          >
            <span className="resource-card-icon">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-legacy-white">
                Documentación
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-legacy-muted">
                {docName}
              </span>
            </span>
            <span className="resource-card-action">
              {docExternal ? 'Abrir' : 'Descargar'}
              {docExternal ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Download className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
          </motion.a>
        ) : (
          <motion.div
            {...reveal(0.14)}
            className="resource-card is-unavailable"
            aria-disabled="true"
          >
            <span className="resource-card-icon">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-legacy-white">
                Documentación
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-legacy-muted">
                Este proyecto no tiene un documento adjunto.
              </span>
            </span>
            <span className="resource-card-action">No disponible</span>
          </motion.div>
        )}

        {pdfOpen ? (
          <motion.a
            {...reveal(0.2)}
            href={pdfExternal ? pdfOpen : pdfOpen.split('#')[0]}
            className="resource-card group"
            {...(pdfExternal
              ? { target: '_blank', rel: 'noreferrer' }
              : { download: pdfName })}
          >
            <span className="resource-card-icon">
              <Download className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-legacy-white">
                Informe en PDF
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-legacy-muted">
                {pdfName}
              </span>
            </span>
            <span className="resource-card-action">
              {pdfExternal ? 'Abrir' : 'Descargar'}
              {pdfExternal ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Download className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
          </motion.a>
        ) : null}
      </div>
    </section>
  )
}
