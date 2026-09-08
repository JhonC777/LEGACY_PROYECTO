import { CalendarDays, FolderKanban, LayoutGrid, Users } from 'lucide-react'
import { MOCK_STATS } from '@/data/mockExplore'

const ICONS = {
  folder: FolderKanban,
  users: Users,
  grid: LayoutGrid,
  calendar: CalendarDays,
}

export function StatsBar() {
  return (
    <section className="px-6 py-4 lg:px-8">
      <div className="explore-stat-bar mx-auto grid max-w-[1200px] gap-4 rounded-2xl px-4 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-2 lg:py-6">
        {MOCK_STATS.map((stat, index) => {
          const Icon = ICONS[stat.icon]
          return (
            <div
              key={stat.id}
              className={`flex items-start gap-3 px-3 lg:px-5 ${
                index < MOCK_STATS.length - 1 ? 'lg:border-r lg:border-explore-purple/15' : ''
              }`}
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-explore-purple/10 text-explore-purple">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold text-explore-ink lg:text-[1.65rem]">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-explore-ink/80">{stat.label}</p>
                <p className="text-xs text-explore-muted">{stat.hint}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
