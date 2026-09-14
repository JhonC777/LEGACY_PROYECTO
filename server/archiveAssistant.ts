import type { IncomingMessage, ServerResponse } from 'node:http'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODELS = ['claude-sonnet-4-5', 'claude-sonnet-4-6', 'claude-sonnet-5']
const MAX_QUERY = 800
const MAX_PROJECTS = 28
const MAX_HISTORY = 8
const FIELD_CLIP = 560

export type AssistantStatus = 'ok' | 'overview' | 'no-results' | 'empty-archive'

export type AssistantApiResult = {
  status: AssistantStatus
  text: string
  projectIds: string[]
  resources: AssistantResource[]
  source: 'gemini' | 'claude' | 'local'
}

type AssistantResourceKind = 'ficha' | 'video' | 'pdf' | 'doc'

type AssistantResource = {
  kind: AssistantResourceKind
  label: string
  href: string
  projectId: string
}

type CorpusItem = {
  id: string
  institutionId: string
  title: string
  subtitle?: string
  year?: number
  area?: string
  category?: string
  collection?: string
  tags?: string[]
  authors?: string[]
  description?: string
  problem?: string
  solution?: string
  methodology?: string
  results?: string
  ficha?: string
  video?: string
  pdf?: string
  doc?: string
}

type HistoryTurn = { role: 'user' | 'assistant'; text: string }

type RequestPayload = {
  query: string
  institution: { id: string; name: string; shortName: string; slug: string }
  projects: CorpusItem[]
  history?: HistoryTurn[]
}

type AssistantConfig = {
  geminiKey: string
  geminiModel?: string
  anthropicKey: string
  anthropicModel?: string
}

export function providerFor(config: AssistantConfig): 'gemini' | 'claude' | null {
  if (config.geminiKey.trim()) return 'gemini'
  return null
}

export async function handleArchiveAssistantRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: AssistantConfig,
) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    write(res, 204, cors)
    return
  }

  if (req.method === 'GET') {
    const provider = providerFor(config)
    write(res, 200, cors, { configured: Boolean(provider), provider })
    return
  }

  if (req.method !== 'POST') {
    write(res, 405, cors, { error: 'method_not_allowed' })
    return
  }

  const provider = providerFor(config)
  if (!provider) {
    write(res, 503, cors, { error: 'not_configured' })
    return
  }

  let payload: unknown
  try {
    payload = await readJson(req)
  } catch {
    write(res, 400, cors, { error: 'invalid_json' })
    return
  }

  const parsed = parsePayload(payload)
  if (!parsed) {
    write(res, 400, cors, { error: 'invalid_payload' })
    return
  }

  if (parsed.projects.length === 0) {
    write(res, 200, cors, {
      status: 'empty-archive',
      text: `Esta institución todavía no tiene proyectos publicados en el archivo.`,
      projectIds: [],
      resources: [],
      source: provider,
    } satisfies AssistantApiResult)
    return
  }

  try {
    const result =
      provider === 'gemini' ? await consultGemini(parsed, config) : await consultClaude(parsed, config)
    write(res, 200, cors, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'claude_failed'
    const status =
      message === 'authentication_error'
        ? 401
        : message === 'billing_error'
          ? 402
          : 502
    const publicMessage =
      message === 'billing_error'
        ? 'Claude no tiene crédito en Anthropic. Carga saldo en Plans & Billing y vuelve a preguntar.'
        : message === 'tls_error'
          ? 'El equipo bloqueó el certificado al hablar con la IA. Reinicia con npm run dev.'
          : message === 'authentication_error'
            ? 'La clave de la IA no es válida.'
          : message
    write(res, status, cors, { error: message, message: publicMessage })
  }
}

async function consultClaude(
  payload: RequestPayload,
  config: AssistantConfig,
): Promise<AssistantApiResult> {
  const models = unique([
    config.anthropicModel?.trim() || '',
    ...DEFAULT_MODELS,
  ].filter(Boolean))

  let lastError: Error | null = null
  for (const model of models) {
    try {
      return await callClaude(payload, config.anthropicKey, model, false)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('claude_failed')
      if (lastError.message === 'authentication_error') throw lastError
      if (lastError.message === 'billing_error') throw lastError
      if (lastError.message === 'tls_error') throw lastError
      if (lastError.message === 'thinking_unsupported') {
        try {
          return await callClaude(payload, config.anthropicKey, model, false)
        } catch (retryError) {
          lastError = retryError instanceof Error ? retryError : lastError
        }
      }
    }
  }
  throw lastError ?? new Error('claude_failed')
}

