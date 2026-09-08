export type Institution = {
  id: string
  name: string
  slug: string
  location: string
  description: string
  primaryColor: string
  isActive: boolean
  isPilot?: boolean
}

/** MOCK — reemplazar por datos reales de Supabase */
export const MOCK_INSTITUTIONS: Institution[] = [
  {
    id: 'mock-feyalegria',
    name: 'Fe y Alegría',
    slug: 'fe-y-alegria',
    location: 'Institución piloto',
    description: 'Legado académico institucional',
    primaryColor: '#d6b878',
    isActive: true,
    isPilot: true,
  },
  {
    id: 'mock-inst-2',
    name: 'Institución 2',
    slug: 'institucion-2',
    location: 'Próximamente',
    description: 'Espacio institucional en preparación',
    primaryColor: '#7662c9',
    isActive: false,
  },
  {
    id: 'mock-inst-3',
    name: 'Institución 3',
    slug: 'institucion-3',
    location: 'Próximamente',
    description: 'Espacio institucional en preparación',
    primaryColor: '#7662c9',
    isActive: false,
  },
  {
    id: 'mock-inst-4',
    name: 'Institución 4',
    slug: 'institucion-4',
    location: 'Próximamente',
    description: 'Espacio institucional en preparación',
    primaryColor: '#7662c9',
    isActive: false,
  },
  {
    id: 'mock-inst-5',
    name: 'Institución 5',
    slug: 'institucion-5',
    location: 'Próximamente',
    description: 'Espacio institucional en preparación',
    primaryColor: '#7662c9',
    isActive: false,
  },
]
