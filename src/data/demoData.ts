export type DemoAuthor = {
  id: string
  name: string
  role: string
}

export type DemoInstitution = {
  id: string
  name: string
  slug: string
  shortName: string
  description: string
  accent: string
  isActive: boolean
  isDemo: boolean
}

export type DemoProject = {
  id: string
  slug: string
  institutionId: string
  title: string
  subtitle: string
  area: string
  category: string
  year: number
  authors: DemoAuthor[]
  description: string
  problem: string
  solution: string
  methodology: string
  results: string
  technologies: string[]
  tags: string[]
  collection?: string
  coverImage: string
  gallery: readonly string[]
  /** Recursos de la ficha — siempre presentes en la demo */
  docUrl?: string
  videoUrl?: string
  pdfUrl?: string
  isFeatured: boolean
  status: 'published'
}

export const DEMO_INSTITUTIONS: DemoInstitution[] = [
  {
    id: 'inst-demo-fya',
    name: 'Fe y Alegría',
    slug: 'fe-y-alegria',
    shortName: 'FyA',
    description:
      'Espacio demostrativo de preservación académica. El contenido de esta versión no representa información institucional oficial.',
    accent: '#6b5ce6',
    isActive: true,
    isDemo: true,
  },
  {
    id: 'inst-demo-02',
    name: 'Institución 2',
    slug: 'institucion-2',
    shortName: 'I2',
    description: 'Entorno de demostración preparado para futuras instituciones afiliadas.',
    accent: '#7662c9',
    isActive: true,
    isDemo: true,
  },
]

const gallery = {
  technology: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1466692476862-aee09e07dea0?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1400&q=80',
  ],
  education: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80',
  ],
  art: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1400&q=80',
  ],
} as const

