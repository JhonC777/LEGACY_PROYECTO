import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RouteScrollManager } from '@/components/navigation/RouteScrollManager'
import { GlassButtonEffects } from '@/components/ui/GlassButtonEffects'
import { AdminLogin } from '@/pages/AdminLogin'
import { ExploreHome } from '@/pages/ExploreHome'
import { HomeEntry } from '@/pages/HomeEntry'
import { InstitutionHome } from '@/pages/InstitutionHome'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { ProjectsPage } from '@/pages/ProjectsPage'

export default function App() {
  return (
    <BrowserRouter>
      <RouteScrollManager />
      <GlassButtonEffects />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
