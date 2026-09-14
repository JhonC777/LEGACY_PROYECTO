import {
  catalogPathFor,
  citationsFromIds,
  consultArchive,
  resourcesForProject,
  resourcesFromIds,
  type ArchiveConsultResult,
  type ArchiveResource,
} from '@/assistant/consultArchive'
import { getProjectHref, type DemoInstitution, type DemoProject } from '@/data/demoData'

export type AssistantHistoryTurn = { role: 'user' | 'assistant'; text: string }

type AskInput = {
  query: string
  institution: DemoInstitution
  projects: readonly DemoProject[]
  history?: AssistantHistoryTurn[]
}

type RemoteResult = {
  status?: ArchiveConsultResult['status']
  text?: string
  projectIds?: string[]
  source?: ArchiveConsultResult['source']
  resources?: Array<{
    kind?: ArchiveResource['kind']
    label?: string
    href?: string
    projectId?: string
  }>
  error?: string
  message?: string
}

const FIELD_CLIP = 560

export async function assistantIsConfigured() {
  try {
    const response = await fetch('/api/assistant')
    if (!response.ok) return false
    const data = (await response.json()) as { configured?: boolean; provider?: string }
    return Boolean(data.configured && data.provider === 'gemini')
  } catch {
    return false
  }
}

export async function askArchiveAssistant({
  query,
  institution,
  projects,
  history = [],
}: AskInput): Promise<ArchiveConsultResult> {
  const local = consultArchive({ query, institution, projects })
  if (local.status === 'empty-archive') return { ...local, source: 'local' }

  const corpus = toCorpus(institution, projects)
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      institution: {
        id: institution.id,
        name: institution.name,
        shortName: institution.shortName,
        slug: institution.slug,
      },
      projects: corpus,
      history: history.slice(-8).map((turn) => ({
        role: turn.role,
        text: turn.text,
      })),
    }),
  })

  if (response.status === 503 || response.status === 404) {
    return { ...local, source: 'local' }
  }
  if (response.status === 401) {
    throw new Error('La clave de Gemini no es válida.')
  }
  if (response.status === 402) {
    const data = (await response.json().catch(() => ({}))) as { message?: string }
    throw new Error(
      data.message ||
        'Claude no tiene crédito en Anthropic. Carga saldo en Plans & Billing y vuelve a preguntar.',
    )
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string }
    throw new Error(
      data.message || 'No pude consultar la IA. Puedes reintentar la misma pregunta.',
    )
  }

  const remote = (await response.json()) as RemoteResult
  const status = remote.status ?? 'ok'
  const catalogHref = catalogPathFor(institution)
  const citations =
    status === 'no-results' || status === 'empty-archive'
      ? []
      : citationsFromIds(remote.projectIds ?? [], institution, projects)
  const resources =
    status === 'no-results' || status === 'empty-archive'
      ? []
      : sanitizeResources(remote.resources, institution, projects, remote.projectIds ?? [])

  return {
    status,
    catalogHref,
    citations,
    resources,
    text: remote.text?.trim() || local.text,
    source: remote.source === 'gemini' || remote.source === 'claude' ? remote.source : 'gemini',
  }
}

function sanitizeResources(
  incoming: RemoteResult['resources'],
  institution: DemoInstitution,
  projects: readonly DemoProject[],
  projectIds: string[],
): ArchiveResource[] {
  const allowed = new Map(
    projects
      .filter(
        (project) =>
          project.status === 'published' && project.institutionId === institution.id,
      )
      .map((project) => [project.id, resourcesForProject(project)]),
  )

  const hrefByProject = new Map(
    [...allowed.entries()].map(([id, items]) => [
      id,
      new Map(items.map((item) => [`${item.kind}:${item.href}`, item])),
    ]),
  )

  const seen = new Set<string>()
  const result: ArchiveResource[] = []

  for (const raw of incoming ?? []) {
    if (!raw?.projectId || !raw.href || !raw.kind) continue
    const catalog = hrefByProject.get(raw.projectId)
    if (!catalog) continue
    const exact = catalog.get(`${raw.kind}:${raw.href}`)
    const byHref = [...catalog.values()].find((item) => item.href === raw.href)
    const resource = exact ?? byHref
    if (!resource) continue
    const key = `${resource.kind}:${resource.href}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      ...resource,
      label: raw.label?.trim() || resource.label,
    })
    if (result.length >= 8) return result
  }

  if (result.length === 0 && projectIds.length === 1) {
    return resourcesFromIds(projectIds, institution, projects)
  }
  return result
}

function toCorpus(institution: DemoInstitution, projects: readonly DemoProject[]) {
  return projects
    .filter(
      (project) =>
        project.status === 'published' && project.institutionId === institution.id,
    )
    .slice(0, 28)
    .map((project) => {
      const links = resourcesForProject(project)
      const pick = (kind: ArchiveResource['kind']) =>
        links.find((item) => item.kind === kind)?.href
      return {
        id: project.id,
        institutionId: project.institutionId,
        title: project.title,
        subtitle: clip(project.subtitle, 160),
        year: project.year,
        area: project.area,
        category: project.category,
        collection: project.collection,
        tags: project.tags.slice(0, 8),
        authors: project.authors
          .map((author) => [author.name, author.role].filter(Boolean).join(' · '))
          .filter(Boolean)
          .slice(0, 8),
        description: clip(project.description, FIELD_CLIP),
        problem: clip(project.problem, FIELD_CLIP),
        solution: clip(project.solution, FIELD_CLIP),
        methodology: clip(project.methodology, FIELD_CLIP),
        results: clip(project.results, FIELD_CLIP),
        href: getProjectHref(project),
        ficha: pick('ficha'),
        video: pick('video'),
        pdf: pick('pdf'),
        doc: pick('doc'),
      }
    })
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}
