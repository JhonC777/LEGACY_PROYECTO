import { Archive, FolderOpen, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

type EntryMessageProps = {
  subtitleDelay?: number
  welcomeDelay?: number
  chipsDelay?: number
  messageDelay?: number
  align?: 'center' | 'start'
}

const VALUE_CHIPS = [
  { label: 'Proyectos publicados', icon: FolderOpen },
  { label: 'Colecciones', icon: Archive },
  { label: 'Acceso invitado', icon: Users },
] as const

export function EntryMessage({
  subtitleDelay = 0.42,
  welcomeDelay = 0.52,
  chipsDelay = 0.62,
  messageDelay = 0.78,
  align = 'center',
}: EntryMessageProps) {
  const reduceMotion = useReducedMotion()
  const start = align === 'start'

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div
      className={cn(
        'mt-5 space-y-4 lg:mt-6 lg:space-y-5',
        start
          ? 'mx-auto max-w-lg text-center lg:mx-0 lg:max-w-xl lg:text-left'
          : 'mx-auto max-w-lg text-center',
      )}
    >
      <motion.p
        {...fadeUp(subtitleDelay)}
        className="font-display text-[clamp(1.35rem,3vw,1.85rem)] leading-snug text-legacy-gold-soft/95"
      >
        Museo Digital del Legado Estudiantil
      </motion.p>

      <motion.p
        {...fadeUp(welcomeDelay)}
        className={cn(
          'text-[0.95rem] leading-relaxed text-legacy-muted lg:text-base',
          start ? 'mx-auto max-w-md lg:mx-0 lg:max-w-lg' : 'mx-auto max-w-md',
        )}
      >
        Un archivo vivo donde los proyectos académicos permanecen visibles,
        organizados y listos para trascender.
      </motion.p>

      <motion.ul
        className={cn(
          'flex flex-wrap gap-2 pt-1',
          start ? 'justify-center lg:justify-start' : 'justify-center',
        )}
      >
        {VALUE_CHIPS.map(({ label, icon: Icon }, i) => (
          <motion.li
            key={label}
            className="archive-value-chip"
            {...fadeUp(chipsDelay + i * 0.08)}
            whileHover={reduceMotion ? undefined : { y: -2 }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-legacy-gold/80" aria-hidden />
            <span>{label}</span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.p
        {...fadeUp(messageDelay)}
        className={cn(
          'pt-1 text-[0.68rem] font-semibold tracking-[0.22em] text-legacy-muted/90 uppercase lg:hidden',
        )}
      >
        Selecciona una institución
      </motion.p>
    </div>
  )
}
