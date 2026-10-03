import { Download, ExternalLink, Eye, Play } from 'lucide-react'
import { FileTypeTag, KIND_ICON } from '@/components/project/FileTypeTag'
import { ResourceMetaLine } from '@/components/project/ResourceMeta'
import type { ProjectResource } from '@/lib/projectResources'
import { cn } from '@/lib/cn'
import '@/styles/info.css'

/**
 * Recursos de la ficha con su tipo (PDF, Video, Presentación, Imagen, Documento).
 * Peso y duración solo aparecen si el dato es real (ver ResourceMeta).
 */
export function ProjectResources({
  resources,
  onOpen,
}: {
  resources: ProjectResource[]
  onOpen: (id: string) => void
}) {
  return (
    <section className="project-block" aria-labelledby="recursos-title">
      <div className="resource-head">
        <div>
          <p className="home-threshold-kicker">Material consultable</p>
          <h2 id="recursos-title" className="mt-1 font-brand text-[1.85rem] font-semibold text-legacy-white">
            Recursos del proyecto
          </h2>
        </div>
        <p className="resource-head-count">
          {resources.length} {resources.length === 1 ? 'recurso' : 'recursos'}
        </p>
      </div>
      <div className="project-section-rule mt-3" aria-hidden />

      {resources.length === 0 ? (
        <p className="resource-empty">Este proyecto todavía no tiene archivos adjuntos.</p>
      ) : (
        <ul className="resource-list">
          {resources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ResourceRow({ resource, onOpen }: { resource: ProjectResource; onOpen: (id: string) => void }) {
  const Icon = KIND_ICON[resource.kind]
  const isVideo = resource.kind === 'video'
  return (
    <li className="resource-row">
      <span className={cn('resource-tile', `is-${resource.kind}`)} aria-hidden>
        {resource.images ? <img src={resource.images[0]} alt="" loading="lazy" decoding="async" /> : <Icon className="h-6 w-6" />}
      </span>
      <div className="resource-info">
        <FileTypeTag kind={resource.kind} />
        <h3>{resource.title}</h3>
        <ResourceMetaLine resource={resource} className="resource-meta" />
      </div>
      <div className="resource-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpen(resource.id)}>
          {isVideo ? <Play className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {isVideo ? 'Reproducir' : 'Ver'}
          <span className="sr-only"> {resource.title}</span>
        </button>
        {resource.downloadName ? (
          <a
            href={resource.href}
            download={resource.downloadName}
            className="btn btn-secondary btn-sm resource-action-download"
            aria-label={`Descargar ${resource.title}`}
          >
            <Download className="h-4 w-4" aria-hidden />
            <span className="resource-action-label">Descargar</span>
          </a>
        ) : resource.external && !resource.images ? (
          <a
            href={resource.href}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm resource-action-download"
            aria-label={`Abrir ${resource.title} en una pestaña nueva`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span className="resource-action-label">Abrir</span>
          </a>
        ) : null}
      </div>
    </li>
  )
}
