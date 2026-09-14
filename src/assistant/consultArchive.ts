import {
  getAvailableYears,
  getProjectHref,
  type DemoInstitution,
  type DemoProject,
} from '@/data/demoData'

/**
 * Asistente local del archivo público.
 * No llama a un LLM: recupera fichas publicadas de la institución actual.
 */

const STOPWORDS = new Set([
  'a',
  'al',
  'algo',
  'algun',
  'alguna',
  'alguno',
  'ante',
  'aquel',
  'aqui',
  'del',
  'el',
  'en',
  'es',
  'esa',
  'ese',
  'eso',
  'esta',
  'este',
  'esto',
  'hay',
  'la',
  'las',
  'lo',
  'los',
  'me',
  'mi',
  'o',
  'para',
  'por',
  'que',
  'se',
  'si',
  'sin',
  'sobre',
  'su',
  'sus',
  'te',
  'tu',
  'un',
  'una',
  'uno',
  'y',
  'ya',
  'como',
  'cual',
  'cuales',
  'cuando',
  'donde',
  'tiene',
  'tienen',
  'ser',
  'son',
  'fue',
  'con',
  'mas',
  'pero',
  'porque',
  'entre',
  'desde',
  'hasta',
  'muy',
  'tambien',
  'puede',
  'puedes',
  'poder',
  'hacer',
  'hace',
  'ver',
  'dame',
  'busca',
  'buscar',
  'encuentra',
  'mostrar',
  'muestra',
  'mostrarme',
  'quiero',
  'necesito',
  'conocer',
  'saber',
  'info',
  'informacion',
  'proyecto',
  'proyectos',
  'ficha',
  'fichas',
  'archivo',
  'catalogo',
  'publicado',
  'publicados',
  'publicada',
  'tema',
  'temas',
])

const GREETING_RE =
  /^(hola|buenas|buen[oa]s?\s+d[ií]as?|qué tal|que tal|hey|hi|hello)[\s!¡?¿.]*$/i

const HELP_RE =
  /^(ayuda|ayúdame|ayudame|qué puedes hacer|que puedes hacer|qué haces|que haces|cómo funciona|como funciona|para qué sirves|para que sirves|quién eres|quien eres)[\s!¡?¿.]*$/i

const OVERVIEW_RE =
  /(qué|que)\s+(proyectos\s+)?(hay|tienen|tiene)|cu[aá]ntos\s+proyectos|muestra(me)?\s+(el\s+)?(cat[aá]logo|archivo)|ver\s+(el\s+)?(cat[aá]logo|todo)|lista(r)?\s+(de\s+)?proyectos/

const SCORE_FLOOR = 4.6

export type ArchiveCitation = {
  id: string
  title: string
  subtitle: string
  year: number
  area: string
  collection?: string
  href: string
  excerpt: string
}

export type ArchiveResourceKind = 'ficha' | 'video' | 'pdf' | 'doc'

export type ArchiveResource = {
  kind: ArchiveResourceKind
  label: string
  href: string
  projectId: string
  external: boolean
}

export type ArchiveConsultStatus =
  | 'ok'
  | 'overview'
  | 'no-results'
  | 'empty-archive'

export type ArchiveConsultResult = {
  status: ArchiveConsultStatus
  text: string
  citations: ArchiveCitation[]
  resources: ArchiveResource[]
  catalogHref: string
  source?: 'gemini' | 'claude' | 'local'
}

type ConsultInput = {
  query: string
  institution: DemoInstitution
  projects: readonly DemoProject[]
}

type Scored = {
  project: DemoProject
  score: number
}

export function catalogPathFor(institution: DemoInstitution) {
  return `/instituciones/${institution.slug}/proyectos`
}

