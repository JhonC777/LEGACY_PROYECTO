import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Download, FileText, Play } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { withLegacyName } from '@/components/brand/LegacyName'
import type { DemoProject } from '@/data/demoData'
import { isDirectVideoFile, isFileResource, resourceFileName, safeHref, safeMediaSrc } from '@/lib/resources'

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
        <span className="text-[0.62rem] font-bold tracking-[0.16em] text-legacy-gold uppercase">
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

  const docHref = project.docUrl?.startsWith('#')
    ? '#recursos'
    : project.docUrl || '#recursos'
  const docIsFile = isFileResource(project.docUrl)
  const docName = project.docUrl
    ? resourceFileName(project.docUrl, 'documento-del-proyecto')
    : ''
  const pdfName = project.pdfUrl
    ? resourceFileName(project.pdfUrl, 'informe-del-proyecto.pdf')
    : ''
  const docLink = safeHref(docIsFile ? project.docUrl!.split('#')[0] : docHref) ?? '#recursos'
  const pdfFileLink = project.pdfUrl ? safeHref(project.pdfUrl.split('#')[0]) : null
  const pdfOpenLink = project.pdfUrl ? safeHref(project.pdfUrl) : null

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
          href={docLink}
          className="resource-card group"
          {...(docIsFile && docLink !== '#recursos'
            ? { download: docName }
            : docLink.startsWith('#')
              ? {}
              : { target: '_blank', rel: 'noreferrer' })}
        >
          <span className="resource-card-icon">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-legacy-white">
              Documentación
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-legacy-muted">
              {docIsFile
                ? docName
                : 'Ficha técnica, bitácora y anexos del proceso.'}
            </span>
          </span>
          <span className="resource-card-action">
            {docIsFile ? 'Descargar' : 'Abrir'}
            {docIsFile ? (
              <Download className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </span>
        </motion.a>

        {project.pdfUrl && isFileResource(project.pdfUrl) && pdfFileLink ? (
          <motion.a
            {...reveal(0.2)}
            href={pdfFileLink}
            download={pdfName}
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
                {pdfName}
              </span>
            </span>
            <span className="resource-card-action">
              Descargar
              <Download className="h-3.5 w-3.5" aria-hidden />
            </span>
          </motion.a>
        ) : pdfOpenLink ? (
          <motion.a
            {...reveal(0.2)}
            href={pdfOpenLink}
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
              Abrir
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </motion.a>
        ) : null}
      </div>
    </section>
  )
}
