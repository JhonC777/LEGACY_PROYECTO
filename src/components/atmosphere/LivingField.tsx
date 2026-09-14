import { cn } from '@/lib/cn'
import { useAuraPlayback } from '@/lib/useAuraPlayback'
import { HomeAura } from '@/components/entry/HomeAura'

const BUBBLES = [
  { id: 'a', className: 'living-bubble-a' },
  { id: 'b', className: 'living-bubble-b' },
  { id: 'c', className: 'living-bubble-c' },
  { id: 'd', className: 'living-bubble-d' },
  { id: 'e', className: 'living-bubble-e' },
  { id: 'f', className: 'living-bubble-f' },
] as const

const MOTES = [
  { id: 'm1', className: 'living-mote-a' },
  { id: 'm2', className: 'living-mote-b' },
  { id: 'm3', className: 'living-mote-c' },
  { id: 'm4', className: 'living-mote-d' },
  { id: 'm5', className: 'living-mote-e' },
  { id: 'm6', className: 'living-mote-f' },
] as const

type LivingFieldProps = {
  variant?: 'embed' | 'page'
}

/** Auras + motas lentas. Barato: transform/opacity, se pausa si la pestaña está oculta. */
export function LivingField({ variant = 'embed' }: LivingFieldProps) {
  const { live } = useAuraPlayback()

  return (
    <div
      className={cn(
        'living-field',
        variant === 'page' && 'is-page',
        !live && 'is-still',
      )}
      aria-hidden
    >
      <HomeAura />
      <div className="living-bubbles">
        {BUBBLES.map((bubble) => (
          <span
            key={bubble.id}
            className={cn('living-bubble', bubble.className, live && 'is-live')}
          />
        ))}
        {MOTES.map((mote) => (
          <span
            key={mote.id}
            className={cn('living-mote', mote.className, live && 'is-live')}
          />
        ))}
      </div>
    </div>
  )
}