/** URLs demo compartidas para recursos de ficha (no oficiales) */
const DEMO_DOC = '#documentacion'
const DEMO_VIDEO = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
const DEMO_PDF =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: 'demo-p01',
    slug: 'sistema-riego-inteligente',
    institutionId: 'inst-demo-fya',
    title: 'Sistema de riego inteligente para la huerta escolar',
    subtitle: 'Prototipo para optimizar el uso del agua mediante sensores',
    area: 'Tecnología e Innovación',
    category: 'Tecnología',
    year: 2025,
    authors: [
      { id: 'a01', name: 'Participante Demo A', role: 'Diseño electrónico' },
      { id: 'a02', name: 'Participante Demo B', role: 'Desarrollo de software' },
    ],
    description:
      'Proyecto demostrativo que integra sensores de humedad y una interfaz de monitoreo para apoyar el cuidado responsable de una huerta educativa.',
    problem:
      'El riego manual sin información sobre la humedad del suelo puede desperdiciar agua y afectar el crecimiento de las plantas.',
    solution:
      'Se diseñó un prototipo que registra la humedad, activa el riego cuando es necesario y presenta los datos en un panel sencillo.',
    methodology:
      'Observación de la huerta, definición de requerimientos, construcción por iteraciones, calibración de sensores y prueba controlada.',
    results:
      'El prototipo demostró que es posible tomar decisiones de riego con datos y abrió una conversación sobre tecnología y sostenibilidad.',
    technologies: ['Arduino', 'Sensores de humedad', 'JavaScript', 'Prototipado'],
    tags: ['agua', 'IoT', 'huerta', 'sostenibilidad'],
    collection: 'Soluciones para el entorno',
    coverImage: gallery.technology[0],
    gallery: gallery.technology,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
    status: 'published',
  },
  {
    id: 'demo-p02',
    slug: 'huerta-escolar-sustentable',
    institutionId: 'inst-demo-fya',
    title: 'Huerta escolar sustentable y aprendizaje comunitario',
    subtitle: 'Ciencias naturales aplicadas al cuidado del entorno',
    area: 'Ciencias Naturales',
    category: 'Medio Ambiente',
    year: 2024,
    authors: [
      { id: 'a03', name: 'Equipo Demo Ciencias', role: 'Investigación y cultivo' },
    ],
    description:
      'Experiencia demostrativa de cultivo escolar que relaciona ciclos biológicos, compostaje y colaboración comunitaria.',
    problem:
      'Los conceptos ambientales suelen estudiarse sin oportunidades suficientes para observar procesos naturales de forma continua.',
    solution:
      'Se propuso una huerta como laboratorio vivo, acompañada por bitácoras, mediciones periódicas y aprovechamiento de residuos orgánicos.',
    methodology:
      'Diagnóstico del terreno, selección de especies, preparación de compost, siembra, seguimiento y socialización de aprendizajes.',
    results:
      'Se consolidó un modelo replicable de aprendizaje práctico y se documentaron recomendaciones para futuros grupos.',
    technologies: ['Bitácora digital', 'Compostaje', 'Medición ambiental'],
    tags: ['biodiversidad', 'compostaje', 'aprendizaje activo'],
    collection: 'Soluciones para el entorno',
    coverImage: gallery.nature[0],
    gallery: gallery.nature,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
    status: 'published',
  },
  {
    id: 'demo-p03',
    slug: 'tutorias-entre-pares',
    institutionId: 'inst-demo-fya',
    title: 'Red de tutorías entre pares',
    subtitle: 'Una propuesta para compartir conocimientos dentro del aula',
    area: 'Educación',
    category: 'Innovación Educativa',
    year: 2025,
    authors: [
      { id: 'a04', name: 'Equipo Demo Pedagogía', role: 'Diseño de experiencia' },
      { id: 'a05', name: 'Participante Demo C', role: 'Prototipo digital' },
    ],
    description:
      'Sistema demostrativo que organiza encuentros de apoyo entre estudiantes según temas, disponibilidad y necesidades de aprendizaje.',
    problem:
      'Algunas dudas académicas permanecen sin resolver por falta de espacios flexibles de acompañamiento y colaboración.',
    solution:
      'Se planteó una red interna con solicitudes de apoyo, agenda compartida y materiales breves creados por los propios participantes.',
    methodology:
      'Entrevistas simuladas, mapa de necesidades, prototipado de baja fidelidad, pruebas de uso y mejoras iterativas.',
    results:
      'El prototipo permitió validar un flujo claro para solicitar y ofrecer apoyo sin crear cuentas estudiantiles en LEGACY.',
    technologies: ['Figma', 'HTML', 'CSS', 'JavaScript'],
    tags: ['colaboración', 'tutoría', 'prototipo'],
    collection: 'Aprender juntos',
    coverImage: gallery.education[0],
    gallery: gallery.education,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
    status: 'published',
  },
  {
    id: 'demo-p04',
    slug: 'mural-memoria-local',
    institutionId: 'inst-demo-fya',
    title: 'Mural digital de memoria local',
    subtitle: 'Relatos visuales para reconocer el territorio',
    area: 'Arte y Cultura',
    category: 'Humanidades',
    year: 2023,
    authors: [
      { id: 'a06', name: 'Colectivo Demo Memoria', role: 'Investigación visual' },
    ],
    description:
      'Archivo visual demostrativo que reúne ilustraciones, fotografías y textos breves sobre lugares significativos de una comunidad.',
    problem:
      'Las historias cotidianas del territorio pueden desaparecer cuando no existen procesos accesibles para registrarlas y compartirlas.',
    solution:
      'Se creó un mural navegable organizado por temas, acompañado de fichas editoriales y una metodología básica de archivo.',
    methodology:
      'Recopilación de referentes, selección temática, producción gráfica, edición de textos y montaje de un prototipo web.',
    results:
      'La experiencia muestra cómo una colección digital puede conectar creación artística, identidad y preservación de memoria.',
    technologies: ['Ilustración digital', 'Fotografía', 'Diseño editorial'],
    tags: ['memoria', 'territorio', 'arte', 'archivo'],
    collection: 'Memorias que permanecen',
    coverImage: gallery.art[0],
    gallery: gallery.art,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
    status: 'published',
  },
  {
    id: 'demo-p05',
    slug: 'estacion-calidad-aire',
    institutionId: 'inst-demo-fya',
    title: 'Estación escolar de calidad del aire',
    subtitle: 'Observación ambiental con datos abiertos',
    area: 'Ciencias Naturales',
    category: 'Ciencias',
    year: 2025,
    authors: [{ id: 'a07', name: 'Laboratorio Demo Escolar', role: 'Medición y análisis' }],
    description:
      'Prototipo de medición ambiental que registra variables básicas y las convierte en visualizaciones comprensibles.',
    problem:
      'La calidad del aire es difícil de interpretar sin datos cercanos y recursos pedagógicos que expliquen sus cambios.',
    solution:
      'Una estación de bajo costo captura datos y genera reportes semanales para apoyar actividades de ciencias.',
    methodology:
      'Selección de variables, montaje del dispositivo, registro de muestras, comparación y comunicación de resultados.',
    results:
      'Se obtuvo una serie de prueba y una guía para interpretar tendencias sin presentar conclusiones oficiales.',
    technologies: ['Sensores', 'Hojas de cálculo', 'Visualización de datos'],
    tags: ['aire', 'datos', 'ambiente'],
    coverImage: gallery.technology[2],
    gallery: [gallery.technology[2], gallery.nature[2]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p06',
    slug: 'biblioteca-sonora',
    institutionId: 'inst-demo-fya',
    title: 'Biblioteca sonora de relatos breves',
    subtitle: 'Lectura, oralidad y producción de audio',
    area: 'Lenguaje y Humanidades',
    category: 'Humanidades',
    year: 2024,
    authors: [{ id: 'a08', name: 'Taller Demo de Lectura', role: 'Guion y narración' }],
    description:
      'Colección demostrativa de relatos de ficción producidos, narrados y editados como cápsulas sonoras.',
    problem:
      'Las actividades de escritura suelen finalizar en el aula y pocas veces se convierten en piezas consultables.',
    solution:
      'Se organizó un proceso editorial que transforma textos en episodios con guion, narración y portada.',
    methodology:
      'Escritura, revisión entre pares, adaptación sonora, grabación, edición y publicación de una muestra.',
    results:
      'Se documentó un flujo sencillo para preservar producciones literarias en distintos formatos.',
    technologies: ['Grabación de audio', 'Edición', 'Guion'],
    tags: ['oralidad', 'literatura', 'audio'],
    collection: 'Memorias que permanecen',
    coverImage: gallery.art[2],
    gallery: [gallery.art[2], gallery.education[1]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p07',
    slug: 'mapa-accesibilidad-escolar',
    institutionId: 'inst-demo-02',
    title: 'Mapa de accesibilidad de espacios educativos',
    subtitle: 'Diagnóstico participativo para una experiencia más inclusiva',
    area: 'Ciencias Sociales',
    category: 'Ciudadanía',
    year: 2025,
    authors: [{ id: 'a09', name: 'Equipo Demo Inclusión', role: 'Observación y propuesta' }],
    description:
      'Ejercicio demostrativo para reconocer barreras físicas y de información en un entorno educativo.',
    problem:
      'Algunas barreras de acceso pasan inadvertidas cuando no se analizan los recorridos desde distintas perspectivas.',
    solution:
      'Se diseñó un mapa por zonas con observaciones, niveles de prioridad y propuestas de mejora.',
    methodology:
      'Recorridos guiados, registro en fichas, clasificación de hallazgos y prototipado de señalización.',
    results:
      'El proyecto produjo una matriz de hallazgos de demostración y un conjunto de recomendaciones.',
    technologies: ['Mapeo', 'Fotografía', 'Prototipado'],
    tags: ['inclusión', 'accesibilidad', 'ciudadanía'],
    coverImage: gallery.education[2],
    gallery: gallery.education,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
    status: 'published',
  },
  {
    id: 'demo-p08',
    slug: 'observatorio-consumo-responsable',
    institutionId: 'inst-demo-02',
    title: 'Observatorio de consumo responsable',
    subtitle: 'Datos cotidianos para comprender nuestros hábitos',
    area: 'Ciencias Sociales',
    category: 'Sostenibilidad',
    year: 2024,
    authors: [{ id: 'a10', name: 'Grupo Demo Investigación', role: 'Encuestas y análisis' }],
    description:
      'Proyecto demostrativo que organiza observaciones anónimas sobre hábitos de consumo y alternativas sostenibles.',
    problem:
      'Las decisiones cotidianas de consumo se toman sin visualizar su relación con residuos y uso de recursos.',
    solution:
      'Se creó un tablero educativo con datos simulados, preguntas de reflexión y recomendaciones prácticas.',
    methodology:
      'Diseño de instrumento, generación de muestra ficticia, análisis descriptivo y diseño de visualizaciones.',
    results:
      'El prototipo muestra cómo presentar datos sin convertirlos en estadísticas institucionales oficiales.',
    technologies: ['Encuestas', 'Análisis descriptivo', 'Infografía'],
    tags: ['consumo', 'datos', 'sostenibilidad'],
    coverImage: gallery.nature[1],
    gallery: gallery.nature,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
]

export const getInstitutionBySlug = (slug?: string) =>
  DEMO_INSTITUTIONS.find((institution) => institution.slug === slug)

export const getInstitutionProjects = (institutionId: string) =>
  DEMO_PROJECTS.filter((project) => project.institutionId === institutionId)

export const getProjectBySlug = (institutionId: string, slug?: string) =>
  DEMO_PROJECTS.find(
    (project) => project.institutionId === institutionId && project.slug === slug,
  )

export const getProjectHref = (project: DemoProject) => {
  const institution = DEMO_INSTITUTIONS.find(
    (item) => item.id === project.institutionId,
  )
  return `/instituciones/${institution?.slug ?? 'fe-y-alegria'}/proyectos/${project.slug}`
}
