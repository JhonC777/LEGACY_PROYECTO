import {
  formatBytes,
  formatDuration,
  useResourceSize,
  useVideoDuration,
  type ProjectResource,
} from '@/lib/projectResources'

/**
 * Datos reales del recurso: extensión, peso (Content-Length) o duración
 * (metadatos del video). Si no hay dato, la lista queda vacía y la interfaz
 * muestra solo la etiqueta de tipo. Nunca se inventan páginas ni pesos.
 */
export function useResourceMeta(
  resource: ProjectResource | null | undefined,
  knownDuration?: number | null,
) {
  // Los hooks se llaman siempre, en el mismo orden, aunque no haya recurso.
  const probeFile = Boolean(resource) && resource?.kind !== 'image' && !resource?.youtubeId
  const size = useResourceSize(probeFile && !resource?.directVideo ? resource?.href : null)
  const probed = useVideoDuration(
    resource?.directVideo && knownDuration == null ? resource.href : null,
  )
  const duration = knownDuration ?? probed

  const parts: string[] = []
  if (!resource) return parts
  if (resource.images) {
    parts.push(`${resource.images.length} ${resource.images.length === 1 ? 'imagen' : 'imágenes'}`)
  }
  if (resource.extension && resource.kind !== 'pdf') parts.push(resource.extension)
  if (duration) parts.push(`${formatDuration(duration)} min`)
  if (resource.youtubeId) parts.push('YouTube')
  if (size) parts.push(formatBytes(size))
  return parts
}

export function ResourceMetaLine({
  resource,
  className,
}: {
  resource: ProjectResource
  className?: string
}) {
  const parts = useResourceMeta(resource)
  if (parts.length === 0) return null
  return <span className={className}>{parts.join(' · ')}</span>
}
