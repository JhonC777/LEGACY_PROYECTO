import { Menu, Search, UserRound, X } from 'lucide-react'
import '@/styles/header.css'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GlassInput } from '@/components/ui/GlassInput'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { LegacyWordmark } from '@/components/brand/LegacyWordmark'
import { withLegacyName } from '@/components/brand/LegacyName'
import {
  MobileNavDrawer,
  usePublishHeaderHeight,
} from '@/components/navigation/MobileNavDrawer'
import { PILOT_CATALOG_PATH } from '@/data/demoData'
import { cn } from '@/lib/cn'

const NAV = [
  { label: 'Explorar', to: PILOT_CATALOG_PATH, match: (path: string) => path.includes('/proyectos') },
  {
    label: 'Instituciones',
    to: '/explorar#instituciones',
    match: (path: string) => path === '/explorar' || path === '/instituciones',
  },
  { label: 'Categorías', to: '/explorar#categorias', match: () => false },
  { label: 'Destacados', to: '/explorar#proyectos', match: () => false },
  { label: 'Sobre LEGACY', to: '/explorar#mision', match: () => false },
]

export function ExploreHeader() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const headerRef = useRef<HTMLElement>(null)
  usePublishHeaderHeight(headerRef)

  const goToSearch = (value: string) => {
    const term = value.trim()
    navigate(term ? `${PILOT_CATALOG_PATH}?q=${encodeURIComponent(term)}` : PILOT_CATALOG_PATH)
    setQuery('')
    setMenuOpen(false)
  }

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    goToSearch(query)
  }

  return (
    <header ref={headerRef} className="glass-header legacy-header sticky top-0 z-40">
      <div className="explore-header-main">
        <Link to="/" className="legacy-brand flex shrink-0 items-center gap-2.5 rounded-xl">
          <LegacyMark size="sm" />
          <span className="leading-tight">
            <LegacyWordmark className="block" />
            <span className="header-brand-sub hidden text-xs text-legacy-muted sm:block">
              Museo Digital del Legado Estudiantil
            </span>
          </span>
        </Link>

        <nav className="explore-header-nav hidden lg:flex" aria-label="Explorar">
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
                {withLegacyName(item.label)}
              </Link>
            )
          })}
        </nav>

        <div className="explore-header-tools">
          <form
            className="relative hidden min-w-0 flex-1 lg:block lg:w-72"
            onSubmit={onSearch}
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
              placeholder="Buscar proyectos, autores..."
              className="liquid-field liquid-touch py-2.5 pr-4 pl-10 text-sm"
            />
          </form>

          <Link to="/admin/login" className="btn btn-secondary btn-sm pickup hidden shrink-0 lg:inline-flex">
            <UserRound className="h-4 w-4" aria-hidden />
            Administrador
          </Link>

          <button
            type="button"
            className="nav-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="explore-mobile-nav"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      <MobileNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        id="explore-mobile-nav"
        label="Navegación"
      >
        <p className="nav-drawer-label">Navegación</p>
        <nav className="flex flex-col gap-2" aria-label="Secciones">
          {NAV.map((item) => {
            const active = item.match(location.pathname)
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn('nav-drawer-link', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {withLegacyName(item.label)}
              </Link>
            )
          })}
        </nav>

        <form role="search" className="nav-drawer-search" onSubmit={onSearch}>
          <Search className="h-4 w-4 shrink-0 text-legacy-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar proyectos, autores..."
            aria-label="Buscar proyectos, autores"
          />
        </form>

        <Link to="/admin/login" className="btn btn-secondary btn-md nav-drawer-admin">
          <UserRound className="h-4 w-4" aria-hidden />
          Administrador
        </Link>
      </MobileNavDrawer>
    </header>
  )
}
