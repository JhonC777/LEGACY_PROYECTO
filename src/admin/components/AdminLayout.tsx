import { useEffect, useState, type ReactNode } from 'react'
import '@/styles/admin.css'
import { createPortal } from 'react-dom'
import {
  ChevronRight,
  CloudUpload,
  ExternalLink,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { LegacyWordmark } from '@/components/brand/LegacyWordmark'
import { cn } from '@/lib/cn'
import { useAdminSession } from '../session'
import { useAdminStore } from '../store'
import { useToast } from '../toast'
import { LivingField } from '@/components/atmosphere/LivingField'
import { ConfirmDialog } from './ConfirmDialog'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
  group: 'archivo' | 'institucion'
}

const NAV_GROUPS: { id: NavItem['group']; label: string }[] = [
  { id: 'archivo', label: 'Archivo' },
  { id: 'institucion', label: 'Institución' },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const { institution, projects, settings, status, media } = useAdminStore()
  const { session, signOut } = useAdminSession()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const onError = (event: Event) => {
      const message = (event as CustomEvent<string>).detail
      if (!message) return
      notify({ tone: 'error', title: 'Archivo remoto', description: message })
    }
    window.addEventListener('legacy-remote-error', onError)
    return () => window.removeEventListener('legacy-remote-error', onError)
  }, [notify])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const base = `/admin/${institution.slug}`
  const drafts = projects.filter((project) => project.status === 'draft').length
  const uploading = media.filter((asset) => asset.status === 'uploading').length

  const nav: NavItem[] = [
    { to: base, label: 'Resumen', icon: LayoutDashboard, end: true, group: 'archivo' },
    { to: `${base}/proyectos`, label: 'Proyectos', icon: FolderKanban, badge: drafts, group: 'archivo' },
    { to: `${base}/cargas`, label: 'Cargas', icon: CloudUpload, badge: uploading, group: 'archivo' },
    { to: `${base}/historial`, label: 'Historial', icon: History, group: 'institucion' },
    { to: `${base}/ajustes`, label: 'Ajustes', icon: Settings, group: 'institucion' },
  ]
  const isEditor = /\/proyectos\/[^/]+$/.test(location.pathname)

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
        <LegacyMark size="sm" />
        <span className="min-w-0 leading-tight">
          <LegacyWordmark className="block text-lg" />
          <span className="admin-brand-sub">Panel institucional</span>
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
          <span className="block text-xs text-legacy-muted">Solo tu institución</span>
        </span>
      </div>

      <Link to={`${base}/proyectos/nuevo`} className="btn btn-primary btn-md admin-sidebar-cta">
        <Plus className="h-4 w-4" aria-hidden />
        Nuevo proyecto
      </Link>

      <nav className="admin-nav flex flex-1 flex-col" aria-label="Secciones del panel">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="admin-nav-group">
            <p className="admin-nav-heading">{group.label}</p>
            {nav
              .filter((item) => item.group === group.id)
              .map(({ to, label, icon: Icon, end, badge }) => (
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
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer mt-auto flex flex-col">
        <div className="admin-sidebar-user" title={session?.email}>
          <span className="admin-user-avatar" aria-hidden>
            {(session?.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-legacy-white">
              {session?.name ?? 'Administrador'}
            </span>
            <span className="block truncate text-xs text-legacy-muted">{session?.email}</span>
          </span>
        </div>
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

  const drawer =
    drawerOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="admin-drawer"
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
            <aside className="admin-sidebar admin-sidebar-drawer">
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
          </div>,
          document.body,
        )
      : null

  return (
    <div className="admin-shell" data-status={status}>
      <LivingField variant="page" />
      <aside className="admin-sidebar">{sidebar}</aside>

      {drawer}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle btn btn-ghost btn-sm"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-4 w-4" aria-hidden />
            <span className="sr-only">Abrir menú</span>
          </button>

          <nav className="admin-crumbs" aria-label="Ruta">
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
            <span className="admin-user" title={session?.email}>
              <span className="admin-user-avatar" aria-hidden>
                {(session?.name ?? 'A').charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 md:block">
                <span className="block truncate text-xs font-semibold text-legacy-white">
                  {session?.name}
                </span>
                <span className="block truncate text-xs text-legacy-muted">
                  Administrador
                </span>
              </span>
            </span>
          </div>
        </header>

        <main id="contenido" className={cn('admin-content', isEditor && 'is-editor')}>
          <div className="admin-content-inner">
            {children}
          </div>
        </main>
      </div>

      {!isEditor ? (
        <nav className="admin-tabbar" aria-label="Navegación rápida del panel">
          <NavLink to={base} end className={({ isActive }) => cn('admin-tab', isActive && 'is-active')}>
            <LayoutDashboard className="h-5 w-5" aria-hidden />
            <span>Resumen</span>
          </NavLink>
          <NavLink to={`${base}/proyectos`} end className={({ isActive }) => cn('admin-tab', isActive && 'is-active')}>
            <FolderKanban className="h-5 w-5" aria-hidden />
            <span>Proyectos</span>
            {drafts ? <span className="admin-tab-badge">{drafts}</span> : null}
          </NavLink>
          <Link to={`${base}/proyectos/nuevo`} className="admin-tab admin-tab-new" aria-label="Nuevo proyecto">
            <span className="admin-tab-new-orb">
              <Plus className="h-5 w-5" aria-hidden />
            </span>
            <span>Nuevo</span>
          </Link>
          <NavLink to={`${base}/cargas`} className={({ isActive }) => cn('admin-tab', isActive && 'is-active')}>
            <CloudUpload className="h-5 w-5" aria-hidden />
            <span>Cargas</span>
            {uploading ? <span className="admin-tab-badge">{uploading}</span> : null}
          </NavLink>
          <button
            type="button"
            className="admin-tab"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span>Más</span>
          </button>
        </nav>
      ) : null}

      <ConfirmDialog
        open={confirmSignOut}
        title="¿Cerrar sesión?"
        description="Vas a salir del panel de esta institución."
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
