import { LegacyName } from '@/components/brand/LegacyName'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import '@/styles/info.css'

/**
 * Portada dorada para proyectos sin foto (o cuya foto no carga).
 * El patrón depende del área y la semilla del slug: la misma ficha
 * siempre recibe la misma portada. Todo es SVG + CSS: sin estilos en línea.
 */

type Pattern = 'circuito' | 'botanica' | 'ondas'

export function patternForArea(area: string): Pattern {
  const value = area.toLocaleLowerCase('es')
  if (/tecnolog|innovaci|ingenier|robót|robot|matemát|datos/.test(value)) return 'circuito'
  if (/social|arte|cultur|lenguaj|human|educa|comunica|histor/.test(value)) return 'ondas'
  if (/natural|ambient|ecolog|biolog|salud|agro|huert|ciencia/.test(value)) return 'botanica'
  return 'ondas'
}

function seedFrom(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function random(seed: number) {
  let state = seed || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const n = (value: number) => Math.round(value)

function Circuit({ seed, line }: { seed: number; line: string }) {
  const r = random(seed)
  const nodes: ReactNode[] = []
  for (let k = 0; k < 16; k += 1) {
    let x = 290 + r() * 120
    let y = 10 + r() * 240
    let d = `M${n(x)} ${n(y)}`
    for (let s = 0; s < 4; s += 1) {
      if (s % 2) x = Math.max(290, x + (r() - 0.35) * 90)
      else y += (r() - 0.5) * 80
      d += ` L${n(x)} ${n(y)}`
    }
    const width = (0.8 + r()).toFixed(2)
    const opacity = (0.35 + r() * 0.4).toFixed(2)
    const radius = (2 + r() * 2).toFixed(1)
    nodes.push(
      <g key={k}>
        <path d={d} fill="none" stroke={`url(#${line})`} strokeWidth={width} opacity={opacity} />
        <circle cx={n(x)} cy={n(y)} r={radius} fill="none" stroke="#f0d9a0" strokeWidth="1.2" opacity="0.75" />
      </g>,
    )
  }
  for (let k = 0; k < 6; k += 1) {
    nodes.push(
      <rect key={`c${k}`} x={290 + k * 18} y={70 + (k % 3) * 34} width="14" height="14" rx="2" fill="none" stroke="#d6b878" opacity="0.35" />,
    )
  }
  nodes.push(
    <circle key="o1" cx="330" cy="105" r="62" fill="none" stroke="#d6b878" strokeWidth="0.8" opacity="0.35" />,
    <circle key="o2" cx="330" cy="105" r="40" fill="none" stroke="#f0d9a0" strokeDasharray="2 5" opacity="0.5" />,
  )
  return <>{nodes}</>
}

function Leaf({ seed, fill }: { seed: number; fill: string }) {
  const r = random(seed)
  const nodes: ReactNode[] = []
  for (let k = 1; k < 9; k += 1) {
    nodes.push(
      <ellipse key={`e${k}`} cx="315" cy="120" rx={k * 16} ry={k * 13} fill="none" stroke="#d6b878" strokeWidth="0.7" opacity={(0.42 - k * 0.035).toFixed(2)} />,
    )
  }
  nodes.push(
    <path key="leaf" d="M250 205 C 270 120, 330 70, 390 40 C 380 110, 330 175, 250 205 Z" fill={`url(#${fill})`} stroke="#f0d9a0" strokeWidth="1.2" opacity="0.9" />,
    <path key="rib" d="M250 205 C 300 150, 340 100, 390 40" fill="none" stroke="#f0d9a0" strokeWidth="1" opacity="0.8" />,
  )
  for (let k = 0; k < 7; k += 1) {
    const t = 0.15 + k * 0.11
    const x = n(250 + 140 * t)
    const y = n(205 - 165 * t)
    nodes.push(
      <path key={`v${k}`} d={`M${x} ${y} q ${14 + k * 2} ${4 - k} ${22 + k * 3} ${-18 + k}`} fill="none" stroke="#f0d9a0" strokeWidth="0.8" opacity="0.6" />,
      <path key={`w${k}`} d={`M${x} ${y} q ${-4 + k} ${-14 - k} ${-18 + k} ${-26 - k * 2}`} fill="none" stroke="#f0d9a0" strokeWidth="0.8" opacity="0.5" />,
    )
  }
  for (let k = 0; k < 26; k += 1) {
    nodes.push(
      <circle key={`p${k}`} cx={n(240 + r() * 170)} cy={n(15 + r() * 230)} r={(0.6 + r() * 1.4).toFixed(1)} fill="#f0d9a0" opacity={(0.3 + r() * 0.5).toFixed(2)} />,
    )
  }
  return <>{nodes}</>
}

function Waves({ seed, line }: { seed: number; line: string }) {
  const r = random(seed)
  const nodes: ReactNode[] = []
  for (let k = 0; k < 11; k += 1) {
    nodes.push(
      <path
        key={`w${k}`}
        d={`M220 ${40 + k * 18} C 280 ${n(10 + k * 18 + r() * 30)}, 340 ${n(80 + k * 16 - r() * 40)}, 410 ${30 + k * 19}`}
        fill="none"
        stroke={`url(#${line})`}
        strokeWidth={(0.6 + r() * 0.9).toFixed(2)}
        opacity={(0.25 + r() * 0.45).toFixed(2)}
      />,
    )
  }
  const points = Array.from({ length: 9 }, () => [n(260 + r() * 140), n(30 + r() * 150)] as const)
  nodes.push(
    <polyline key="pl" points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#e6e8ee" strokeWidth="0.6" opacity="0.45" />,
  )
  points.forEach(([x, y], k) => {
    nodes.push(
      <circle key={`s${k}`} cx={x} cy={y} r="2.2" fill="#f0d9a0" />,
      <circle key={`h${k}`} cx={x} cy={y} r="6" fill="#f0d9a0" opacity="0.15" />,
    )
  })
  nodes.push(<circle key="o" cx="330" cy="100" r="54" fill="none" stroke="#d6b878" strokeWidth="0.8" opacity="0.4" />)
  return <>{nodes}</>
}

type GeneratedCoverProps = {
  area: string
  title: string
  year?: number
  seed: string
  institution?: string
  /** plate: tarjeta · hero: portada grande de la ficha · thumb: miniatura sin texto */
  variant?: 'plate' | 'hero' | 'thumb'
  /** Si el título ya está al lado (tarjeta), la portada puede omitirlo. */
  showText?: boolean
  className?: string
}

export function GeneratedCover({
  area,
  title,
  year,
  seed,
  institution,
  variant = 'plate',
  showText = true,
  className,
}: GeneratedCoverProps) {
  const uid = useId().replace(/:/g, '')
  const line = `gc-line-${uid}`
  const fill = `gc-fill-${uid}`
  const pattern = patternForArea(area)
  const value = seedFrom(seed)
  const withText = showText && variant !== 'thumb'

  return (
    <span
      className={cn('generated-cover', `is-${variant}`, `is-${pattern}`, className)}
      role="img"
      aria-label={`Portada generada de ${title}`}
    >
      <svg className="generated-cover-art" viewBox="0 0 400 260" preserveAspectRatio="xMaxYMid slice" aria-hidden focusable="false">
        <defs>
          <linearGradient id={line} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f0d9a0" />
            <stop offset="1" stopColor="#b8975a" />
          </linearGradient>
          <linearGradient id={fill} x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#d6b878" stopOpacity="0.05" />
            <stop offset="1" stopColor="#f0d9a0" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        {pattern === 'circuito' ? <Circuit seed={value} line={line} /> : null}
        {pattern === 'botanica' ? <Leaf seed={value} fill={fill} /> : null}
        {pattern === 'ondas' ? <Waves seed={value} line={line} /> : null}
      </svg>
      <span className="generated-cover-veil" aria-hidden />
      <span className="generated-cover-frame" aria-hidden />
      <span className="generated-cover-mark" aria-hidden>
        <LegacyName />
      </span>
      {withText ? (
        <span className="generated-cover-text" aria-hidden>
          <span className="generated-cover-area">{area}</span>
          <span className="generated-cover-title">{title}</span>
          {year || institution ? (
            <span className="generated-cover-foot">
              {[year, institution].filter(Boolean).join(' · ')}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
