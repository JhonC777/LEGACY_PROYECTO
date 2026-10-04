import { withLegacyName } from '@/components/brand/LegacyName'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react'
import { FileTypeTag, KIND_ICON } from '@/components/project/FileTypeTag'
import { ResourceMetaLine, useResourceMeta } from '@/components/project/ResourceMeta'
import { KIND_LABEL, type ProjectResource } from '@/lib/projectResources'
import { useDialog } from '@/lib/useDialog'
import { cn } from '@/lib/cn'
import '@/styles/info.css'

/**
 * Único prefijo que la CSP de producción (vercel.json → frame-src) deja
 * incrustar: los enlaces firmados del bucket privado `archive` del Storage de
 * Legacy. Solo esos PDF se ven dentro de la página; cualquier otro PDF (otro
 * bucket, otro host o el propio origen) se abre en una pestaña nueva con el
 * visor nativo del navegador. Si se cambia aquí, hay que cambiar frame-src.
 */
const PDF_FRAME_ORIGINS: readonly string[] = [
  'https://padsyhitxmbxjifpvzhj.supabase.co/storage/v1/object/sign/archive/',
]

function canFramePdf(href: string) {
  try {
    const url = new URL(href)
    if (url.username || url.password || url.port) return false
    // Se compara la URL normalizada (sin `..`, ni mayúsculas en el host).
    const normalized = `${url.origin}${url.pathname}`
    return PDF_FRAME_ORIGINS.some(
      (prefix) => href.startsWith(prefix) && normalized.startsWith(prefix),
    )
  } catch {
    return false
  }
}

export type ViewerTarget = { id: string; index: number }

type ResourceViewerProps = {
  resources: ProjectResource[]
  projectTitle: string
  target: ViewerTarget | null
  onChange: (target: ViewerTarget) => void
  onClose: () => void
}

export function ResourceViewer(props: ResourceViewerProps) {
  if (!props.target) return null
  return createPortal(<ViewerDialog {...props} target={props.target} />, document.body)
}

