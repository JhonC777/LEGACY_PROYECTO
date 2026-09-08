import { useState } from 'react'
import { Home, Menu, Search, UserRound, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { GlassInput } from '@/components/ui/GlassInput'
import { cn } from '@/lib/cn'
import type { DemoInstitution } from '@/data/demoData'

type PublicHeaderProps = {
  institution?: DemoInstitution
  search?: string
  onSearchChange?: (value: string) => void
}

function navClass(active: boolean) {
  return cn(
    'nav-liquid text-sm font-medium',
    active ? 'is-active text-legacy-gold' : 'text-legacy-muted hover:text-legacy-gold',
  )
}

export function PublicHeader({
  institution,
  search,
  onSearchChange,
}: PublicHeaderProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const institutionBase = institution
    ? `/instituciones/${institution.slug}`
    : '/explorar'
  const projectsHref = institution
    ? `/instituciones/${institution.slug}/proyectos`
    : '/proyectos'

  const onInstitutionView =
    Boolean(institution) && location.pathname === institutionBase
  const onProjectsView = institution
    ? location.pathname.startsWith(`${institutionBase}/proyectos`)
    : location.pathname === '/proyectos' ||
      location.pathname.startsWith('/proyectos/')

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-legacy-gold"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-legacy-gold/25 bg-legacy-gold/10 text-legacy-gold">
            <Home className="h-4 w-4" aria-hidden />
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

        {institution ? (
          <Link
            to={institutionBase}
            className={cn(
              'hidden min-w-0 max-w-[11rem] items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold lg:inline-flex',
              onInstitutionView
                ? 'border-legacy-gold/40 bg-legacy-gold/10 text-legacy-gold'
                : 'border-white/10 bg-white/[0.04] text-legacy-white hover:border-legacy-gold/35 hover:text-legacy-gold',
            )}
            title={institution.name}
            aria-current={onInstitutionView ? 'page' : undefined}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: institution.accent }}
            >
              {institution.shortName}
            </span>
            <span className="truncate">{institution.name}</span>
          </Link>
        ) : null}

        <nav
          className="ml-auto hidden items-center gap-5 md:flex"
          aria-label="Secciones"
        >
          <NavLink
            to={institutionBase}
            end
            className={navClass(onInstitutionView)}
            aria-current={onInstitutionView ? 'page' : undefined}
          >
            Institución
          </NavLink>
          <NavLink
            to={projectsHref}
            className={navClass(onProjectsView)}
            aria-current={onProjectsView ? 'page' : undefined}
          >
            Proyectos
          </NavLink>
          <Link
            to="/"
            className="nav-liquid text-sm font-medium text-legacy-muted hover:text-legacy-gold"
          >
            Cambiar institución
          </Link>
        </nav>

        {onSearchChange ? (
          <label className="relative hidden min-w-0 flex-1 xl:block xl:max-w-[240px]">
            <span className="sr-only">Buscar proyectos</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-legacy-muted" />
            <GlassInput
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar..."
              className="liquid-field py-2.5 pr-4 pl-10 text-sm"
            />
          </label>
        ) : null}

        <Link
          to={`/admin/login${institution ? `?institution=${institution.slug}` : ''}`}
          className="btn btn-secondary btn-sm shrink-0"
          title="Administrador (próximamente)"
        >
          <UserRound className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Administrador</span>
        </Link>

        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="public-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="h-4 w-4" aria-hidden />
          ) : (
            <Menu className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">Menú</span>
        </button>
      </div>

      {menuOpen ? (
        <div
          id="public-mobile-nav"
          className="border-t border-white/10 px-4 py-3 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Secciones móviles">
            <Link
              to={institutionBase}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium',
                onInstitutionView
                  ? 'bg-legacy-gold/10 text-legacy-gold'
                  : 'text-legacy-muted',
              )}
              onClick={() => setMenuOpen(false)}
            >
              Institución
            </Link>
            <Link
              to={projectsHref}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium',
                onProjectsView
                  ? 'bg-legacy-gold/10 text-legacy-gold'
                  : 'text-legacy-muted',
              )}
              onClick={() => setMenuOpen(false)}
            >
              Proyectos
            </Link>
            <Link
              to="/"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-legacy-muted"
              onClick={() => setMenuOpen(false)}
            >
              Cambiar institución
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
