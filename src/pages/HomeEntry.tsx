import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AccessModeDialog } from '@/components/entry/AccessModeDialog'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { EntryMessage } from '@/components/entry/EntryMessage'
import { HomeFeaturedRail } from '@/components/entry/HomeFeaturedRail'
import { HomePurpose } from '@/components/entry/HomePurpose'
import { InstitutionSelector } from '@/components/entry/InstitutionSelector'
import { LegacyBrand } from '@/components/entry/LegacyBrand'
import { LegacyIntro } from '@/components/entry/LegacyIntro'
import {
  getPublishedFeaturedProjects,
  getPublishedProjectCountBySlug,
} from '@/data/demoData'
import { useAuraPlayback } from '@/lib/useAuraPlayback'
import { useCosmicParallax } from '@/lib/useCosmicParallax'
import { isActMode, markIntroSeen, shouldPlayIntro } from '@/lib/introSession'
import {
  MOCK_INSTITUTIONS,
  type Institution,
} from '@/data/mockInstitutions'
import { cn } from '@/lib/cn'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'nearest',
  })
}

export function HomeEntry() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Institution | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const ceremonial = isActMode()
  const [introOpen, setIntroOpen] = useState(() => shouldPlayIntro())
  const awakened = !introOpen
  const { live } = useAuraPlayback()
  const shellRef = useRef<HTMLElement>(null)
  useCosmicParallax(shellRef, live && awakened)

  const featured = useMemo(() => getPublishedFeaturedProjects(3), [])
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const institution of MOCK_INSTITUTIONS) {
      const count = getPublishedProjectCountBySlug(institution.slug)
      if (count > 0) counts[institution.slug] = count
    }
    return counts
  }, [])

  const finishIntro = useCallback(() => {
    markIntroSeen()
    setIntroOpen(false)
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

  return (
    <main
      ref={shellRef}
      className={cn('app-shell home-entry relative', awakened && 'is-awakened')}
    >
      <CosmicBackground />

      <div className="home-chamber relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
        <div className="home-chamber-ornament" aria-hidden>
          <span className="home-chamber-corner is-tl" />
          <span className="home-chamber-corner is-tr" />
          <span className="home-chamber-corner is-bl" />
          <span className="home-chamber-corner is-br" />
        </div>

        <header className="home-product-bar">
          <p className="home-product-mark">LEGACY</p>
          <nav className="home-product-nav" aria-label="Home">
            <button type="button" onClick={() => scrollToId('home-instituciones')}>
              Instituciones
            </button>
            {featured.length > 0 ? (
              <button type="button" onClick={() => scrollToId('home-fragmentos')}>
                Fragmentos
              </button>
            ) : null}
            <button type="button" onClick={handleExploreAll}>
              Explorar
            </button>
          </nav>
        </header>

        <div className="home-entry-stage relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="home-entry-frame mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-6 px-5 py-3 sm:px-8 sm:py-4 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(8rem,1fr)_minmax(21rem,26.5rem)] lg:items-center lg:gap-8 lg:px-10 lg:py-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(10rem,1fr)_minmax(22rem,27.5rem)] xl:gap-10 xl:px-14">
            <section className="home-entry-voice shrink-0">
              <LegacyBrand align="start" awakened={awakened} />
              <EntryMessage
                align="start"
                awakened={awakened}
                actions={
                  <>
                    <button
                      type="button"
                      className="home-cta is-primary"
                      onClick={() => scrollToId('home-instituciones')}
                    >
                      Explorar instituciones
                    </button>
                    {featured.length > 0 ? (
                      <button
                        type="button"
                        className="home-cta is-ghost"
                        onClick={() => scrollToId('home-fragmentos')}
                      >
                        Ver fragmentos
                      </button>
                    ) : null}
                  </>
                }
              />
              <HomePurpose awakened={awakened} />
            </section>

            <div className="home-entry-void hidden lg:flex" aria-hidden>
              <p className="home-void-caption">
                Cada institución abre un espacio dentro del archivo.
              </p>
            </div>

            <section
              id="home-instituciones"
              className="home-entry-threshold flex min-h-0 flex-1 flex-col justify-center scroll-mt-4"
            >
              <InstitutionSelector
                institutions={MOCK_INSTITUTIONS}
                onSelect={handleSelect}
                onExploreAll={handleExploreAll}
                awakened={awakened}
                projectCounts={projectCounts}
              />
            </section>
          </div>

          <HomeFeaturedRail
            projects={featured}
            awakened={awakened}
            onExploreCatalog={handleExploreAll}
          />
        </div>

        <footer className="home-chamber-foot">
          <span>Una institución hoy</span>
          <span className="home-chamber-rail-diamond" aria-hidden />
          <span>El archivo crece con cada casa</span>
        </footer>
      </div>

      <AnimatePresence>
        {introOpen ? (
          <LegacyIntro
            key="legacy-intro"
            ceremonial={ceremonial}
            onDone={finishIntro}
          />
        ) : null}
      </AnimatePresence>

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
