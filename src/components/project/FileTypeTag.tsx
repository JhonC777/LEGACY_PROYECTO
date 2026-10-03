import { FileText, Image as ImageIcon, Play, Presentation, type LucideIcon } from 'lucide-react'
import { KIND_LABEL, type ResourceKind } from '@/lib/projectResources'
import { cn } from '@/lib/cn'
import '@/styles/info.css'

export const KIND_ICON: Record<ResourceKind, LucideIcon> = {
  pdf: FileText,
  video: Play,
  presentation: Presentation,
  image: ImageIcon,
  document: FileText,
}

/** Etiqueta de tipo de archivo: icono + nombre. Oro para documentos, plata para medios. */
export function FileTypeTag({
  kind,
  label,
  compact = false,
  className,
}: {
  kind: ResourceKind
  label?: string
  /** Solo icono (la etiqueta queda para lectores de pantalla). */
  compact?: boolean
  className?: string
}) {
  const Icon = KIND_ICON[kind]
  const text = label ?? KIND_LABEL[kind]
  return (
    <span className={cn('ftag', `ftag-${kind}`, compact && 'is-compact', className)}>
      <Icon className="ftag-icon" aria-hidden />
      {compact ? <span className="sr-only">{text}</span> : <span>{text}</span>}
    </span>
  )
}
