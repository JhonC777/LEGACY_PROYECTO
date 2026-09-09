import { FE_Y_ALEGRIA_IDENTITY } from './institutionalIdentity'

/**
 * Contenido de DEMOSTRACIÓN de LEGACY.
 *
 * Todo lo que hay aquí es ficticio: proyectos, textos, participantes y roles.
 * Los nombres son inventados y no corresponden a personas reales; las
 * instituciones tampoco publican aquí información oficial.
 * Esta fuente será reemplazada por Supabase.
 */

export type DemoAuthor = {
  id: string
  name: string
  role: string
}

/** Ciclo de vida de un proyecto. El sitio público solo muestra `published`. */
export type ProjectStatus = 'draft' | 'published' | 'archived'

export type DemoInstitution = {
  id: string
  name: string
  slug: string
  shortName: string
  logoUrl?: string
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
  status: ProjectStatus
}

export const DEMO_INSTITUTIONS: DemoInstitution[] = [
  {
    id: 'inst-demo-fya',
    name: FE_Y_ALEGRIA_IDENTITY.name,
    slug: 'fe-y-alegria',
    shortName: FE_Y_ALEGRIA_IDENTITY.shortName,
    logoUrl: FE_Y_ALEGRIA_IDENTITY.logoUrl,
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
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1400&q=80',
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
  science: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=1400&q=80',
  ],
  community: [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1400&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1400&q=80',
  ],
  media: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1400&q=80',
  ],
  math: [
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80',
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
      { id: 'a01', name: 'Mariana Ospina Rivas', role: 'Diseño electrónico' },
      { id: 'a02', name: 'Samuel Cardona Ruiz', role: 'Desarrollo de software' },
      { id: 'a03', name: 'Valeria Contreras Peña', role: 'Documentación técnica' },
    ],
    description:
      'Prototipo que integra sensores de humedad de suelo, una electroválvula y un panel de monitoreo para regar la huerta escolar solo cuando el cultivo lo necesita. El sistema registra cada lectura y permite revisar el histórico por semana.',
    problem:
      'El riego se hacía por horario fijo y no según el estado real del suelo. En temporada de lluvias se regaba de más y en semanas secas algunos surcos quedaban sin agua suficiente, con pérdidas visibles en las plántulas.',
    solution:
      'Se construyó un circuito con tres sensores capacitivos distribuidos por zona, conectados a un microcontrolador que abre la válvula cuando la humedad baja del umbral definido. Un panel web muestra el estado actual y el consumo estimado.',
    methodology:
      'Se levantó una línea base midiendo la humedad manualmente durante dos semanas. Con esos datos se definieron umbrales por zona, se construyó el prototipo en iteraciones cortas y se calibraron los sensores contra mediciones de referencia antes de la prueba en campo.',
    results:
      'Durante el ciclo de prueba el riego pasó de una programación fija a una basada en lecturas, y el equipo documentó una reducción estimada del consumo en la zona monitoreada. El registro histórico se convirtió en material de clase para analizar datos reales.',
    technologies: ['Arduino', 'Sensores capacitivos', 'JavaScript', 'Impresión 3D'],
    tags: ['agua', 'IoT', 'huerta', 'sostenibilidad', 'sensores'],
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
      { id: 'a04', name: 'Daniela Herrera Mora', role: 'Investigación y cultivo' },
      { id: 'a05', name: 'Tomás Escobar Lindo', role: 'Compostaje' },
    ],
    description:
      'Huerta usada como laboratorio vivo para estudiar ciclos biológicos, suelos y compostaje. Cada grupo lleva una bitácora de siembra y mide crecimiento, riego y aparición de plagas a lo largo del semestre.',
    problem:
      'Los contenidos de ciclos biológicos y descomposición se veían solo en el cuaderno. Sin observación sostenida, los estudiantes memorizaban etapas sin relacionarlas con lo que pasa realmente en un cultivo.',
    solution:
      'Se destinó un terreno del patio a cultivos de ciclo corto y se organizó una rotación por grados. Se sumó una compostera alimentada con residuos de la cafetería, cuyo sustrato regresa a los surcos.',
    methodology:
      'Diagnóstico del terreno y pH inicial, selección de especies según clima, preparación de compost, siembra escalonada, medición quincenal de altura y estado foliar, y una jornada final de socialización con familias.',
    results:
      'Se consolidó un calendario de siembra replicable y un manual breve de compostaje escrito por los propios estudiantes. Las bitácoras quedaron archivadas como material de consulta para los grupos siguientes.',
    technologies: ['Bitácora digital', 'Compostaje', 'Medición de pH'],
    tags: ['biodiversidad', 'compostaje', 'huerta', 'aprendizaje activo'],
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
      { id: 'a06', name: 'Juan Esteban Molina', role: 'Diseño de experiencia' },
      { id: 'a07', name: 'Laura Restrepo Gil', role: 'Prototipo digital' },
    ],
    description:
      'Sistema que conecta a estudiantes que necesitan apoyo con compañeros que dominan el tema, organizando los encuentros por materia, disponibilidad y tipo de duda.',
    problem:
      'Muchas dudas se acumulaban entre clases y llegaban tarde al docente. Al mismo tiempo, había estudiantes con buen manejo del tema sin un canal claro para ayudar.',
    solution:
      'Una red interna con solicitudes de apoyo, agenda compartida por franjas de descanso y fichas breves de repaso creadas por los propios tutores. Todo funciona sin cuentas de estudiante: el docente administra el tablero.',
    methodology:
      'Entrevistas a estudiantes de tres grados, mapa de necesidades por materia, prototipo de baja fidelidad en papel, dos rondas de prueba de uso y ajustes sobre el flujo de solicitud.',
    results:
      'El flujo de solicitar y ofrecer apoyo quedó validado en pruebas de uso, y las fichas de repaso se archivaron como recurso reutilizable. El modelo no requiere infraestructura adicional.',
    technologies: ['Figma', 'HTML', 'CSS', 'JavaScript'],
    tags: ['colaboración', 'tutoría', 'prototipo', 'acompañamiento'],
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
      { id: 'a08', name: 'Camila Zapata Duque', role: 'Investigación visual' },
      { id: 'a09', name: 'Andrés Felipe Lozano', role: 'Ilustración' },
    ],
    description:
      'Archivo visual que reúne ilustraciones, fotografías y textos breves sobre lugares significativos del barrio, organizados en un mural navegable por temas.',
    problem:
      'Las historias cotidianas del territorio circulaban solo de forma oral. Sin un proceso de registro accesible, se perdían al cambiar de generación.',
    solution:
      'Se creó un mural digital con fichas editoriales por lugar: una imagen, un texto corto y la fuente del relato. La navegación agrupa los lugares por tema en vez de por orden cronológico.',
    methodology:
      'Recopilación de referentes visuales, conversaciones con vecinos para identificar lugares, selección temática, producción gráfica, edición de textos y montaje del prototipo web.',
    results:
      'Quedó una colección navegable y una guía metodológica breve para que otros grupos documenten su propio territorio con el mismo formato de ficha.',
    technologies: ['Ilustración digital', 'Fotografía', 'Diseño editorial'],
    tags: ['memoria', 'territorio', 'arte', 'archivo', 'comunidad'],
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
    authors: [
      { id: 'a10', name: 'Sofía Naranjo Vélez', role: 'Medición y análisis' },
      { id: 'a11', name: 'Emilio Guerrero Sáenz', role: 'Montaje del dispositivo' },
    ],
    description:
      'Estación de bajo costo que registra material particulado, temperatura y humedad en el patio, y convierte las lecturas en gráficos semanales comprensibles para clase.',
    problem:
      'Hablar de calidad del aire con cifras de estaciones lejanas resultaba abstracto. Faltaban datos del propio entorno y una forma sencilla de interpretarlos.',
    solution:
      'Un sensor de partículas y uno de temperatura y humedad alimentan una hoja de cálculo compartida que genera gráficos automáticos, acompañados de una guía de lectura por rangos.',
    methodology:
      'Selección de variables medibles con recursos disponibles, montaje y verificación del dispositivo, registro cada hora durante seis semanas, limpieza de datos atípicos y comparación entre días de semana y fines de semana.',
    results:
      'Se obtuvo una serie de prueba con variaciones claras entre horas pico y horas tranquilas, y una guía para interpretar tendencias sin presentar conclusiones oficiales sobre salud.',
    technologies: ['Sensores de partículas', 'Hojas de cálculo', 'Visualización de datos'],
    tags: ['aire', 'datos', 'ambiente', 'sensores'],
    collection: 'Ciencia en el aula',
    coverImage: gallery.science[0],
    gallery: gallery.science,
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
    authors: [
      { id: 'a12', name: 'Isabela Quintero Ríos', role: 'Guion y narración' },
      { id: 'a13', name: 'Martín Salazar Ocampo', role: 'Edición de audio' },
    ],
    description:
      'Colección de relatos de ficción escritos en clase y producidos como cápsulas sonoras de tres a cinco minutos, con guion, narración, música y portada propia.',
    problem:
      'Los textos del taller de escritura terminaban archivados en carpetas y nadie volvía a leerlos. El trabajo se perdía apenas pasaba la nota.',
    solution:
      'Se armó un proceso editorial completo: del borrador a la revisión entre pares, luego adaptación a guion sonoro, grabación y publicación como episodio con ficha.',
    methodology:
      'Escritura individual, dos rondas de revisión entre pares con rúbrica, adaptación a formato sonoro, grabación en el salón con micrófono USB, edición y montaje de la muestra final.',
    results:
      'Quedó documentado un flujo sencillo y repetible para preservar producciones literarias en formato audio, junto con una primera temporada de episodios de muestra.',
    technologies: ['Grabación de audio', 'Audacity', 'Guion literario'],
    tags: ['oralidad', 'literatura', 'audio', 'escritura'],
    collection: 'Memorias que permanecen',
    coverImage: gallery.media[1],
    gallery: [gallery.media[1], gallery.art[2], gallery.education[1]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p09',
    slug: 'aula-invertida-capsulas',
    institutionId: 'inst-demo-fya',
    title: 'Aula invertida con cápsulas de video',
    subtitle: 'Explicaciones breves para liberar tiempo de práctica en clase',
    area: 'Educación',
    category: 'Innovación Educativa',
    year: 2026,
    authors: [
      { id: 'a14', name: 'Paula Andrea Jiménez', role: 'Diseño instruccional' },
      { id: 'a15', name: 'Diego Alejandro Rueda', role: 'Producción audiovisual' },
      { id: 'a16', name: 'Sara Villamizar Ortiz', role: 'Evaluación' },
    ],
    description:
      'Serie de cápsulas de cinco minutos que cubren los conceptos base de una unidad, para que la hora de clase se dedique a ejercicios y resolución de dudas en grupo.',
    problem:
      'Buena parte de la clase se iba en explicación frontal. Quien se perdía en los primeros minutos no tenía cómo recuperar el hilo, y quedaba poco tiempo para practicar acompañado.',
    solution:
      'Se grabaron cápsulas cortas por concepto, con guion revisado y subtítulos. La clase presencial se reorganizó en estaciones de práctica según el nivel de avance de cada grupo.',
    methodology:
      'Descomposición de la unidad en conceptos mínimos, guion por cápsula, grabación con recursos propios, prueba con un grupo piloto y ajuste de duración según los puntos donde se abandonaba el video.',
    results:
      'El grupo piloto llegó a clase con las preguntas ya formuladas y el tiempo de práctica acompañada aumentó de forma notoria. Las cápsulas quedaron archivadas como material de repaso permanente.',
    technologies: ['Grabación de pantalla', 'Edición de video', 'Subtitulado'],
    tags: ['aula invertida', 'video', 'acompañamiento', 'prototipo'],
    collection: 'Aprender juntos',
    coverImage: gallery.education[1],
    gallery: gallery.education,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
    status: 'published',
  },
  {
    id: 'demo-p10',
    slug: 'ruta-reciclaje-tapas',
    institutionId: 'inst-demo-fya',
    title: 'Ruta escolar de reciclaje de tapas plásticas',
    subtitle: 'Logística sencilla para separar en la fuente',
    area: 'Ciencias Naturales',
    category: 'Sostenibilidad',
    year: 2023,
    authors: [
      { id: 'a17', name: 'Nicolás Beltrán Cano', role: 'Logística y acopio' },
      { id: 'a18', name: 'Antonia Márquez Ruiz', role: 'Campaña de comunicación' },
    ],
    description:
      'Circuito de recolección de tapas plásticas con puntos de acopio señalizados, pesaje semanal y entrega a un punto de reciclaje externo, acompañado de una campaña visual.',
    problem:
      'Las tapas terminaban mezcladas con la basura común. Había disposición para separar, pero no puntos claros ni una rutina definida de recolección.',
    solution:
      'Se instalaron cinco puntos de acopio con señalización propia y se definió un turno rotativo de pesaje semanal, con un tablero visible que muestra el acumulado del mes.',
    methodology:
      'Conteo inicial de residuos plásticos por zona, diseño de los contenedores con material reutilizado, campaña de expectativa, arranque de la ruta y registro semanal del peso recolectado.',
    results:
      'La ruta se sostuvo durante todo el periodo y el tablero de acumulado se volvió referencia para hablar de residuos con datos propios en clase de ciencias.',
    technologies: ['Señalización gráfica', 'Registro de pesaje', 'Diseño de campaña'],
    tags: ['reciclaje', 'residuos', 'sostenibilidad', 'comunidad'],
    collection: 'Soluciones para el entorno',
    coverImage: gallery.nature[2],
    gallery: [gallery.nature[2], gallery.community[0], gallery.nature[1]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p11',
    slug: 'laboratorio-matematicas-manipulativas',
    institutionId: 'inst-demo-fya',
    title: 'Laboratorio de matemáticas manipulativas',
    subtitle: 'Material concreto para entender fracciones y áreas',
    area: 'Matemáticas',
    category: 'Innovación Educativa',
    year: 2024,
    authors: [
      { id: 'a19', name: 'Felipe Andrade Serna', role: 'Diseño de material' },
      { id: 'a20', name: 'Manuela Ríos Betancur', role: 'Pruebas en aula' },
    ],
    description:
      'Conjunto de piezas manipulables construidas en el colegio para trabajar fracciones, perímetro y área, con guías de uso por nivel y una caja por grupo.',
    problem:
      'Fracciones y áreas se enseñaban solo con dibujos en el tablero. Varios estudiantes resolvían el procedimiento sin comprender qué representaba la operación.',
    solution:
      'Se diseñaron piezas modulares en cartón rígido y madera reciclada que permiten componer y descomponer figuras, junto con guías de actividad de dificultad creciente.',
    methodology:
      'Revisión de dificultades frecuentes en evaluaciones previas, diseño y corte de las piezas, prueba con dos grupos de distinto grado, observación de errores y ajuste de las guías.',
    results:
      'Las sesiones con material concreto redujeron los errores de interpretación observados en los ejercicios de clase, y las cajas quedaron disponibles para préstamo entre docentes.',
    technologies: ['Prototipado en cartón', 'Diseño de guías', 'Corte manual'],
    tags: ['matemáticas', 'material concreto', 'aprendizaje activo'],
    collection: 'Ciencia en el aula',
    coverImage: gallery.math[0],
    gallery: gallery.math,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p12',
    slug: 'brigada-primeros-auxilios',
    institutionId: 'inst-demo-fya',
    title: 'Brigada escolar de primeros auxilios',
    subtitle: 'Protocolo claro para los primeros cinco minutos',
    area: 'Salud y Bienestar',
    category: 'Salud',
    year: 2025,
    authors: [
      { id: 'a21', name: 'Gabriela Toro Mesa', role: 'Formación y protocolo' },
      { id: 'a22', name: 'Julián Castaño Pérez', role: 'Señalización y logística' },
    ],
    description:
      'Brigada estudiantil con protocolo escrito, botiquines revisados por zona y señalización de rutas, enfocada en actuar correctamente durante los primeros minutos de un incidente menor.',
    problem:
      'Ante una caída o un desmayo, la reacción dependía de quién estuviera cerca. No había un protocolo visible ni claridad sobre dónde estaba el botiquín más próximo.',
    solution:
      'Se conformó una brigada con turnos por jornada, se estandarizó el contenido de los botiquines y se publicó un protocolo de una página con los pasos y los contactos internos.',
    methodology:
      'Revisión de incidentes registrados en enfermería, formación con personal de salud, redacción del protocolo, simulacros por jornada y ajuste según los tiempos de respuesta observados.',
    results:
      'Los simulacros mostraron tiempos de respuesta más consistentes entre jornadas, y el protocolo de una página quedó publicado en cada zona junto al botiquín.',
    technologies: ['Protocolo escrito', 'Señalización', 'Simulacros'],
    tags: ['salud', 'prevención', 'comunidad', 'protocolo'],
    collection: 'Ciudad y comunidad',
    coverImage: gallery.health[0],
    gallery: gallery.health,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p13',
    slug: 'periodico-escolar-digital',
    institutionId: 'inst-demo-fya',
    title: 'Periódico escolar digital',
    subtitle: 'Un comité editorial estudiantil con ciclo de publicación real',
    area: 'Lenguaje y Humanidades',
    category: 'Humanidades',
    year: 2022,
    authors: [
      { id: 'a23', name: 'Valentina Cifuentes Ariza', role: 'Dirección editorial' },
      { id: 'a24', name: 'Sebastián Uribe Naranjo', role: 'Redacción' },
      { id: 'a25', name: 'Alejandra Pineda Ceballos', role: 'Diagramación' },
    ],
    description:
      'Publicación mensual escrita, editada y diagramada por estudiantes, con secciones fijas, cierre de edición y un archivo consultable de números anteriores.',
    problem:
      'La escritura se practicaba solo para evaluación. No existía un espacio donde el texto tuviera lector real, fecha de entrega y consecuencias editoriales.',
    solution:
      'Se formó un comité editorial con roles definidos y un calendario de cierre mensual. Cada número pasa por propuesta, redacción, edición, diagramación y publicación.',
    methodology:
      'Definición de secciones y manual de estilo breve, asignación de roles rotativos, consejo de redacción quincenal, edición cruzada entre pares y archivo de cada número publicado.',
    results:
      'Se sostuvo un ciclo de publicación regular y quedó un archivo de números consultable, además de un manual de estilo que heredan los comités siguientes.',
    technologies: ['Manual de estilo', 'Diagramación digital', 'Edición de texto'],
    tags: ['periodismo', 'escritura', 'archivo', 'comunicación'],
    collection: 'Memorias que permanecen',
    coverImage: gallery.media[0],
    gallery: gallery.media,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p14',
    slug: 'robotica-materiales-reutilizados',
    institutionId: 'inst-demo-fya',
    title: 'Robótica con materiales reutilizados',
    subtitle: 'Kits de bajo costo armados con residuos electrónicos',
    area: 'Tecnología e Innovación',
    category: 'Tecnología',
    year: 2026,
    authors: [
      { id: 'a26', name: 'Santiago Arbeláez Muñoz', role: 'Electrónica' },
      { id: 'a27', name: 'Lucía Fernanda Osorio', role: 'Programación' },
      { id: 'a28', name: 'Emmanuel Torres Gaviria', role: 'Diseño de chasis' },
    ],
    description:
      'Kits de robótica ensamblados con motores, ruedas y carcasas recuperadas de aparatos en desuso, acompañados de retos de programación por niveles.',
    problem:
      'Los kits comerciales de robótica resultaban costosos y alcanzaban para muy pocos grupos, dejando la actividad limitada a un club reducido.',
    solution:
      'Se recuperaron componentes de equipos donados y se estandarizó un kit básico replicable, con guía de armado y una secuencia de retos de programación de dificultad creciente.',
    methodology:
      'Inventario de componentes recuperables, definición del kit mínimo viable, pruebas de resistencia del chasis, redacción de la guía de armado y validación con dos grupos sin experiencia previa.',
    results:
      'El costo por kit bajó lo suficiente para llevar la actividad a más grupos, y los retos de programación quedaron documentados como secuencia reutilizable.',
    technologies: ['Arduino', 'Motores DC', 'Reutilización electrónica', 'Programación por bloques'],
    tags: ['robótica', 'reciclaje', 'IoT', 'prototipo', 'sensores'],
    collection: 'Ciencia en el aula',
    coverImage: gallery.technology[1],
    gallery: [gallery.technology[1], gallery.technology[2], gallery.science[1]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
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
    authors: [
      { id: 'a29', name: 'Mateo Salinas Bermúdez', role: 'Observación y propuesta' },
      { id: 'a30', name: 'Juliana Acosta Vargas', role: 'Cartografía' },
    ],
    description:
      'Diagnóstico por zonas que identifica barreras físicas y de información en la sede, clasificadas por prioridad y acompañadas de propuestas concretas de mejora.',
    problem:
      'Algunas barreras de acceso pasaban inadvertidas porque nadie recorría los espacios desde la perspectiva de quien usa silla de ruedas o tiene baja visión.',
    solution:
      'Se hicieron recorridos guiados con distintos perfiles de usuario, registrando cada obstáculo en una ficha con foto, ubicación y nivel de prioridad, y se propuso señalización mejorada.',
    methodology:
      'Definición de rutas críticas, recorridos acompañados, registro fotográfico en fichas estandarizadas, clasificación de hallazgos por urgencia y prototipado de señalización en alto contraste.',
    results:
      'Se produjo una matriz de hallazgos por zona y un conjunto de recomendaciones priorizadas, además de prototipos de señalización probados en dos corredores.',
    technologies: ['Cartografía', 'Fotografía', 'Prototipado de señalética'],
    tags: ['inclusión', 'accesibilidad', 'ciudadanía', 'comunidad'],
    collection: 'Ciudad y comunidad',
    coverImage: gallery.community[1],
    gallery: gallery.community,
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
    authors: [
      { id: 'a31', name: 'Carolina Mejía Álvarez', role: 'Encuestas y análisis' },
      { id: 'a32', name: 'Iván Darío Palacio', role: 'Visualización de datos' },
    ],
    description:
      'Tablero educativo que organiza observaciones anónimas sobre hábitos de consumo en el hogar y propone alternativas sostenibles con datos de muestra.',
    problem:
      'Las decisiones diarias de consumo se tomaban sin ver su relación con residuos, agua y energía. Faltaba una forma de visualizar ese vínculo con datos cercanos.',
    solution:
      'Se diseñó un instrumento anónimo de registro y un tablero con gráficos simples, preguntas de reflexión y recomendaciones prácticas por categoría de consumo.',
    methodology:
      'Diseño y pilotaje del instrumento, generación de una muestra ficticia para pruebas, análisis descriptivo por categoría y diseño de visualizaciones legibles sin formación estadística.',
    results:
      'El prototipo muestra cómo presentar datos de hábitos sin convertirlos en estadísticas institucionales, y quedó como recurso para clases de ciencias sociales.',
    technologies: ['Encuestas', 'Análisis descriptivo', 'Infografía'],
    tags: ['consumo', 'datos', 'sostenibilidad', 'hábitos'],
    collection: 'Ciudad y comunidad',
    coverImage: gallery.community[2],
    gallery: [gallery.community[2], gallery.nature[1], gallery.media[2]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p15',
    slug: 'huerto-vertical-patios',
    institutionId: 'inst-demo-02',
    title: 'Huerto vertical para patios pequeños',
    subtitle: 'Cultivar sin terreno disponible',
    area: 'Ciencias Naturales',
    category: 'Medio Ambiente',
    year: 2026,
    authors: [
      { id: 'a33', name: 'Ana Sofía Delgado', role: 'Diseño del módulo' },
      { id: 'a34', name: 'Ricardo Amaya Solano', role: 'Riego y mantenimiento' },
    ],
    description:
      'Módulos verticales de cultivo construidos con estructuras recuperadas y riego por goteo, pensados para sedes urbanas sin zona verde disponible.',
    problem:
      'La sede no tenía terreno libre para una huerta tradicional, lo que dejaba fuera todas las actividades de cultivo del plan de ciencias.',
    solution:
      'Se diseñaron módulos verticales anclados al muro, con sustrato liviano y riego por goteo alimentado desde un tanque, ocupando menos de un metro cuadrado de piso.',
    methodology:
      'Estudio de horas de sol por muro, selección de especies tolerantes a sombra parcial, construcción del módulo, calibración del goteo y seguimiento de supervivencia por especie.',
    results:
      'Se identificaron las especies con mejor desempeño en el muro disponible y quedó un plano de construcción replicable para otras sedes con la misma limitación.',
    technologies: ['Riego por goteo', 'Estructuras recuperadas', 'Sustratos livianos'],
    tags: ['huerta', 'biodiversidad', 'sostenibilidad', 'agua'],
    collection: 'Soluciones para el entorno',
    coverImage: gallery.nature[1],
    gallery: gallery.nature,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p16',
    slug: 'memoria-oral-del-barrio',
    institutionId: 'inst-demo-02',
    title: 'Memoria oral del barrio',
    subtitle: 'Entrevistas a vecinos para reconstruir cómo se formó el sector',
    area: 'Arte y Cultura',
    category: 'Humanidades',
    year: 2023,
    authors: [
      { id: 'a35', name: 'Luisa Fernanda Peláez', role: 'Entrevistas' },
      { id: 'a36', name: 'Óscar Iván Rendón', role: 'Transcripción y archivo' },
    ],
    description:
      'Serie de entrevistas a habitantes del sector sobre la formación del barrio, transcritas, catalogadas y organizadas en fichas con audio, contexto y palabras clave.',
    problem:
      'La historia del sector no estaba escrita en ninguna parte. Los relatos existían solo en la memoria de los vecinos más antiguos.',
    solution:
      'Se construyó un archivo de historia oral con guion de entrevista, consentimiento informado, transcripción completa y catalogación por décadas y temas.',
    methodology:
      'Diseño del guion de entrevista, contacto y consentimiento de participantes, grabación en sus hogares, transcripción literal, catalogación por temas y verificación cruzada de fechas.',
    results:
      'Quedó un archivo de entrevistas catalogado y consultable, junto con un protocolo de historia oral que otros grupos pueden aplicar en sus propios sectores.',
    technologies: ['Grabación de audio', 'Transcripción', 'Catalogación'],
    tags: ['memoria', 'territorio', 'archivo', 'oralidad', 'comunidad'],
    collection: 'Memorias que permanecen',
    coverImage: gallery.art[1],
    gallery: [gallery.art[1], gallery.community[0], gallery.media[1]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p17',
    slug: 'club-lectura-critica-medios',
    institutionId: 'inst-demo-02',
    title: 'Club de lectura crítica de medios',
    subtitle: 'Verificar antes de compartir',
    area: 'Lenguaje y Humanidades',
    category: 'Ciudadanía',
    year: 2025,
    authors: [
      { id: 'a37', name: 'Natalia Bermúdez Cortés', role: 'Moderación' },
      { id: 'a38', name: 'Kevin Estrada Londoño', role: 'Fichas de verificación' },
    ],
    description:
      'Espacio semanal donde se analizan noticias y publicaciones virales aplicando una ficha de verificación de cuatro pasos: fuente, fecha, evidencia y contraste.',
    problem:
      'Circulaban contenidos falsos en los chats del curso y la respuesta habitual era discutir la opinión, no revisar el origen de la información.',
    solution:
      'Se creó una ficha corta de verificación y un club semanal donde cada participante lleva una publicación dudosa y la analiza en voz alta con el grupo.',
    methodology:
      'Selección semanal de casos reales, aplicación guiada de la ficha, contraste con fuentes primarias, discusión grupal y registro del veredicto con su justificación.',
    results:
      'La ficha de cuatro pasos se volvió un hábito verificable en las sesiones y quedó un repositorio de casos analizados que sirve como material de entrenamiento.',
    technologies: ['Ficha de verificación', 'Búsqueda inversa de imágenes', 'Registro de casos'],
    tags: ['comunicación', 'ciudadanía', 'pensamiento crítico', 'medios'],
    collection: 'Aprender juntos',
    coverImage: gallery.media[2],
    gallery: gallery.media,
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: false,
    status: 'published',
  },
  {
    id: 'demo-p18',
    slug: 'monitoreo-consumo-electrico',
    institutionId: 'inst-demo-02',
    title: 'Monitoreo del consumo eléctrico por sede',
    subtitle: 'Medir para decidir dónde ahorrar',
    area: 'Tecnología e Innovación',
    category: 'Sostenibilidad',
    year: 2024,
    authors: [
      { id: 'a39', name: 'Camilo Andrés Vega', role: 'Instrumentación' },
      { id: 'a40', name: 'Mariana Londoño Cárdenas', role: 'Análisis de datos' },
    ],
    description:
      'Sistema de medición por circuito que registra el consumo eléctrico de aulas, laboratorio y zonas comunes, y lo presenta en un tablero comparativo mensual.',
    problem:
      'La factura llegaba como un total único. Sin desagregar por zona era imposible saber dónde intervenir para reducir el consumo.',
    solution:
      'Se instalaron medidores por circuito principal y se automatizó el volcado de lecturas a un tablero que compara consumo por zona, día y franja horaria.',
    methodology:
      'Mapeo del tablero eléctrico, instalación de medidores con acompañamiento técnico, registro durante tres meses, normalización por horas de uso y detección de consumos fuera de horario.',
    results:
      'El análisis identificó consumos sostenidos fuera de horario en dos zonas y permitió proponer cambios de rutina concretos, con el tablero como seguimiento.',
    technologies: ['Medidores de energía', 'Automatización de registro', 'Visualización de datos'],
    tags: ['energía', 'datos', 'sostenibilidad', 'sensores'],
    collection: 'Ciencia en el aula',
    coverImage: gallery.science[2],
    gallery: [gallery.science[2], gallery.technology[2], gallery.science[1]],
    docUrl: DEMO_DOC,
    videoUrl: DEMO_VIDEO,
    pdfUrl: DEMO_PDF,
    isFeatured: true,
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

/** Años presentes en el catálogo, del más reciente al más antiguo. */
export const getAvailableYears = (projects: DemoProject[] = DEMO_PROJECTS) =>
  [...new Set(projects.map((project) => project.year))].sort((a, b) => b - a)

/**
 * Proyectos relacionados por afinidad: etiquetas compartidas pesan más que
 * el área, y el área más que la categoría. Si no hay coincidencias, completa
 * con los más recientes de la misma institución.
 */
export const getRelatedProjects = (project: DemoProject, limit = 3) => {
  const sameInstitution = DEMO_PROJECTS.filter(
    (candidate) =>
      candidate.institutionId === project.institutionId &&
      candidate.id !== project.id,
  )

  const scored = sameInstitution
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) =>
        project.tags.includes(tag),
      ).length

      const score =
        sharedTags * 3 +
        (candidate.area === project.area ? 2 : 0) +
        (candidate.category === project.category ? 2 : 0) +
        (candidate.collection && candidate.collection === project.collection ? 1 : 0)

      return { candidate, score }
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || b.candidate.year - a.candidate.year,
    )
    .map((entry) => entry.candidate)

  if (scored.length >= limit) return scored.slice(0, limit)

  const fallback = [...sameInstitution]
    .sort((a, b) => b.year - a.year)
    .filter((candidate) => !scored.includes(candidate))

  return [...scored, ...fallback].slice(0, limit)
}
