import { cn } from '@/lib/cn'
import { useAuraPlayback } from '@/lib/useAuraPlayback'

const BLOBS = [
  { id: 'gold', className: 'home-aura-gold' },
  { id: 'violet', className: 'home-aura-violet' },
  { id: 'ice', className: 'home-aura-ice' },
  { id: 'ember', className: 'home-aura-ember' },
  { id: 'hearth', className: 'home-aura-hearth' },
] as const

/** Lavados volumétricos lentos. Sin rayos ni blend modes. */
export function HomeAura() {
  const { live } = useAuraPlayback()

  return (
    <div className={cn('home-aura', !live && 'is-still')} aria-hidden>
      {BLOBS.map((blob) => (
        <span
          key={blob.id}
          className={cn('home-aura-blob', blob.className, live && 'is-live')}
        />
      ))}
      <span className={cn('home-aura-ring', live && 'is-live')} />
    </div>
  )
}
