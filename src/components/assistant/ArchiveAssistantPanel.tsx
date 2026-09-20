import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  FileText,
  FileType2,
  FolderOpen,
  Play,
  SearchX,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import {
  catalogPathFor,
  suggestArchiveQueries,
  type ArchiveCitation,
  type ArchiveConsultStatus,
  type ArchiveResource,
} from '@/assistant/consultArchive'
import { askArchiveAssistant, assistantIsConfigured } from '@/assistant/askArchive'
import type { DemoInstitution, DemoProject } from '@/data/demoData'

type ArchiveAssistantPanelProps = {
  institution: DemoInstitution
  projects: readonly DemoProject[]
  open: boolean
  onClose: () => void
}

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string
      role: 'assistant'
      status: ArchiveConsultStatus | 'error'
      text: string
      citations: ArchiveCitation[]
      resources?: ArchiveResource[]
      catalogHref: string
    }

const EASE = [0.22, 1, 0.36, 1] as const

export function ArchiveAssistantPanel({
  institution,
  projects,
  open,
  onClose,
}: ArchiveAssistantPanelProps) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [claudeReady, setClaudeReady] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const retryQueryRef = useRef<string | null>(null)
  const requestIdRef = useRef(0)

  const catalogHref = catalogPathFor(institution)
  const suggestions = useMemo(() => suggestArchiveQueries(projects), [projects])
  const publishedCount = projects.length

  useEffect(() => {
    requestIdRef.current += 1
    setMessages([])
    setDraft('')
    setLoading(false)
    retryQueryRef.current = null
    setClaudeReady(null)
  }, [institution.id])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void assistantIsConfigured().then((ready) => {
      if (!cancelled) setClaudeReady(ready)
    })
    return () => {
      cancelled = true
    }
  }, [open, institution.id])

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.classList.add('legacy-modal-open')

    const focusTimer = window.setTimeout(() => {
      if (publishedCount > 0) inputRef.current?.focus()
      else closeRef.current?.focus()
    }, 40)

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), textarea:not(:disabled)',
        ),
      ].filter((node) => !node.hasAttribute('aria-hidden'))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.classList.remove('legacy-modal-open')
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose, publishedCount])

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTo({
      top: node.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [messages, loading, reduceMotion])

  const ask = (raw: string, asRetry = false) => {
    const value = raw.trim()
    if (!value || loading) return

    retryQueryRef.current = value
    const requestId = ++requestIdRef.current
    const history = messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .filter((message) => message.role === 'user' || message.status !== 'error')
      .slice(-8)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }))

    if (!asRetry) {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: 'user', text: value },
      ])
    } else {
      setMessages((current) => {
        const last = current[current.length - 1]
        if (last?.role === 'assistant' && last.status === 'error') {
          return current.slice(0, -1)
        }
        return current
      })
    }
    setDraft('')
    setLoading(true)

    void (async () => {
      try {
        const result = await askArchiveAssistant({
          query: value,
          institution,
          projects,
          history,
        })
        if (requestId !== requestIdRef.current) return
        if (result.source === 'local') setClaudeReady(false)
        if (result.source === 'gemini' || result.source === 'claude') setClaudeReady(true)
        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            status: result.status,
            text: result.text,
            citations: result.citations,
            resources: result.resources,
            catalogHref: result.catalogHref,
          },
        ])
      } catch (error) {
        if (requestId !== requestIdRef.current) return
        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            status: 'error',
            text:
              error instanceof Error
                ? error.message
                : 'No pude consultar el archivo. Puedes reintentar la misma pregunta.',
            citations: [],
            resources: [],
            catalogHref,
          },
        ])
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    })()
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    ask(draft)
  }

  const onComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      ask(draft)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="archive-assistant-root"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            className="archive-assistant-backdrop"
            aria-label="Cerrar el asistente del archivo"
            onClick={onClose}
          />

          <motion.aside
            ref={panelRef}
            id="archive-assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-assistant-title"
            className="archive-assistant-panel"
            initial={
              reduceMotion ? false : { opacity: 0, x: 28, y: 12 }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 18, y: 8 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            <header className="archive-assistant-head">
              <InstitutionLogo
                name={institution.name}
                logoUrl={institution.logoUrl}
                fallback={institution.shortName}
                accent={institution.accent}
                decorative
                className="header-avatar"
                imageClassName="bg-white/95 p-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="archive-assistant-kicker">
                  <span className="archive-assistant-live" aria-hidden />
                  En el aire
                </p>
                <h2
                  id="archive-assistant-title"
                  className="font-brand text-2xl leading-tight font-semibold text-legacy-white"
                >
                  El archivo te escucha
                </h2>
                <p className="truncate text-[11px] text-legacy-muted">
                  {institution.name} · solo fichas publicadas
                </p>
              </div>
              <span className="header-demo-pill">Archivo real</span>
              <button
                ref={closeRef}
                type="button"
                className="btn btn-ghost btn-sm shrink-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" aria-hidden />
                <span className="sr-only">Cerrar</span>
              </button>
            </header>

            <div
              ref={listRef}
              className="archive-assistant-thread"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.length === 0 && !loading ? (
                publishedCount === 0 ? (
                  <EmptyPanel
                    title="El archivo todavía está vacío"
                    description="Cuando existan proyectos publicados para esta institución, el asistente podrá consultarlos."
                    icon={FolderOpen}
                    href={catalogHref}
                    action="Abrir el catálogo"
                    onNavigate={onClose}
                  />
                ) : (
                  <WelcomePanel
                    institution={institution}
                    count={publishedCount}
                    suggestions={suggestions}
                    claudeReady={claudeReady}
                    onSuggest={ask}
                  />
                )
              ) : null}

              {messages.map((message) =>
                message.role === 'user' ? (
                  <p key={message.id} className="archive-assistant-user">
                    {message.text}
                  </p>
                ) : (
                  <AssistantBubble
                    key={message.id}
                    message={message}
                    onRetry={() => {
                      const last = retryQueryRef.current
                      if (last) ask(last, true)
                    }}
                    onNavigate={onClose}
                  />
                ),
              )}

              {loading ? <LoadingReply /> : null}
            </div>

            <form className="archive-assistant-composer" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="archive-assistant-input">
                Pregunta al archivo
              </label>
              <div className="archive-assistant-field">
                <textarea
                  ref={inputRef}
                  id="archive-assistant-input"
                  rows={2}
                  value={draft}
                  disabled={loading || publishedCount === 0}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder={
                    publishedCount === 0
                      ? 'Sin fichas publicadas por ahora'
                      : `Dime qué buscas. Un tema, un resumen, el video…`
                  }
                />
                <button
                  type="submit"
                  className="archive-assistant-send"
                  disabled={loading || publishedCount === 0 || !draft.trim()}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Enviar</span>
                </button>
              </div>
              <p className="archive-assistant-footnote">
                {claudeReady === true
                  ? 'Hablo solo con el archivo publicado de esta institución.'
                  : claudeReady === false
                    ? 'Sin clave de Gemini el archivo se consulta en local. Añade GEMINI_API_KEY en .env.local y reinicia Vite.'
                    : 'Solo fichas publicadas de esta institución.'}
              </p>
            </form>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

