import { CategorySidebar } from '@/components/explore/CategorySidebar'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { ExploreHeader } from '@/components/explore/ExploreHeader'
import { ExploreHero } from '@/components/explore/ExploreHero'
import { FeaturedProjects } from '@/components/explore/FeaturedProjects'
import { InstitutionsSection } from '@/components/explore/InstitutionsSection'
import { LegacyTimeline } from '@/components/explore/LegacyTimeline'
import { MissionCard } from '@/components/explore/MissionCard'
import { StatsBar } from '@/components/explore/StatsBar'

/** Vista pública post-Home — réplica del mockup claro de LEGACY (datos MOCK). */
export function ExploreHome() {
  return (
    <div className="explore-shell">
      <ExploreHeader />
      <ExploreHero />
      <StatsBar />

      <div className="mx-auto max-w-[1200px] px-6 py-6 lg:px-8 lg:py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.85fr)] lg:gap-8">
          <div className="min-w-0">
            <FeaturedProjects />
            <LegacyTimeline />
          </div>
          <div>
            <CategorySidebar />
            <MissionCard />
          </div>
        </div>

        <InstitutionsSection />
      </div>

      <ExploreFooter />
    </div>
  )
}
