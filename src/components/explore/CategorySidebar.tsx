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
import { PILOT_CATALOG_PATH } from '@/data/demoData'
import { MOCK_CATEGORIES } from '@/data/mockExplore'
import { subjectTagStyle } from '@/lib/subjectTags'

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
    <section id="categorias" className="explore-card legacy-category-card rounded-2xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-brand text-xl font-semibold text-legacy-white">
          Explora por categoría
        </h2>
        <Link
          to={PILOT_CATALOG_PATH}
          className="text-sm font-semibold text-legacy-gold hover:opacity-80"
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
                to={`${PILOT_CATALOG_PATH}?category=${encodeURIComponent(category.name)}`}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.035]"
                aria-label={`${category.name}, ${category.count} ${category.count === 1 ? 'proyecto' : 'proyectos'}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]" style={subjectTagStyle(category.name)}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-legacy-white">
                    {category.name}
                  </span>
                  <span className="text-xs text-legacy-grey">
                    {category.count}{' '}
                    {category.count === 1 ? 'proyecto' : 'proyectos'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-legacy-grey transition-transform group-hover:translate-x-0.5 group-hover:text-legacy-gold" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-legacy-grey">
        Clasificación del archivo publicado.
      </p>
    </section>
  )
}
