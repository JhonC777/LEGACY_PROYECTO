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
import { DEMO_PROJECTS } from '@/data/demoData'
import type { MockCategory } from '@/data/mockExplore'

const ICONS = {
  cpu: Cpu,
  flask: FlaskConical,
  palette: Palette,
  users: Users,
  leaf: Leaf,
  book: BookOpen,
}

const ICON_KEYS: MockCategory['icon'][] = [
  'cpu',
  'flask',
  'palette',
  'users',
  'leaf',
  'book',
]

const CATEGORIES = [...new Set(DEMO_PROJECTS.map((project) => project.category))]
  .map((name, index) => ({
    id: `demo-category-${index + 1}`,
    name,
    count: DEMO_PROJECTS.filter((project) => project.category === name).length,
    icon: ICON_KEYS[index % ICON_KEYS.length]!,
  }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))

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
        {CATEGORIES.map((category) => {
          const Icon = ICONS[category.icon]
          return (
            <li key={category.id}>
              <Link
                to={`/proyectos?category=${encodeURIComponent(category.name)}`}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-white/8 hover:bg-explore-panel"
                aria-label={`${category.name}, ${category.count} proyectos demo`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-explore-purple/10 text-explore-purple">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-explore-ink">
                    {category.name}
                  </span>
                  <span className="text-xs text-explore-muted">
                    {category.count}{' '}
                    {category.count === 1 ? 'proyecto demo' : 'proyectos demo'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-explore-muted transition-transform group-hover:translate-x-0.5 group-hover:text-explore-purple" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-explore-muted">
        Clasificación calculada a partir del catálogo de demostración.
      </p>
    </section>
  )
}
