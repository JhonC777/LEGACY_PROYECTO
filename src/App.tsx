import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RouteScrollManager } from '@/components/navigation/RouteScrollManager'
import { RouteFallback } from '@/components/navigation/RouteFallback'
import { GlassButtonEffects } from '@/components/ui/GlassButtonEffects'
import { AdminSessionProvider } from '@/admin/session'
import { ExploreHome } from '@/pages/ExploreHome'
import { HomeEntry } from '@/pages/HomeEntry'
import { InstitutionHome } from '@/pages/InstitutionHome'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { ProjectsPage } from '@/pages/ProjectsPage'

/* El panel institucional solo lo usan administradores: se descarga bajo demanda. */
const RequireAdmin = lazy(() =>
  import('@/admin/RequireAdmin').then((m) => ({ default: m.RequireAdmin })),
)
const AdminLogin = lazy(() =>
  import('@/pages/AdminLogin').then((m) => ({ default: m.AdminLogin })),
)
const AdminDashboard = lazy(() =>
  import('@/admin/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const AdminProjects = lazy(() =>
  import('@/admin/pages/AdminProjects').then((m) => ({ default: m.AdminProjects })),
)
const AdminProjectEditor = lazy(() =>
  import('@/admin/pages/AdminProjectEditor').then((m) => ({
    default: m.AdminProjectEditor,
  })),
)
const AdminUploads = lazy(() =>
  import('@/admin/pages/AdminUploads').then((m) => ({ default: m.AdminUploads })),
)
const AdminHistory = lazy(() =>
  import('@/admin/pages/AdminHistory').then((m) => ({ default: m.AdminHistory })),
)
const AdminSettings = lazy(() =>
  import('@/admin/pages/AdminSettings').then((m) => ({ default: m.AdminSettings })),
)

export default function App() {
  return (
    <BrowserRouter>
      <AdminSessionProvider>
        <RouteScrollManager />
        <GlassButtonEffects />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomeEntry />} />
            <Route path="/explorar" element={<ExploreHome />} />
            <Route path="/instituciones" element={<ExploreHome />} />
            <Route path="/proyectos" element={<ProjectsPage />} />
            <Route
              path="/instituciones/:institutionSlug/proyectos/:projectSlug"
              element={<ProjectDetail />}
            />
            <Route
              path="/instituciones/:institutionSlug/proyectos"
              element={<ProjectsPage />}
            />
            <Route
              path="/instituciones/:institutionSlug"
              element={<InstitutionHome />}
            />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/:institutionSlug" element={<RequireAdmin />}>
              <Route index element={<AdminDashboard />} />
              <Route path="proyectos" element={<AdminProjects />} />
              <Route path="proyectos/nuevo" element={<AdminProjectEditor />} />
              <Route path="proyectos/:projectId" element={<AdminProjectEditor />} />
              <Route path="cargas" element={<AdminUploads />} />
              <Route path="historial" element={<AdminHistory />} />
              <Route path="ajustes" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AdminSessionProvider>
    </BrowserRouter>
  )
}
