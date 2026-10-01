import type { Breadcrumb, BreadcrumbHint, Event, SpanJSON, StreamedSpanJSON } from '@sentry/core'

const REDACTED = '[redacted]'

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g
const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi
const SENSITIVE_ASSIGN_RE =
  /((?:access_token|refresh_token|id_token|apikey|api_key|api-key|authorization|password|passwd|secret|token)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|\S+)/gi
const INPUT_VALUE_RE = /(\svalue\s*=\s*)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const EMBEDDED_URL_RE = /(?:https?:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*)/g

const DROP_KEYS = new Set([
  'cookies',
  'cookie',
  'headers',
  'authorization',
  'set-cookie',
  'password',
  'passwd',
  'access_token',
  'refresh_token',
  'id_token',
  'apikey',
  'api_key',
  'api-key',
  'secret',
  'token',
  'body',
  'request_body',
  'response_body',
  'query_string',
  'fragment',
  'url.query',
  'url.fragment',
  'http.query',
  'input',
  'vars',
])

const URL_KEYS = new Set([
  'url',
  'url.full',
  'http.url',
  'to',
  'from',
  'href',
  'referrer',
  'request_url',
  'location',
])

const SKIP_KEYS = new Set(['sdk', 'sdkProcessingMetadata', 'debug_meta', 'modules'])

function replaceAll(value: string, pattern: RegExp, replacement: string): string
function replaceAll(
  value: string,
  pattern: RegExp,
  replacement: (match: string) => string,
): string
function replaceAll(
  value: string,
  pattern: RegExp,
  replacement: string | ((match: string) => string),
): string {
  pattern.lastIndex = 0
  if (typeof replacement === 'function') return value.replace(pattern, replacement)
  return value.replace(pattern, replacement)
}

/** Quita query, hash y credenciales de una URL. El path se conserva. */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/)
  const base = cut === -1 ? url : url.slice(0, cut)
  return replaceAll(replaceAll(replaceAll(base.replace(/\/\/[^/\s@]+@/, '//'), JWT_RE, REDACTED), BEARER_RE, `Bearer ${REDACTED}`), EMAIL_RE, REDACTED)
}

/** Redacta correos, JWT, Bearer y parámetros sensibles. Las URLs pierden query y hash. */
export function scrubSecrets(value: string): string {
  const withoutUrls = replaceAll(value, EMBEDDED_URL_RE, (url) => scrubUrl(url))
  return replaceAll(
    replaceAll(
      replaceAll(
        replaceAll(replaceAll(withoutUrls, JWT_RE, REDACTED), BEARER_RE, `Bearer ${REDACTED}`),
        SENSITIVE_ASSIGN_RE,
        `$1${REDACTED}`,
      ),
      EMAIL_RE,
      REDACTED,
    ),
    INPUT_VALUE_RE,
    `$1"${REDACTED}"`,
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function scrubUnknown(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') return scrubSecrets(value)
  if (typeof value !== 'object' || value === null) return value
  if (seen.has(value)) return value
  seen.add(value)

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      value[index] = scrubUnknown(value[index], seen)
    }
    return value
  }

  if (!isPlainObject(value)) return value

  for (const key of Object.keys(value)) {
    if (SKIP_KEYS.has(key)) continue
    if (DROP_KEYS.has(key) || DROP_KEYS.has(key.toLowerCase())) {
      delete value[key]
      continue
    }
    const current = value[key]
    if (typeof current === 'string' && (URL_KEYS.has(key) || URL_KEYS.has(key.toLowerCase()))) {
      value[key] = scrubUrl(current)
      continue
    }
    value[key] = scrubUnknown(current, seen)
  }

  return value
}

function isFormFieldTarget(hint?: BreadcrumbHint): boolean {
  const event = hint?.event as { target?: { tagName?: string } } | undefined
  const tag = event?.target?.tagName
  if (typeof tag !== 'string') return false
  const name = tag.toLowerCase()
  return name === 'input' || name === 'textarea' || name === 'select'
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb, hint?: BreadcrumbHint): Breadcrumb | null {
  if (breadcrumb.category === 'ui.input') return null
  if (isFormFieldTarget(hint)) return null
  if (typeof breadcrumb.message === 'string') {
    breadcrumb.message = scrubSecrets(breadcrumb.message)
  }
  if (breadcrumb.data) scrubUnknown(breadcrumb.data, new WeakSet())
  return breadcrumb
}

type FrameLike = { filename?: string; vars?: unknown }
type ExceptionLike = {
  value?: string
  type?: string
  stacktrace?: { frames?: FrameLike[] }
}

export function scrubErrorEvent<T extends Event>(event: T): T {
  const seen = new WeakSet<object>()

  if (typeof event.message === 'string') event.message = scrubSecrets(event.message)
  if (typeof event.transaction === 'string') event.transaction = scrubUrl(event.transaction)
  if (event.logentry && typeof event.logentry.message === 'string') {
    event.logentry.message = scrubSecrets(event.logentry.message)
  }

  if (event.request) {
    delete event.request.data
    delete event.request.cookies
    delete event.request.headers
    delete event.request.query_string
    if (typeof event.request.url === 'string') event.request.url = scrubUrl(event.request.url)
    if (event.request.env) scrubUnknown(event.request.env, seen)
  }

  if (event.user) {
    delete event.user.email
    delete event.user.ip_address
    if (typeof event.user.username === 'string') {
      event.user.username = scrubSecrets(event.user.username)
    }
  }

  const exceptions = event.exception?.values as ExceptionLike[] | undefined
  if (exceptions) {
    for (const item of exceptions) {
      if (typeof item.value === 'string') item.value = scrubSecrets(item.value)
      if (typeof item.type === 'string') item.type = scrubSecrets(item.type)
      const frames = item.stacktrace?.frames
      if (!frames) continue
      for (const frame of frames) {
        delete frame.vars
        if (typeof frame.filename === 'string') frame.filename = scrubUrl(frame.filename)
      }
    }
  }

  if (event.breadcrumbs) {
    const kept: Breadcrumb[] = []
    for (const crumb of event.breadcrumbs) {
      const next = scrubBreadcrumb(crumb)
      if (next) kept.push(next)
    }
    event.breadcrumbs = kept
  }

  if (event.spans) {
    for (const span of event.spans) scrubSpan(span)
  }

  if (event.extra) scrubUnknown(event.extra, seen)
  if (event.contexts) scrubUnknown(event.contexts, seen)
  if (event.tags) scrubUnknown(event.tags, seen)

  return event
}

export function scrubSpan<T extends SpanJSON | StreamedSpanJSON>(span: T): T {
  const loose = span as T & {
    description?: string
    name?: string
    data?: Record<string, unknown>
    attributes?: Record<string, unknown>
  }
  if (typeof loose.description === 'string') loose.description = scrubUrl(loose.description)
  if (typeof loose.name === 'string') loose.name = scrubUrl(loose.name)
  if (loose.data) scrubUnknown(loose.data, new WeakSet())
  if (loose.attributes) scrubUnknown(loose.attributes, new WeakSet())
  return span
}