export function consultArchive({
  query,
  institution,
  projects,
}: ConsultInput): ArchiveConsultResult {
  const catalogHref = catalogPathFor(institution)
  const corpus = projects.filter(
    (project) =>
      project.status === 'published' &&
      project.institutionId === institution.id,
  )

  if (corpus.length === 0) {
    return {
      status: 'empty-archive',
      catalogHref,
      citations: [],
      resources: [],
      text: `Esta institución todavía no tiene proyectos publicados en el archivo. Cuando existan fichas, podré consultarlas aquí. Mientras tanto puedes abrir el catálogo de ${institution.shortName}.`,
    }
  }

  const trimmed = query.trim()
  if (!trimmed) {
    return noResults(institution, catalogHref)
  }

  if (GREETING_RE.test(trimmed)) {
    return {
      status: 'ok',
      catalogHref,
      citations: [],
      resources: [],
      text: `Aquí ando, entre las fichas de ${institution.shortName}. Dime un tema o un proyecto y te lo abro.`,
    }
  }

  if (HELP_RE.test(trimmed)) {
    return {
      status: 'ok',
      catalogHref,
      citations: [],
      resources: [],
      text: `Puedo responder dudas sobre el archivo publicado de ${institution.shortName}, resumir una ficha (problema, solución, resultados) y darte el atajo al video, al PDF o a la documentación. Pregunta en lenguaje natural. No invento premios, autores reales ni datos oficiales.`,
    }
  }

  const tokens = tokenize(trimmed)
  const yearsMentioned = extractYears(trimmed)
  const isOverview =
    OVERVIEW_RE.test(folded(trimmed)) &&
    tokens.length === 0 &&
    yearsMentioned.length === 0

  if (isOverview) {
    return overview(institution, corpus, catalogHref)
  }

  const scored = corpus
    .map((project) => ({
      project,
      score: scoreProject(project, tokens, yearsMentioned, folded(trimmed)),
    }))
    .filter((item) => item.score >= SCORE_FLOOR)
    .sort(compareScored)

  if (scored.length === 0) {
    return noResults(institution, catalogHref)
  }

  const best = scored[0].score
  const citations = scored
    .filter((item) => item.score >= Math.max(SCORE_FLOOR, best * 0.42))
    .slice(0, 3)
    .map((item) => toCitation(item.project, tokens))

  return {
    status: 'ok',
    catalogHref,
    citations,
    resources: resourcesFromIds(
      citations.map((item) => item.id),
      institution,
      corpus,
    ),
    text: answerFor(institution, trimmed, citations, corpus.length),
  }
}

export function citationsFromIds(
  ids: string[],
  institution: DemoInstitution,
  projects: readonly DemoProject[],
): ArchiveCitation[] {
  const allowed = new Map(
    projects
      .filter(
        (project) =>
          project.status === 'published' && project.institutionId === institution.id,
      )
      .map((project) => [project.id, project]),
  )

  const citations: ArchiveCitation[] = []
  for (const id of ids) {
    const project = allowed.get(id)
    if (!project) continue
    citations.push(toCitation(project, []))
    if (citations.length === 3) break
  }
  return citations
}

export function resourcesForProject(project: DemoProject): ArchiveResource[] {
  const ficha = getProjectHref(project)
  const docHref = resolveDocHref(project, ficha)
  const videoHref =
    isHttp(project.videoUrl) ? project.videoUrl : `${ficha}#recursos`
  const pdfHref = isHttp(project.pdfUrl)
    ? project.pdfUrl
    : project.pdfUrl || `${ficha}#recursos`

  return [
    { kind: 'ficha', label: 'Ficha', href: ficha, projectId: project.id, external: false },
    {
      kind: 'video',
      label: 'Video',
      href: videoHref,
      projectId: project.id,
      external: isHttp(videoHref),
    },
    {
      kind: 'pdf',
      label: 'PDF',
      href: pdfHref,
      projectId: project.id,
      external: isHttp(pdfHref),
    },
    {
      kind: 'doc',
      label: 'Documento',
      href: docHref,
      projectId: project.id,
      external: isHttp(docHref),
    },
  ]
}