async function callClaude(
  payload: RequestPayload,
  apiKey: string,
  model: string,
  disableThinking: boolean,
): Promise<AssistantApiResult> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: 1600,
    system: systemPrompt(payload),
    messages: buildMessages(payload),
  }
  if (disableThinking) {
    body.thinking = { type: 'disabled' }
  }

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    const cause = error instanceof Error ? String((error as Error & { cause?: { code?: string } }).cause?.code ?? error.message) : ''
    if (cause.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
      throw new Error('tls_error')
    }
    throw new Error('claude_failed')
  }

  const data = (await response.json()) as {
    type?: string
    error?: { type?: string; message?: string }
    content?: Array<{ type?: string; text?: string }>
  }

  if (!response.ok) {
    const kind = data.error?.type ?? ''
    const message = (data.error?.message ?? '').toLowerCase()
    if (kind === 'authentication_error' || response.status === 401) {
      throw new Error('authentication_error')
    }
    if (
      message.includes('credit') ||
      message.includes('billing') ||
      message.includes('too low')
    ) {
      throw new Error('billing_error')
    }
    if (kind === 'not_found_error' || response.status === 404) {
      throw new Error('model_not_found')
    }
    if (message.includes('thinking') || message.includes('output_config')) {
      throw new Error('thinking_unsupported')
    }
    throw new Error(kind || 'claude_failed')
  }

  const text = (data.content ?? [])
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text ?? '')
    .join('\n')
    .trim()

  return normalizeResult(text, payload)
}

function systemPrompt(payload: RequestPayload) {
  const { institution } = payload
  const small = isSmallTalk(payload.query)
  const voice = [
    `Eres el archivo vivo de ${institution.name}. No eres un boletín, ni un recepcionista, ni un filtro.`,
    'Hablas como alguien que ya se leyó las fichas: cercano, breve, con pulso. Tuteas. Español de conversación, no de informe.',
    'Frase de casa: los archivos no se guardan, trascienden. Úsala solo si encaja, nunca de eslogan.',
    'Si te saludan o preguntan cómo estás: una o dos frases con vida. No recites el catálogo. Invita a preguntar por un proyecto, un video o un tema.',
    'Si piden un resumen o una duda: responde de fondo (problema, cómo lo hicieron, qué quedó) en 2 o 3 frases. Luego el atajo.',
    'Si piden panorama: tres toques, no un inventario.',
  ]
  const rules = [
    `Solo esta institución (${institution.slug}). No inventes premios, autores reales, cifras oficiales ni URLs.`,
    'El contenido es demo: dilo una vez si hace falta, no en cada mensaje.',
    'No des tutoría genérica ni cuentas. Si no hay ficha, dilo y manda al catálogo.',
    'Sin emojis. Sin «estimado invitado». Sin «estoy disponible para». Sin listar las doce fichas de un tirón.',
    small
      ? 'Este turno es charla. projectIds y resources vacíos.'
      : 'Si citas fichas, projectIds 1 a 3. resources solo si aportan (video, pdf, ficha) y con href copiado del JSON.',
    'JSON únicamente, sin markdown:',
    '{"status":"ok"|"overview"|"no-results","text":"...","projectIds":[],"resources":[]}',
  ]
  return [...voice, ...rules].join('\n')
}

function isSmallTalk(query: string) {
  return /^(hola|hey|buenas|buen[oa]s?(\s+d[ií]as?|\s+tardes?|\s+noches?)?|qué tal|que tal|cómo estás|como estas|cómo te va|como te va|qué más|que mas|gracias|ok|vale|listo|sí|si)[\s!¡?¿.]*$/i.test(
    query.trim(),
  )
}

function buildMessages(payload: RequestPayload) {
  const allowed = new Set(payload.projects.map((project) => project.id))
  const history = (payload.history ?? [])
    .filter((turn) => (turn.role === 'user' || turn.role === 'assistant') && turn.text.trim())
    .slice(-MAX_HISTORY)

  const catalog = isSmallTalk(payload.query)
    ? {
        modo: 'charla',
        fichas: payload.projects.length,
        areas: unique(payload.projects.map((project) => project.area ?? '').filter(Boolean)).slice(0, 6),
        destellos: payload.projects.slice(0, 3).map((project) => ({
          id: project.id,
          title: project.title,
          year: project.year,
        })),
      }
    : payload.projects.map((project) => ({
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    year: project.year,
    area: project.area,
    category: project.category,
    collection: project.collection,
    tags: project.tags,
    authors: project.authors,
    description: project.description,
    problem: project.problem,
    solution: project.solution,
    methodology: project.methodology,
    results: project.results,
    ficha: project.ficha,
    video: project.video,
    pdf: project.pdf,
    doc: project.doc,
  }))

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const turn of history) {
    messages.push({
      role: turn.role,
      content: clip(turn.text, turn.role === 'user' ? MAX_QUERY : 1400),
    })
  }

  const small = isSmallTalk(payload.query)
  const userBlock = small
    ? `El invitado dice: «${payload.query}». Responde con vida, corto. Contexto: ${JSON.stringify(catalog)}`
    : [
        `Consulta del invitado:\n${payload.query}`,
        `Fichas publicadas de ${payload.institution.shortName} (ids permitidos: ${[...allowed].join(', ')}):`,
        JSON.stringify(catalog),
      ].join('\n\n')

  const last = messages[messages.length - 1]
  if (last?.role === 'user') {
    messages[messages.length - 1] = { role: 'user', content: `${last.content}\n\n${userBlock}` }
  } else {
    messages.push({ role: 'user', content: userBlock })
  }

  return messages
}

