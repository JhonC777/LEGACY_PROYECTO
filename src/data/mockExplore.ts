/**
 * Adaptadores de presentación para el Home claro.
 * La fuente única de contenido está en demoData.ts y será reemplazada por Supabase.
 */
import { DEMO_INSTITUTIONS, DEMO_PROJECTS } from './demoData'

export type MockProject = {
  id: string
  title: string
  badge: string
  category: string
  authors: string
  year: number
  imageUrl: string
}

export type MockCategory = {
  id: string
  name: string
  count: number
  icon: 'cpu' | 'flask' | 'palette' | 'users' | 'leaf' | 'book'
}

export type MockInstitutionCard = {
  id: string
  name: string
  slug: string
  location: string
  projectsLabel: string
  yearsLabel: string
  variant: 'active' | 'demo' | 'locked'
  logoLabel: string
  logoColor: string
}

const uniqueCategories = new Set(DEMO_PROJECTS.map((project) => project.category))
const uniqueYears = [...new Set(DEMO_PROJECTS.map((project) => project.year))].sort()

export const MOCK_STATS = [
  {
    id: 'projects',
    value: String(DEMO_PROJECTS.length),
    label: 'Proyectos publicados',
    hint: 'Contenido de demostración',
    icon: 'folder' as const,
  },
  {
    id: 'students',
    value: String(
      new Set(DEMO_PROJECTS.flatMap((project) => project.authors.map((author) => author.id)))
        .size,
    ),
    label: 'Participantes demo',
    hint: `En ${DEMO_INSTITUTIONS.length} instituciones demo`,
    icon: 'users' as const,
  },
  {
    id: 'categories',
    value: String(uniqueCategories.size),
    label: 'Categorías',
    hint: 'Clasificación demostrativa',
    icon: 'grid' as const,
  },
  {
    id: 'years',
    value:
      uniqueYears.length > 0
        ? `${uniqueYears[0]} – ${uniqueYears[uniqueYears.length - 1]}`
        : '—',
    label: 'Años de legado',
    hint: 'Periodo de demostración',
    icon: 'calendar' as const,
  },
]

export const MOCK_FEATURED_PROJECTS: MockProject[] = DEMO_PROJECTS.filter(
  (project) => project.isFeatured,
)
  .slice(0, 4)
  .map((project) => ({
    id: project.id,
    title: project.title,
    badge: 'Proyecto demo',
    category: project.category,
    authors: project.authors.map((author) => author.name).join(', '),
    year: project.year,
    imageUrl: project.coverImage,
  }))

const CATEGORY_ICONS: MockCategory['icon'][] = [
  'cpu',
  'flask',
  'palette',
  'users',
  'leaf',
  'book',
]

export const MOCK_CATEGORIES: MockCategory[] = [...uniqueCategories].map(
  (name, index) => ({
    id: `demo-category-${index + 1}`,
    name,
    count: DEMO_PROJECTS.filter((project) => project.category === name).length,
    icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length]!,
  }),
)

export const MOCK_INSTITUTION_CARDS: MockInstitutionCard[] = [
  ...DEMO_INSTITUTIONS.map((institution, index) => ({
    id: institution.id,
    name: institution.name,
    slug: institution.slug,
    location: 'Contenido de demostración',
    projectsLabel: `${DEMO_PROJECTS.filter((project) => project.institutionId === institution.id).length} proyectos demo`,
    yearsLabel: 'Datos no oficiales',
    variant: (index === 1 ? 'demo' : 'active') as 'active' | 'demo',
    logoLabel: institution.shortName,
    logoColor: institution.accent,
  })),
  {
    id: 'i3',
    name: 'Institución 3',
    slug: 'institucion-3',
    location: 'Próximamente',
    projectsLabel: '—',
    yearsLabel: '—',
    variant: 'locked',
    logoLabel: 'I3',
    logoColor: '#9ca3af',
  },
  {
    id: 'i4',
    name: 'Institución 4',
    slug: 'institucion-4',
    location: 'Muy pronto',
    projectsLabel: '—',
    yearsLabel: '—',
    variant: 'locked',
    logoLabel: 'I4',
    logoColor: '#9ca3af',
  },
]

export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80'