export function resourcesFromIds(
  ids: string[],
  institution: DemoInstitution,
  projects: readonly DemoProject[],
): ArchiveResource[] {
  const allowed = new Map(
    projects
      .filter(
        (project) =>
          project.status === 'published' && project.institutionId === institution.id,
      )
      .map((project) => [project.id, project]),
  )

  const seen = new Set<string>()
  const resources: ArchiveResource[] = []
  for (const id of ids) {
    const project = allowed.get(id)
    if (!project) continue
    for (const resource of resourcesForProject(project)) {
      const key = `${resource.kind}:${resource.href}`
      if (seen.has(key)) continue
      seen.add(key)
      resources.push(resource)
      if (resources.length >= 8) return resources
    }
  }
  return resources
}

function resolveDocHref(project: DemoProject, ficha: string) {
  if (!project.docUrl || project.docUrl.startsWith('#')) return `${ficha}#recursos`
  return project.docUrl
}

function isHttp(url?: string): url is string {
  return Boolean(url && /^https?:\/\//i.test(url))
}

export function suggestArchiveQueries(projects: readonly DemoProject[]): string[] {
  const published = projects.filter((project) => project.status === 'published')
  if (published.length === 0) return []

  const areas = unique(
    published.map((project) => project.area),
    (value) => value,
  )
  const years = getAvailableYears([...published])
  const tag = mostFrequent(
    published.flatMap((project) => project.tags),
  )
  const collection = mostFrequent(
    published
      .map((project) => project.collection)
      .filter((value): value is string => Boolean(value)),
  )

  const featured = [...published].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.year - a.year,
  )[0]
  const shortTitle = featured
    ? featured.title.length > 36
      ? `${featured.title.slice(0, 34).trim()}…`
      : featured.title
    : ''

  const suggestions = [
    featured ? `Resume «${shortTitle}»` : '',
    featured ? `¿Qué problema resuelve ${featured.tags[0] ?? featured.area}?` : '',
    'Llévame al video de un proyecto',
    areas[0] ? `Proyectos de ${areas[0]}` : '',
    years[0] ? `Qué se publicó en ${years[0]}` : '',
    tag ? `Buscar ${tag}` : '',
    collection ? `Colección ${collection}` : '',
  ].filter(Boolean)

  return unique(suggestions, (value) => value).slice(0, 4)
}

function overview(
  institution: DemoInstitution,
  corpus: DemoProject[],
  catalogHref: string,
): ArchiveConsultResult {
  const years = getAvailableYears(corpus)
  const yearRange =
    years.length > 1
      ? `${years[years.length - 1]}–${years[0]}`
      : years.length === 1
        ? String(years[0])
        : 'sin año registrado'
  const areas = unique(
    corpus.map((project) => project.area),
    (value) => value,
  )
  const citations = [...corpus]
    .sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) || b.year - a.year,
    )
    .slice(0, 3)
    .map((project) => toCitation(project, []))

  return {
    status: 'overview',
    catalogHref,
    citations,
    resources: resourcesFromIds(
      citations.map((item) => item.id),
      institution,
      corpus,
    ),
    text: `El archivo publicado de ${institution.name} reúne ${corpus.length} fichas de demostración (${yearRange}, ${areas.length} áreas). Te dejo tres entradas para empezar. No son comunicados oficiales: son contenidos demo de esta institución.`,
  }
}

function noResults(
  institution: DemoInstitution,
  catalogHref: string,
): ArchiveConsultResult {
  return {
    status: 'no-results',
    catalogHref,
    citations: [],
    resources: [],
    text: `No encontré fichas publicadas en ${institution.shortName} que coincidan con esa consulta. Prueba con un área, un año o un tema del archivo, o abre el catálogo para recorrer las fichas una a una.`,
  }
}

function answerFor(
  institution: DemoInstitution,
  query: string,
  citations: ArchiveCitation[],
  total: number,
): string {
  const count = citations.length
  const focus = clip(query, 72)
  if (count === 1) {
    const item = citations[0]
    return `En el archivo publicado de ${institution.shortName} la ficha más cercana a «${focus}» es «${item.title}» (${item.year} · ${item.area}). Es contenido de demostración, no una ficha oficial. Hay ${total} proyectos publicados en esta institución.`
  }
  return `En el archivo publicado de ${institution.shortName} encontré ${count} fichas relacionadas con «${focus}». Cito solo proyectos publicados de esta institución; el contenido es de demostración.`
}