function ViewerDialog({
  resources,
  projectTitle,
  target,
  onChange,
  onClose,
}: ResourceViewerProps & { target: ViewerTarget }) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [duration, setDuration] = useState<number | null>(null)
  useDialog(true, panelRef, onClose, closeRef)

  const resource: ProjectResource | undefined =
    resources.find((item) => item.id === target.id) ?? resources[0]
  const images = resource?.images ?? []
  const index = Math.min(Math.max(target.index, 0), Math.max(images.length - 1, 0))
  // Admite recurso vacío: el hook corre siempre y el guard de abajo cierra el visor.
  const parts = useResourceMeta(resource ?? null, duration)

  useEffect(() => setDuration(null), [resource?.id])

  useEffect(() => {
    if (!resource || images.length < 2) return
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key === 'ArrowRight') onChange({ id: resource.id, index: (index + 1) % images.length })
      if (event.key === 'ArrowLeft')
        onChange({ id: resource.id, index: (index - 1 + images.length) % images.length })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [images.length, index, onChange, resource])

  if (!resource) return null

  const step = (delta: 1 | -1) =>
    onChange({ id: resource.id, index: (index + delta + images.length) % images.length })
  const currentHref = resource.images ? images[index] : resource.href
  const titleId = 'visor-titulo'
  const currentExternal = Boolean(currentHref && /^https?:\/\//i.test(currentHref))
  // El atributo download solo funciona en el mismo origen: lo externo se abre aparte.
  const canDownload = Boolean(resource.downloadName) || Boolean(resource.images && !currentExternal)

  const nav =
    images.length > 1 ? (
      <div className="viewer-nav" role="group" aria-label="Imágenes">
        <button type="button" className="btn btn-secondary viewer-icon-btn" onClick={() => step(-1)} aria-label="Imagen anterior">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="viewer-count" aria-live="polite">
          Imagen <b>{index + 1}</b> de {images.length}
        </span>
        <button type="button" className="btn btn-secondary viewer-icon-btn" onClick={() => step(1)} aria-label="Imagen siguiente">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    ) : null

  return (
    <div className="viewer-root">
      <div className="viewer-backdrop" aria-hidden onClick={onClose} />
      <section
        ref={panelRef}
        className="viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="viewer-top">
          <div className="viewer-title">
            <FileTypeTag kind={resource.kind} className="viewer-title-tag" />
            <div className="min-w-0">
              <h2 id={titleId}>{resource.title}</h2>
              <p>
                <span className="viewer-project">{projectTitle}</span>
                {parts.length > 0 ? <span> · {parts.join(' · ')}</span> : null}
              </p>
            </div>
          </div>
          <div className="viewer-top-nav">{nav}</div>
          <div className="viewer-actions">
            {canDownload && currentHref ? (
              <a
                href={currentHref}
                download={resource.downloadName ?? ''}
                className="btn btn-primary btn-sm viewer-download"
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="viewer-download-label">Descargar</span>
              </a>
            ) : null}
            {currentExternal ? (
              <a
                href={currentHref}
                target="_blank"
                rel="noreferrer"
                className="header-action header-action-quiet viewer-square"
                aria-label="Abrir en una pestaña nueva"
                title="Abrir en una pestaña nueva"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="header-action header-action-quiet viewer-square viewer-close"
            onClick={onClose}
            aria-label="Cerrar visor"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {resources.length > 1 ? (
          <div className="viewer-switch" role="group" aria-label="Recursos del proyecto">
            {resources.map((item) => {
              const Icon = KIND_ICON[item.kind]
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn('viewer-switch-btn', item.id === resource.id && 'is-active')}
                  aria-pressed={item.id === resource.id}
                  onClick={() => onChange({ id: item.id, index: 0 })}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.images ? `Fotos ${item.images.length}` : KIND_LABEL[item.kind]}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className={cn('viewer-body', images.length > 1 && 'has-thumbs', resources.length > 1 && 'has-side')}>
          {images.length > 1 ? (
            <div className="viewer-thumbs" role="group" aria-label="Miniaturas">
              {images.map((image, imageIndex) => (
                <button
                  key={`${imageIndex}-${image}`}
                  type="button"
                  className={cn('viewer-thumb', imageIndex === index && 'is-active')}
                  aria-label={`Ver imagen ${imageIndex + 1}`}
                  aria-current={imageIndex === index ? 'true' : undefined}
                  onClick={() => onChange({ id: resource.id, index: imageIndex })}
                >
                  <img src={image} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="viewer-stage">
            <Stage
              resource={resource}
              imageHref={images[index]}
              imageLabel={`Imagen ${index + 1} de ${images.length} · ${projectTitle}`}
              onDuration={setDuration}
            />
          </div>

          {resources.length > 1 ? (
            <aside className="viewer-side" aria-label="Otros recursos">
              <h3>En este proyecto</h3>
              <ul>
                {resources.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn('viewer-other', item.id === resource.id && 'is-active')}
                      aria-current={item.id === resource.id ? 'true' : undefined}
                      onClick={() => onChange({ id: item.id, index: 0 })}
                    >
                      <FileTypeTag kind={item.kind} compact />
                      <span className="min-w-0">
                        <b>{item.title}</b>
                        <ResourceMetaLine resource={item} className="viewer-other-meta" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>

        {nav ? <div className="viewer-bottom">{nav}</div> : null}

        <footer className="viewer-foot">
          <span>
            <kbd>Esc</kbd> cerrar
            {images.length > 1 ? (
              <>
                {' · '}
                <kbd>←</kbd>
                <kbd>→</kbd> imágenes
              </>
            ) : null}
          </span>
          <span>{withLegacyName('Se abre dentro de la ficha, sin salir de Legacy')}</span>
        </footer>
      </section>
    </div>
  )
}

function Stage({
  resource,
  imageHref,
  imageLabel,
  onDuration,
}: {
  resource: ProjectResource
  imageHref?: string
  imageLabel: string
  onDuration: (value: number | null) => void
}) {
  if (resource.kind === 'image' && imageHref) {
    return <img key={imageHref} src={imageHref} alt={imageLabel} className="viewer-image" decoding="async" />
  }

  if (resource.kind === 'video' && resource.youtubeId) {
    return (
      <div className="viewer-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${resource.youtubeId}?rel=0&modestbranding=1`}
          title={resource.title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  if (resource.kind === 'video' && resource.directVideo) {
    return (
      <div className="viewer-video">
        <video
          src={resource.href}
          controls
          preload="metadata"
          onLoadedMetadata={(event) => {
            const value = event.currentTarget.duration
            onDuration(Number.isFinite(value) && value > 0 ? value : null)
          }}
        >
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    )
  }

  if (resource.kind === 'pdf' && canFramePdf(resource.href)) {
    return <iframe className="viewer-pdf" src={resource.href} title={resource.title} />
  }

  const Icon = KIND_ICON[resource.kind]
  const isPdf = resource.kind === 'pdf'
  const isVideo = resource.kind === 'video'
  return (
    <div className="viewer-paper">
      <span className="viewer-paper-icon">
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <p className="viewer-paper-kicker">{KIND_LABEL[resource.kind]}</p>
      <h3>{resource.downloadName ?? resource.title}</h3>
      <p className="viewer-paper-text">
        {isPdf
          ? 'El PDF se abre con el visor de tu navegador, en una pestaña nueva.'
          : isVideo
            ? withLegacyName('Este video está alojado fuera de Legacy y se abre en una pestaña nueva.')
            : 'Este archivo se descarga para abrirlo con tu programa habitual.'}
      </p>
      <div className="viewer-paper-actions">
        {resource.external ? (
          <a href={resource.href} target="_blank" rel="noreferrer" className="btn btn-primary btn-md">
            <ExternalLink className="h-4 w-4" aria-hidden />
            {isPdf ? 'Abrir PDF' : isVideo ? 'Abrir video' : 'Abrir archivo'}
          </a>
        ) : null}
        {resource.downloadName ? (
          <a href={resource.href} download={resource.downloadName} className={cn('btn btn-md', resource.external ? 'btn-secondary' : 'btn-primary')}>
            <Download className="h-4 w-4" aria-hidden />
            Descargar
          </a>
        ) : null}
        {!resource.external && !resource.downloadName ? (
          <a href={resource.href} target="_blank" rel="noreferrer" className="btn btn-primary btn-md">
            <ExternalLink className="h-4 w-4" aria-hidden />
            Abrir
          </a>
        ) : null}
      </div>
    </div>
  )
}
