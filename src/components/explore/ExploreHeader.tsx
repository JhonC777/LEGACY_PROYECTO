import { ChevronDown, Search, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GlassInput } from '@/components/ui/GlassInput'
import { cn } from '@/lib/cn'

const NAV = [
  { label: 'Explorar', to: '/proyectos', match: (path: string) => path.startsWith('/proyectos') },
  {
    label: 'Instituciones',
    to: '/explorar#instituciones',
    match: (path: string) => path === '/explorar' || path === '/instituciones',
  },
  { label: 'Categorías', to: '/proyectos', match: () => false },
  { label: 'Destacados', to: '/explorar#proyectos', match: () => false },
  { label: 'Sobre LEGACY', to: '/explorar#mision', match: () => false },
]

export function ExploreHeader() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-3.5 lg:gap-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-legacy-gold/25 bg-legacy-gold/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-legacy-gold" aria-hidden>
              <path
                fill="currentColor"
                d="M4 20h16v-1.5H4V20Zm1.5-3h13l-.75-9H6.25L5.5 17ZM12 4l6.5 3.25-.4 1.35L12 6.2 5.9 8.6l-.4-1.35L12 4Z"
              />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-wide text-legacy-white">
              LEGACY
            </span>
            <span className="hidden text-[10px] text-legacy-muted sm:block">
              Museo Digital del Legado Estudiantil
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Explorar">
          {NAV.map((item) => {
            const active = item.match(location.pathname)
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  'nav-liquid pickup inline-flex items-center gap-1 text-sm font-medium',
                  active
                    ? 'is-active text-legacy-gold'
                    : 'text-legacy-muted hover:text-legacy-gold',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
                {item.label === 'Explorar' ? (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 lg:max-w-md lg:flex-none">
          <form
            className="relative hidden min-w-0 flex-1 md:block lg:w-72"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(
                `/proyectos${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`,
              )
            }}
          >
            <label htmlFor="global-project-search" className="sr-only">
              Buscar
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-legacy-muted" />
            <GlassInput
              id="global-project-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar proyectos, autores, temas..."
              className="liquid-field liquid-touch py-2.5 pr-4 pl-10 text-sm"
            />
          </form>

          <Link to="/admin/login" className="btn btn-secondary btn-sm pickup shrink-0">
            <UserRound className="h-4 w-4" aria-hidden />
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  )
}