function toCitation(project: DemoProject, tokens: string[]): ArchiveCitation {
  return {
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    year: project.year,
    area: project.area,
    collection: project.collection,
    href: getProjectHref(project),
    excerpt: excerptFor(project, tokens),
  }
}

function scoreProject(
  project: DemoProject,
  tokens: string[],
  years: number[],
  foldedQuery: string,
): number {
  let score = 0
  const fields = indexFields(project)

  if (foldedQuery.length > 5 && fields.title.includes(foldedQuery)) score += 20
  if (foldedQuery.length > 5 && fields.subtitle.includes(foldedQuery)) score += 10
  if (years.includes(project.year)) score += 9

  for (const token of tokens) {
    const variants = stems(token)
    const hit = (value: string) => variants.some((item) => value.includes(item))

    if (hit(fields.title)) score += 10
    if (hit(fields.subtitle)) score += 6
    if (hit(fields.tags)) score += 7
    if (hit(fields.area)) score += 6.5
    if (hit(fields.category)) score += 5
    if (hit(fields.collection)) score += 6
    if (hit(fields.authors)) score += 5
    if (hit(fields.technologies)) score += 3.5
    if (hit(fields.description)) score += 2.2
    if (hit(fields.problem)) score += 1.8
    if (hit(fields.solution)) score += 1.8
    if (hit(fields.results)) score += 1.8
    if (hit(fields.methodology)) score += 1.6
  }

  if (project.isFeatured) score += 0.4
  return score
}

function indexFields(project: DemoProject) {
  return {
    title: folded(project.title),
    subtitle: folded(project.subtitle),
    tags: folded(project.tags.join(' ')),
    area: folded(project.area),
    category: folded(project.category),
    collection: folded(project.collection ?? ''),
    authors: folded(project.authors.map((author) => `${author.name} ${author.role}`).join(' ')),
    technologies: folded(project.technologies.join(' ')),
    description: folded(project.description),
    problem: folded(project.problem),
    solution: folded(project.solution),
    methodology: folded(project.methodology),
    results: folded(project.results),
  }
}

function excerptFor(project: DemoProject, tokens: string[]): string {
  const candidates = [
    project.subtitle,
    project.description,
    project.problem,
    project.solution,
    project.methodology,
    project.results,
  ]
  const match = candidates.find((text) =>
    tokens.some((token) => folded(text).includes(token)),
  )
  return clip(match || project.subtitle || project.description, 168)
}

function tokenize(query: string): string[] {
  return folded(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token) && !/^\d+$/.test(token))
}

function extractYears(query: string): number[] {
  const matches = query.match(/\b(20\d{2})\b/g)
  if (!matches) return []
  return unique(
    matches.map((value) => Number(value)).filter((year) => year >= 2000 && year <= 2099),
    (year) => year,
  )
}

function stems(token: string): string[] {
  const variants = [token]
  if (token.length > 5 && token.endsWith('es')) variants.push(token.slice(0, -2))
  else if (token.length > 4 && token.endsWith('s')) variants.push(token.slice(0, -1))
  return unique(variants, (value) => value)
}

function folded(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('es')
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const slice = clean.slice(0, max - 1)
  const cut = slice.lastIndexOf(' ')
  return `${(cut > 72 ? slice.slice(0, cut) : slice).trim()}…`
}

function compareScored(a: Scored, b: Scored) {
  return (
    b.score - a.score ||
    Number(b.project.isFeatured) - Number(a.project.isFeatured) ||
    b.project.year - a.project.year
  )
}

function mostFrequent(values: string[]): string | undefined {
  if (values.length === 0) return undefined
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

function unique<T>(values: T[], key: (value: T) => string | number): T[] {
  const seen = new Set<string | number>()
  const result: T[] = []
  for (const value of values) {
    const id = key(value)
    if (seen.has(id)) continue
    seen.add(id)
    result.push(value)
  }
  return result
}
