import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import type { Institution } from '@/data/mockInstitutions'
import { cn } from '@/lib/cn'

type InstitutionCardProps = {
  institution: Institution
  index: number
  onSelect: (institution: Institution) => void
  compact?: boolean
}

function InstitutionMark({
  name,
  logoUrl,
  active,
  compact,
}: {
  name: string
  logoUrl?: string
  active: boolean
  compact?: boolean
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <InstitutionLogo
      name={name}
      logoUrl={logoUrl}
      fallback={initials}
      decorative
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-xl border',
        compact ? 'h-11 w-11' : 'h-12 w-12',
        compact ? 'text-sm' : 'text-base',
        active
          ? 'border-legacy-gold/35 bg-legacy-black/55 text-legacy-gold-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
          : 'border-legacy-border/50 bg-legacy-black/30 text-legacy-muted',
      )}
      imageClassName="rounded-[0.6rem] bg-white/95 p-1.5"
    />
  )
}

/** Tarjeta tipo ficha de archivo */
export function InstitutionCard({
  institution,
  index,
  onSelect,
  compact = false,
}: InstitutionCardProps) {
  const reduceMotion = useReducedMotion()
  const disabled = !institution.isActive

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(institution)}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.45,
              delay: 0.82 + index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      whileHover={disabled || reduceMotion ? undefined : { y: -2 }}
      whileTap={disabled || reduceMotion ? undefined : { scale: 0.99 }}
      className={cn(
        'archive-file-card group relative w-full overflow-hidden rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-legacy-gold',
        compact
          ? 'flex min-h-[8.5rem] flex-col gap-2.5 px-3.5 py-3.5'
          : 'flex items-center gap-3.5 px-4 py-4',
        disabled && 'cursor-not-allowed opacity-55',
        !disabled && institution.isPilot && 'is-pilot',
      )}
    >
      {!disabled ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2.5 left-0 w-[2.5px] rounded-full bg-legacy-gold/75 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      ) : null}

      <div className={cn(compact && 'flex items-start justify-between gap-2')}>
        <InstitutionMark
          name={institution.name}
          logoUrl={institution.logoUrl}
          active={!disabled}
          compact={compact}
        />
        {compact ? (
          !disabled ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-legacy-gold/25 text-legacy-gold">
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-legacy-border/50 px-2 py-0.5 text-[10px] tracking-[0.12em] text-legacy-muted uppercase">
              Pronto
            </span>
          )
        ) : null}
      </div>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'font-medium tracking-tight text-legacy-white',
              compact ? 'line-clamp-2 text-sm' : 'truncate text-[1rem]',
            )}
          >
            {institution.name}
          </span>
          {institution.isPilot ? (
            <span className="rounded border border-legacy-gold/45 bg-legacy-gold/12 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-legacy-gold uppercase">
              Piloto
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            'mt-0.5 block text-legacy-muted',
            compact ? 'line-clamp-2 text-[11px] leading-snug' : 'truncate text-[0.8rem]',
          )}
        >
          {institution.description}
        </span>
        {!compact && !disabled ? (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[0.68rem] font-semibold tracking-[0.14em] text-legacy-gold/85 uppercase transition-colors group-hover:text-legacy-gold">
            Entrar al archivo
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        ) : (
          <span className="mt-1 block text-[10px] tracking-[0.14em] text-legacy-muted/75 uppercase">
            {disabled ? 'En preparación' : institution.location}
          </span>
        )}
      </span>

      {!compact ? (
        !disabled ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-legacy-gold/30 bg-legacy-gold/5 text-legacy-gold transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-legacy-border/50 px-2.5 py-1 text-[10px] tracking-[0.12em] text-legacy-muted uppercase">
            Pronto
          </span>
        )
      ) : null}
    </motion.button>
  )
}