function WelcomePanel({
  institution,
  count,
  suggestions,
  claudeReady,
  onSuggest,
}: {
  institution: DemoInstitution
  count: number
  suggestions: string[]
  claudeReady: boolean | null
  onSuggest: (value: string) => void
}) {
  return (
    <div className="archive-assistant-welcome">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-legacy-gold uppercase">
        Archivo de {institution.shortName}
      </p>
      <p className="mt-2 font-brand text-[1.65rem] leading-tight font-semibold text-legacy-white">
        Pregunta. Yo ya me leí las fichas.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-legacy-muted">
        {claudeReady === true
          ? `Estoy despierto con ${count} fichas publicadas. Pregúntame cómo a alguien que ya se las leyó: un resumen, una duda, el video.`
          : claudeReady === false
            ? `Consulto ${count} fichas publicadas de esta institución. Para la IA gratis, añade GEMINI_API_KEY de Google AI Studio.`
            : `Consulto ${count} fichas publicadas de esta institución.`}
      </p>
      {suggestions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Consultas sugeridas">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="archive-assistant-chip"
              onClick={() => onSuggest(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function AssistantBubble({
  message,
  onRetry,
  onNavigate,
}: {
  message: Extract<ChatMessage, { role: 'assistant' }>
  onRetry: () => void
  onNavigate: () => void
}) {
  if (message.status === 'error') {
    return (
      <EmptyPanel
        title="No pude consultar el archivo"
        description={message.text}
        icon={AlertCircle}
        onAction={onRetry}
        action="Reintentar"
      />
    )
  }

  if (message.status === 'empty-archive') {
    return (
      <EmptyPanel
        title="El archivo todavía está vacío"
        description={message.text}
        icon={FolderOpen}
        href={message.catalogHref}
        action="Abrir el catálogo"
        onNavigate={onNavigate}
      />
    )
  }

  if (message.status === 'no-results') {
    return (
      <EmptyPanel
        title="Sin coincidencias en este archivo"
        description={message.text}
        icon={SearchX}
        href={message.catalogHref}
        action="Ir al catálogo"
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="archive-assistant-reply">
      {message.text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={`${message.id}-p-${index}`}>{paragraph}</p>
      ))}
      {message.resources && message.resources.length > 0 ? (
        <div className="archive-assistant-resources" aria-label="Atajos a recursos">
          {message.resources.map((resource) => (
            <ResourceChip
              key={`${resource.kind}-${resource.href}`}
              resource={resource}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
      {message.citations.length > 0 ? (
        <ul className="archive-assistant-citations">
          {message.citations.map((citation) => (
            <li key={citation.id}>
              <CitationCard citation={citation} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ResourceChip({
  resource,
  onNavigate,
}: {
  resource: ArchiveResource
  onNavigate: () => void
}) {
  const Icon =
    resource.kind === 'video'
      ? Play
      : resource.kind === 'pdf'
        ? FileType2
        : resource.kind === 'doc'
          ? FileText
          : ArrowRight
  const className = 'archive-assistant-resource'

  if (resource.external) {
    return (
      <a
        className={className}
        href={resource.href}
        target="_blank"
        rel="noreferrer"
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {resource.label}
      </a>
    )
  }

  return (
    <Link className={className} to={resource.href} onClick={onNavigate}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {resource.label}
    </Link>
  )
}

function CitationCard({
  citation,
  onNavigate,
}: {
  citation: ArchiveCitation
  onNavigate: () => void
}) {
  return (
    <Link to={citation.href} className="archive-assistant-citation" onClick={onNavigate}>
      <span className="archive-assistant-citation-meta">
        {citation.year}
        <span aria-hidden>·</span>
        {citation.area}
        {citation.collection ? (
          <>
            <span aria-hidden>·</span>
            {citation.collection}
          </>
        ) : null}
      </span>
      <strong>{citation.title}</strong>
      <span className="archive-assistant-citation-excerpt">{citation.excerpt}</span>
      <span className="archive-assistant-citation-go">
        Abrir ficha
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  )
}

function EmptyPanel({
  title,
  description,
  icon: Icon,
  href,
  action,
  onAction,
  onNavigate,
}: {
  title: string
  description: string
  icon: typeof FolderOpen
  href?: string
  action: string
  onAction?: () => void
  onNavigate?: () => void
}) {
  return (
    <div className="archive-assistant-state">
      <span className="archive-assistant-state-icon" aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-brand text-xl font-semibold text-legacy-white">{title}</h3>
      <p>{description}</p>
      {onAction ? (
        <Button variant="primary" className="mt-4" onClick={onAction}>
          {action}
        </Button>
      ) : href ? (
        <Link to={href} className="btn btn-primary btn-sm mt-4" onClick={onNavigate}>
          {action}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  )
}

function LoadingReply() {
  return (
    <div className="archive-assistant-loading" aria-label="Consultando el archivo">
      <span />
      <span />
      <span />
    </div>
  )
}

function nextId() {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
