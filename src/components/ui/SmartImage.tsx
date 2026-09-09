import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

type SmartImageProps = {
  src: string
  alt: string
  className?: string
  /** Etiqueta corta mostrada si la imagen no carga */
  fallbackLabel?: string
  /** Para portadas visibles al entrar: evita el retraso de la carga diferida */
  priority?: boolean
}

/**
 * Imagen con estado de carga y respaldo visual.
 * Evita que el texto alternativo se desborde sobre el layout cuando la URL falla.
 */
export function SmartImage({
  src,
  alt,
  className,
  fallbackLabel = 'Portada demo no disponible',
  priority = false,
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [trackedSrc, setTrackedSrc] = useState(src)

  // El componente sobrevive a la navegación entre fichas: sin este reinicio, un
  // error previo dejaría el respaldo fijo para todas las portadas siguientes.
  if (src !== trackedSrc) {
    setTrackedSrc(src)
    setStatus('loading')
  }

  if (status === 'error') {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn(
          'image-fallback flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center',
          className,
        )}
      >
        <ImageOff className="h-5 w-5 text-legacy-gold/70" aria-hidden />
        <span className="text-[10px] font-semibold tracking-[0.12em] text-legacy-muted uppercase">
          {fallbackLabel}
        </span>
      </span>
    )
  }

  return (
    <>
      {status === 'loading' ? (
        <span aria-hidden className="image-skeleton absolute inset-0" />
      ) : null}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-500',
          status === 'loading' ? 'opacity-0' : 'opacity-100',
          className,
        )}
      />
    </>
  )
}
