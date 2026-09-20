import cosmosPlate from '@/assets/home-cosmos-plate.jpg'
import { LivingField } from '@/components/atmosphere/LivingField'
import { cn } from '@/lib/cn'
import { useAuraPlayback } from '@/lib/useAuraPlayback'

const CONSTELLATION_LINES = [
  'M140 160 L260 210 L340 130 L470 190',
  'M260 210 L290 310 L210 360',
  'M470 190 L560 280 L640 220',
  'M340 130 L390 80',
] as const

const CONSTELLATION_STARS = [
  [140, 160, 2.1, 0],
  [260, 210, 1.6, 0.4],
  [340, 130, 2.4, 0.9],
  [470, 190, 1.7, 1.3],
  [290, 310, 1.4, 1.8],
  [210, 360, 1.8, 0.2],
  [560, 280, 1.5, 2.1],
  [640, 220, 2, 0.7],
  [390, 80, 1.3, 1.5],
] as const

export function CosmicBackground() {
  const { live } = useAuraPlayback()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="cosmic-layer cosmic-base" />

      <div className="cosmic-parallax is-far">
        <div
          className={cn('cosmic-layer cosmic-plate', live && 'is-live')}
          style={{ backgroundImage: `url(${cosmosPlate})` }}
        />
        <div className="cosmic-layer cosmic-plate-grade" />
      </div>

      <div className="cosmic-parallax is-mid">
        <div className={cn('cosmic-planet', live && 'is-live')}>
          <span className="cosmic-planet-body" />
          <span className="cosmic-planet-limb" />
          <span className="cosmic-planet-sheen" />
        </div>
        <div className="cosmic-layer cosmic-hearth" />
        <div className={cn('cosmic-layer cosmic-aurora', live && 'is-live')} />
        <div className={cn('cosmic-layer cosmic-horizon', live && 'is-live')} />
        <span className={cn('cosmic-sun', live && 'is-live')} />
      </div>

      <div className="cosmic-parallax is-near">
        <div className={cn('cosmic-layer cosmic-dust', live && 'is-live')} />
        <LivingField />
        <svg
          className={cn('cosmic-layer cosmic-constellation', live && 'is-live')}
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMinYMid slice"
        >
          <g
            className="cosmic-constellation-lines"
            fill="none"
            stroke="rgb(214 184 120 / 0.28)"
            strokeWidth="0.7"
            strokeLinecap="round"
          >
            {CONSTELLATION_LINES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g fill="rgb(247 245 239 / 0.72)">
            {CONSTELLATION_STARS.map(([cx, cy, r, delay]) => (
              <circle
                key={`${cx}-${cy}`}
                className={cn('cosmic-star', live && 'is-live')}
                cx={cx}
                cy={cy}
                r={r}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="cosmic-layer cosmic-grain" />
      <div className="cosmic-layer cosmic-vignette" />
    </div>
  )
}
