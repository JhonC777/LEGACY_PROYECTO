import { cn } from '@/lib/cn'

type InstitutionLogoProps = {
  name: string
  logoUrl?: string
  fallback: string
  accent?: string
  className?: string
  imageClassName?: string
  decorative?: boolean
}

export function InstitutionLogo({
  name,
  logoUrl,
  fallback,
  accent,
  className,
  imageClassName,
  decorative = false,
}: InstitutionLogoProps) {
  return (
    <span
      className={cn(
        'institution-logo relative flex shrink-0 items-center justify-center overflow-hidden',
        className,
      )}
      data-has-logo={logoUrl ? 'true' : undefined}
      style={!logoUrl && accent ? { backgroundColor: accent } : undefined}
      aria-hidden={decorative || undefined}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={decorative ? '' : `Logo de ${name}`}
          className={cn('h-full w-full object-contain', imageClassName)}
        />
      ) : (
        <span aria-hidden className="font-display font-semibold tracking-wide">
          {fallback}
        </span>
      )}
    </span>
  )
}