function normalizeResult(raw: string, payload: RequestPayload): AssistantApiResult {
  const allowed = new Set(payload.projects.map((project) => project.id))
  const parsed = parseModelJson(raw)
  const small = isSmallTalk(payload.query)
  const projectIds = small
    ? []
    : (parsed.projectIds ?? []).filter((id) => allowed.has(id)).slice(0, 3)
  const status = small ? 'ok' : asStatus(parsed.status, projectIds.length)
  const text =
    clip(parsed.text || fallbackText(payload, status), small ? 420 : 2200) ||
    fallbackText(payload, status)

  return {
    status,
    text,
    projectIds,
    resources: small
      ? []
      : sanitizeResources(parsed.resources, payload.projects, projectIds),
    source: 'claude',
  }
}

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
]

async function consultGemini(
  payload: RequestPayload,
  config: AssistantConfig,
): Promise<AssistantApiResult> {
  const models = unique([
    config.geminiModel?.trim() || '',
    ...GEMINI_MODELS,
  ].filter(Boolean))

  let lastError: Error | null = null
  for (const model of models) {
    try {
      return await callGemini(payload, config.geminiKey, model)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('gemini_failed')
      if (lastError.message === 'authentication_error') throw lastError
      if (lastError.message === 'tls_error') throw lastError
    }
  }
  throw lastError ?? new Error('gemini_failed')
}

async function callGemini(
  payload: RequestPayload,
  apiKey: string,
  model: string,
): Promise<AssistantApiResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  const contents = buildMessages(payload).map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }))

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(payload) }] },
        contents,
        generationConfig: {
          maxOutputTokens: isSmallTalk(payload.query) ? 500 : 1600,
          temperature: isSmallTalk(payload.query) ? 0.85 : 0.6,
          responseMimeType: 'application/json',
        },
      }),
    })
  } catch (error) {
    const cause =
      error instanceof Error
        ? String((error as Error & { cause?: { code?: string } }).cause?.code ?? error.message)
        : ''
    if (cause.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
      throw new Error('tls_error')
    }
    throw new Error('gemini_failed')
  }

  const data = (await response.json()) as {
    error?: { status?: string; message?: string; code?: number }
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
      finishReason?: string
    }>
  }

  if (!response.ok) {
    const message = (data.error?.message ?? '').toLowerCase()
    const status = data.error?.status ?? ''
    if (response.status === 400 && message.includes('api key')) {
      throw new Error('authentication_error')
    }
    if (response.status === 403 || status === 'PERMISSION_DENIED') {
      throw new Error('authentication_error')
    }
    if (response.status === 404 || message.includes('not found')) {
      throw new Error('model_not_found')
    }
    throw new Error(status || 'gemini_failed')
  }

  const text = (data.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('gemini_failed')
  }

  return { ...normalizeResult(text, payload), source: 'gemini' }
}

function parseModelJson(raw: string): {
  status?: string
  text?: string
  projectIds?: string[]
  resources?: Array<{ kind?: string; label?: string; href?: string; projectId?: string }>
} {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced?.[1] ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) return { text: trimmed }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as {
      status?: string
      text?: string
      projectIds?: string[]
      resources?: Array<{ kind?: string; label?: string; href?: string; projectId?: string }>
    }
  } catch {
    return { text: trimmed }
  }
}

function sanitizeResources(
  incoming: Array<{ kind?: string; label?: string; href?: string; projectId?: string }> | undefined,
  projects: CorpusItem[],
  projectIds: string[],
): AssistantResource[] {
  const byId = new Map(projects.map((project) => [project.id, project]))
  const kinds: AssistantResourceKind[] = ['ficha', 'video', 'pdf', 'doc']
  const labels: Record<AssistantResourceKind, string> = {
    ficha: 'Ficha',
    video: 'Video',
    pdf: 'PDF',
    doc: 'Documento',
  }
  const seen = new Set<string>()
  const result: AssistantResource[] = []

  const push = (kind: AssistantResourceKind, href: string, projectId: string, label?: string) => {
    if (!href) return
    const key = `${kind}:${href}`
    if (seen.has(key)) return
    seen.add(key)
    result.push({
      kind,
      href,
      projectId,
      label: label?.trim() || labels[kind],
    })
  }

  for (const raw of incoming ?? []) {
    const project = raw.projectId ? byId.get(raw.projectId) : undefined
    if (!project) continue
    const kind = kinds.find((item) => item === raw.kind)
    if (!kind || !raw.href) continue
    const allowed = resourceHref(project, kind)
    if (raw.href !== allowed) continue
    push(kind, raw.href, project.id, raw.label)
    if (result.length >= 6) return result
  }

  if (result.length === 0 && projectIds.length === 1) {
    for (const id of projectIds) {
      const project = byId.get(id)
      if (!project) continue
      for (const kind of kinds) {
        const href = resourceHref(project, kind)
        if (!href) continue
        push(kind, href, project.id)
        if (result.length >= 6) return result
      }
    }
  }

  return result
}

