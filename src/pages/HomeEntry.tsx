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
  getPublishedFeaturedProjects,
  getPublishedProjectCountBySlug,
} from '@/data/demoData'
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

  const featured = useMemo(() => getPublishedFeaturedProjects(3), [])
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const institution of MOCK_INSTITUTIONS) {
      const count = getPublishedProjectCountBySlug(institution.slug)
      if (count > 0) counts[institution.slug] = count
    }
    return counts
  }, [])

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
          <div className="home-entry-act mx-auto flex w-full max-w-[88rem] flex-col gap-10 px-5 py-6 sm:px-8 sm:py-7 lg:grid lg:min-h-full lg:grid-cols-[minmax(0,1.15fr)_minmax(21rem,25.5rem)] lg:items-center lg:gap-16 lg:px-12 lg:py-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,26.5rem)] xl:gap-24 xl:px-16">
            <section className="home-entry-voice shrink-0">
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
              className="home-entry-threshold flex min-h-0 flex-1 flex-col justify-center"
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

          <div className="home-entry-after mx-auto w-full max-w-[88rem] px-5 pb-8 sm:px-8 lg:px-12 xl:px-16">
            <HomePurpose awakened quiet />
            <HomeFeaturedRail
              projects={featured}
              awakened
              onExploreCatalog={handleExploreAll}
            />
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
