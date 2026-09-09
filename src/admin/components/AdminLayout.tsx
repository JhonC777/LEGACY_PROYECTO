import { useEffect, useState, type ReactNode } from 'react'
import {
  ChevronRight,
  CloudUpload,
  ExternalLink,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { cn } from '@/lib/cn'
import { useAdminSession } from '../session'
import { useAdminStore } from '../store'
import { ConfirmDialog } from './ConfirmDialog'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { institution, projects, settings, status, media } = useAdminStore()
  const { session, signOut } = useAdminSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const base = `/admin/${institution.slug}`
  const drafts = projects.filter((project) => project.status === 'draft').length
  const uploading = media.filter((asset) => asset.status === 'uploading').length

  const nav: NavItem[] = [
    { to: base, label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: `${base}/proyectos`, label: 'Proyectos', icon: FolderKanban, badge: drafts },
    { to: `${base}/cargas`, label: 'Cargas', icon: CloudUpload, badge: uploading },
    { to: `${base}/historial`, label: 'Historial', icon: History },
    { to: `${base}/ajustes`, label: 'Ajustes', icon: Settings },
  ]

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const handleSignOut = () => {
    signOut()
    navigate('/', { replace: true })
  }

  const crumbs = getCrumbs(location.pathname, base)

  const sidebar = (
    <>
      <Link to="/" className="admin-brand flex items-center gap-2.5" aria-label="Ir al inicio de LEGACY">
        <span className="legacy-brand-mark" aria-hidden>
          <span>L</span>
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block font-display text-lg font-semibold tracking-wide text-legacy-white">
            LEGACY
          </span>
          <span className="block text-[10px] text-legacy-muted">Panel institucional</span>
        </span>
      </Link>

      <div className="admin-institution flex items-center gap-2.5">
        <InstitutionLogo
          name={settings.name}
          logoUrl={settings.logoUrl}
          fallback={settings.shortName}
          accent={settings.accent}
          decorative
          className="h-10 w-10 rounded-xl text-xs font-bold text-white"
          imageClassName="rounded-lg bg-white/95 p-1"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-legacy-white">
            {settings.name}
          </span>
          <span className="block text-[11px] text-legacy-muted">Solo tu institución</span>
        </span>
      </div>

      <nav className="admin-nav flex flex-1 flex-col gap-0.5" aria-label="Secciones del panel">
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('admin-nav-link flex items-center gap-2.5', isActive && 'is-active')
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {badge ? <span className="admin-nav-badge">{badge}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer mt-auto flex flex-col">
        <p className="admin-demo-note">
          Datos de demostración. Los cambios viven en esta sesión y no se envían a ningún
          servidor.
        </p>
        <Link
          to={`/instituciones/${institution.slug}`}
          className="admin-nav-link flex items-center gap-2.5"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">Ver sitio público</span>
        </Link>
        <button
          type="button"
          className="admin-nav-link flex w-full items-center gap-2.5 text-left"
          onClick={() => setConfirmSignOut(true)}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">Cerrar sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <div
      className="admin-shell grid h-dvh w-full max-w-full grid-cols-1 overflow-hidden lg:grid-cols-[264px_minmax(0,1fr)]"
      data-status={status}
    >
      <aside className="admin-sidebar hidden h-full min-h-0 flex-col overflow-y-auto lg:flex">
        {sidebar}
      </aside>

      {drawerOpen ? (
        <div
          className="admin-drawer fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú del panel"
        >
          <button
            type="button"
            className="admin-drawer-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="admin-sidebar admin-sidebar-drawer flex h-full flex-col overflow-y-auto">
            <button
              type="button"
              className="btn btn-ghost btn-sm absolute top-3 right-3"
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="admin-main flex min-h-0 min-w-0 flex-col">
        <header className="admin-topbar flex min-h-[3.75rem] items-center gap-3">
          <button
            type="button"
            className="admin-menu-toggle btn btn-ghost btn-sm lg:hidden"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-4 w-4" aria-hidden />
            <span className="sr-only">Abrir menú</span>
          </button>

          <nav className="admin-crumbs flex min-w-0 items-center gap-1.5 overflow-hidden" aria-label="Ruta">
            <Link to={base} className="admin-crumb">
              {settings.shortName}
            </Link>
            {crumbs.map((crumb, index) => (
              <span key={crumb.href} className="contents">
                <ChevronRight className="h-3 w-3 shrink-0 text-white/30" aria-hidden />
                {index === crumbs.length - 1 ? (
                  <span className="admin-crumb is-current">{crumb.label}</span>
                ) : (
                  <Link to={crumb.href} className="admin-crumb">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="header-demo-pill hidden sm:inline-flex">Demo</span>
            <span className="admin-user" title={session?.email}>
              <span className="admin-user-avatar" aria-hidden>
                {(session?.name ?? 'A').charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 md:block">
                <span className="block truncate text-xs font-semibold text-legacy-white">
                  {session?.name}
                </span>
                <span className="block truncate text-[10px] text-legacy-muted">
                  Administrador
                </span>
              </span>
            </span>
          </div>
        </header>

        <main id="contenido" className="admin-content min-h-0 flex-1 overflow-y-auto">
          <div className="admin-content-inner mx-auto w-full max-w-[1240px] px-4 py-6 pb-16 lg:px-7 lg:pt-8 lg:pb-20">
            {children}
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="¿Cerrar sesión?"
        description="Los cambios de esta demo viven solo en la sesión actual y se perderán al salir."
        confirmLabel="Cerrar sesión"
        icon={LogOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}

function getCrumbs(pathname: string, base: string) {
  const rest = pathname.slice(base.length).split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  const labels: Record<string, string> = {
    proyectos: 'Proyectos',
    cargas: 'Cargas',
    historial: 'Historial',
    ajustes: 'Ajustes',
    nuevo: 'Nuevo proyecto',
  }
  let href = base
  rest.forEach((segment, index) => {
    href += `/${segment}`
    const label =
      labels[segment] ?? (rest[index - 1] === 'proyectos' ? 'Editar proyecto' : segment)
    crumbs.push({ label, href })
  })
  return crumbs
}
