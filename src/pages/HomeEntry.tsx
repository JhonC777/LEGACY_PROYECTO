import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccessModeDialog } from '@/components/entry/AccessModeDialog'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { EntryMessage } from '@/components/entry/EntryMessage'
import { HomeFeaturedRail } from '@/components/entry/HomeFeaturedRail'
import { HomePurpose } from '@/components/entry/HomePurpose'
import { InstitutionSelector } from '@/components/entry/InstitutionSelector'
import { LegacyBrand } from '@/components/entry/LegacyBrand'
import {
  resolveInstitutionProjects,
  useArchiveRevision,
} from '@/admin/archiveBridge'
import { getInstitutionBySlug } from '@/data/demoData'
import { useAuraPlayback } from '@/lib/useAuraPlayback'
import { useCosmicParallax } from '@/lib/useCosmicParallax'
import {
  MOCK_INSTITUTIONS,
  type Institution,
} from '@/data/mockInstitutions'
import { cn } from '@/lib/cn'

export function HomeEntry() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Institution | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { live } = useAuraPlayback()
  const shellRef = useRef<HTMLElement>(null)
  useCosmicParallax(shellRef, live)

  const archiveRevision = useArchiveRevision()
  const featured = useMemo(() => {
    return MOCK_INSTITUTIONS.filter((item) => item.isActive)
      .flatMap((item) => {
        const demo = getInstitutionBySlug(item.slug)
        return demo
          ? resolveInstitutionProjects(demo, true).filter((project) => project.isFeatured)
          : []
      })
      .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, 'es'))
      .slice(0, 3)
  }, [archiveRevision])
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const institution of MOCK_INSTITUTIONS) {
      const demo = getInstitutionBySlug(institution.slug)
      const count = demo ? resolveInstitutionProjects(demo, true).length : 0
      if (count > 0) counts[institution.slug] = count
    }
    return counts
  }, [archiveRevision])

  const handleSelect = (institution: Institution) => {
    if (!institution.isActive) return
    setSelected(institution)
    setDialogOpen(true)
  }

  const handleExploreAll = () => {
    navigate('/explorar')
  }

  const handleGuestAccess = (institution: Institution) => {
    setDialogOpen(false)
    navigate(`/instituciones/${institution.slug}`)
  }

  const handleAdminAccess = (institution: Institution) => {
    setDialogOpen(false)
    navigate(`/admin/login?institution=${institution.slug}`)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main ref={shellRef} className={cn('app-shell home-entry relative is-awakened')}>
      <CosmicBackground />

      <div className="home-chamber relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
        <div className="home-chamber-ornament" aria-hidden>
          <span className="home-chamber-corner is-tl" />
          <span className="home-chamber-corner is-tr" />
          <span className="home-chamber-corner is-bl" />
          <span className="home-chamber-corner is-br" />
        </div>

        <div className="home-entry-stage legacy-hidden-scroll relative flex min-h-0 flex-1 flex-col overflow-x-clip overflow-y-auto">
          <div className="home-entry-board">
            <div className="home-entry-act">
              <section className="home-entry-voice">
                <LegacyBrand align="center" awakened />
                <EntryMessage
                  align="center"
                  awakened
                  actions={
                    <>
                      <button
                        type="button"
                        className="home-cta is-primary"
                        onClick={() => scrollToSection('home-instituciones')}
                      >
                        Explorar instituciones
                      </button>
                      <button
                        type="button"
                        className="home-cta is-ghost"
                        onClick={() => scrollToSection('home-fragmentos')}
                      >
                        Ver fragmentos
                      </button>
                    </>
                  }
                />
              </section>

              <section
                id="home-instituciones"
                className="home-entry-threshold"
              >
                <InstitutionSelector
                  institutions={MOCK_INSTITUTIONS}
                  onSelect={handleSelect}
                  onExploreAll={handleExploreAll}
                  awakened
                  projectCounts={projectCounts}
                />
              </section>
            </div>

            <div className="home-entry-after">
              <HomePurpose awakened quiet />
              <HomeFeaturedRail
                projects={featured}
                awakened
                onExploreCatalog={handleExploreAll}
              />
            </div>
          </div>
        </div>

        <footer className="home-chamber-foot">
          <span>Una institución hoy</span>
          <span className="home-chamber-rail-diamond" aria-hidden />
          <span>El archivo crece con cada casa</span>
        </footer>
      </div>

      <AccessModeDialog
        institution={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onGuestAccess={handleGuestAccess}
        onAdminAccess={handleAdminAccess}
      />
    </main>
  )
}