function resourceHref(project: CorpusItem, kind: AssistantResourceKind) {
  if (kind === 'ficha') return project.ficha ?? ''
  if (kind === 'video') return project.video ?? ''
  if (kind === 'pdf') return project.pdf ?? ''
  return project.doc ?? ''
}

function asStatus(value: string | undefined, cited: number): AssistantStatus {
  if (value === 'no-results' || value === 'overview' || value === 'ok') return value
  return cited > 0 ? 'ok' : 'no-results'
}

function fallbackText(payload: RequestPayload, status: AssistantStatus) {
  if (status === 'no-results') {
    return `No encontré fichas publicadas en ${payload.institution.shortName} que coincidan con esa consulta. Puedes abrir el catálogo y recorrer el archivo publicado.`
  }
  return `Puedo orientarte con el archivo publicado de ${payload.institution.name}. El contenido es de demostración.`
}

function parsePayload(value: unknown): RequestPayload | null {
  if (!isRecord(value)) return null
  const query = typeof value.query === 'string' ? clip(value.query.trim(), MAX_QUERY) : ''
  if (!query) return null

  const institutionRaw = value.institution
  if (!isRecord(institutionRaw)) return null
  const institution = {
    id: str(institutionRaw.id),
    name: str(institutionRaw.name),
    shortName: str(institutionRaw.shortName) || str(institutionRaw.name),
    slug: str(institutionRaw.slug),
  }
  if (!institution.id || !institution.name || !institution.slug) return null

  const list = Array.isArray(value.projects) ? value.projects : []
  const projects = list
    .map((item) => asCorpusItem(item, institution.id))
    .filter((item): item is CorpusItem => Boolean(item))
    .slice(0, MAX_PROJECTS)

  const history = Array.isArray(value.history)
    ? value.history
        .map((item) => {
          if (!isRecord(item)) return null
          const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : null
          const text = typeof item.text === 'string' ? item.text.trim() : ''
          if (!role || !text) return null
          return { role, text } satisfies HistoryTurn
        })
        .filter((item): item is HistoryTurn => Boolean(item))
        .slice(-MAX_HISTORY)
    : []

  return { query, institution, projects, history }
}

function asCorpusItem(value: unknown, institutionId: string): CorpusItem | null {
  if (!isRecord(value)) return null
  const id = str(value.id)
  const title = str(value.title)
  const owner = str(value.institutionId)
  if (!id || !title || owner !== institutionId) return null
  return {
    id,
    institutionId: owner,
    title,
    subtitle: str(value.subtitle) || undefined,
    year: typeof value.year === 'number' ? value.year : undefined,
    area: str(value.area) || undefined,
    category: str(value.category) || undefined,
    collection: str(value.collection) || undefined,
    tags: stringList(value.tags),
    authors: stringList(value.authors),
    description: clip(str(value.description), FIELD_CLIP) || undefined,
    problem: clip(str(value.problem), FIELD_CLIP) || undefined,
    solution: clip(str(value.solution), FIELD_CLIP) || undefined,
    methodology: clip(str(value.methodology), FIELD_CLIP) || undefined,
    results: clip(str(value.results), FIELD_CLIP) || undefined,
    ficha: str(value.ficha) || str(value.href) || undefined,
    video: str(value.video) || undefined,
    pdf: str(value.pdf) || undefined,
    doc: str(value.doc) || undefined,
  }
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const items = value
    .map((item) => (typeof item === 'string' ? clip(item, 80) : ''))
    .filter(Boolean)
    .slice(0, 8)
  return items.length > 0 ? items : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}

function unique(values: string[]) {
  return [...new Set(values)]
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    if (chunks.reduce((sum, item) => sum + item.length, 0) > 350_000) {
      throw new Error('payload_too_large')
    }
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

function write(
  res: ServerResponse,
  status: number,
  headers: Record<string, string>,
  body?: unknown,
) {
  res.statusCode = status
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }
  if (body === undefined) {
    res.end()
    return
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}
