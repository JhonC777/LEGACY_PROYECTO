import {
  BookOpen,
  ChevronRight,
  Cpu,
  FlaskConical,
  Leaf,
  Palette,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MOCK_CATEGORIES } from '@/data/mockExplore'

const ICONS = {
  cpu: Cpu,
  flask: FlaskConical,
  palette: Palette,
  users: Users,
  leaf: Leaf,
  book: BookOpen,
}

export function CategorySidebar() {
  return (
    <section id="categorias" className="explore-card rounded-2xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-explore-ink">
          Explora por categoría
        </h2>
        <Link
          to="/proyectos"
          className="text-sm font-semibold text-explore-purple hover:opacity-80"
        >
          Ver todas →
        </Link>
      </div>

      <ul className="space-y-1.5">
        {MOCK_CATEGORIES.map((category) => {
          const Icon = ICONS[category.icon]
          return (
            <li key={category.id}>
              <Link
                to={`/proyectos?category=${encodeURIComponent(category.name)}`}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-explore-panel"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-explore-purple/10 text-explore-purple">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-explore-ink">
                    {category.name}
                  </span>
                  <span className="text-xs font-semibold text-explore-purple">
                    {category.count} proyectos
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-explore-muted" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
