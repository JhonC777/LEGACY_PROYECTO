import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Heart, LoaderCircle, MessageCircle, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  COMMENT_MODERATION_MESSAGE,
  moderateComment,
} from '@/lib/commentModeration'

type CommunityComment = {
  id: string
  display_name: string
  body: string
  created_at: string
}

type CommunityStats = {
  project_id: string
  like_count: number
  comment_count: number
  liked_by_me: boolean
}

const ALIAS_KEY = 'legacy.community.alias'

function friendlyError(error: { message?: string; code?: string }) {
  const message = (error.message ?? '').toLowerCase()
  if (message.includes('comment_language_blocked')) return COMMENT_MODERATION_MESSAGE
  if (message.includes('comment_rate_limited')) return 'Has publicado varios comentarios seguidos. Espera unos minutos.'
  if (message.includes('anonymous') || message.includes('captcha')) {
    return 'No se pudo iniciar la sesión de visitante. La autenticación anónima debe estar habilitada en LEGACY.'
  }
  if (message.includes('does not exist') || error.code === 'PGRST202' || error.code === '42P01') {
    return 'La comunidad aún no está activada en la base de datos de LEGACY.'
  }
  if (message.includes('row-level security') || error.code === '42501') {
    return 'La base de datos rechazó esta acción por permisos. Revisa la configuración de la comunidad.'
  }
  return 'No se pudo completar la acción. Comprueba tu conexión e inténtalo otra vez.'
}

async function ensureVisitorSession() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { data: current, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (current.session?.user) return current.session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  if (!data.user) throw new Error('No se pudo crear la sesión de visitante.')
  return data.user.id
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function ProjectCommunity({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [likes, setLikes] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [alias, setAlias] = useState(() => {
    try {
      return window.localStorage.getItem(ALIAS_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [databaseReady, setDatabaseReady] = useState(true)

  const refresh = useCallback(async () => {
    if (!supabase) {
      setDatabaseReady(false)
      setLoading(false)
      return
    }

    const [statsResult, commentsResult] = await Promise.all([
      supabase.rpc('get_project_community_stats', { project_ids: [projectId] }),
      supabase
        .from('project_comments')
        .select('id, display_name, body, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (statsResult.error || commentsResult.error) {
      setDatabaseReady(false)
      const loadError = statsResult.error ?? commentsResult.error
      setNotice(friendlyError(loadError ?? {}))
      setLoading(false)
      return
    }

    const stat = ((statsResult.data ?? []) as CommunityStats[])[0]
    setLikes(Number(stat?.like_count ?? 0))
    setCommentCount(Number(stat?.comment_count ?? 0))
    setLiked(Boolean(stat?.liked_by_me))
    setComments((commentsResult.data ?? []) as CommunityComment[])
    setDatabaseReady(true)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleLike = async () => {
    if (!supabase || busy || !databaseReady) return
    setBusy(true)
    setNotice('')
    try {
      const userId = await ensureVisitorSession()
      if (liked) {
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('project_likes')
          .insert({ project_id: projectId, user_id: userId })
        if (error && error.code !== '23505') throw error
      }
      await refresh()
    } catch (error) {
      setNotice(friendlyError(error as { message?: string; code?: string }))
    } finally {
      setBusy(false)
    }
  }

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || busy || !databaseReady) return

    const cleanAlias = alias.trim().replace(/\s+/g, ' ')
    const cleanBody = body.trim()
    if (cleanAlias.length < 2 || cleanAlias.length > 24) {
      setNotice('Escribe un alias de entre 2 y 24 caracteres.')
      return
    }
    const moderation = moderateComment(cleanBody)
    if (!moderation.allowed) {
      setNotice(
        moderation.reason === 'language'
          ? COMMENT_MODERATION_MESSAGE
          : moderation.reason === 'too_long'
            ? 'El comentario no puede superar los 1.200 caracteres.'
            : 'Escribe un comentario antes de publicarlo.',
      )
      return
    }
    if (!moderateComment(cleanAlias).allowed) {
      setNotice('Ese alias contiene lenguaje no permitido. Usa otro.')
      return
    }

    setBusy(true)
    setNotice('')
    try {
      const userId = await ensureVisitorSession()
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId,
        author_id: userId,
        display_name: cleanAlias,
        body: cleanBody,
      })
      if (error) throw error
      try {
        window.localStorage.setItem(ALIAS_KEY, cleanAlias)
      } catch {
        // La publicación no depende de que el navegador permita guardar el alias.
      }
      setAlias(cleanAlias)
      setBody('')
      await refresh()
      setNotice('Tu comentario quedó publicado.')
    } catch (error) {
      setNotice(friendlyError(error as { message?: string; code?: string }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 pb-14 lg:px-8" aria-labelledby="community-title">
      <div className="overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-[linear-gradient(135deg,rgba(214,184,120,0.075),rgba(17,19,26,0.96)_42%)] shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:p-9">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#d6b878]">
              Comunidad LEGACY
            </p>
            <h2 id="community-title" className="mt-2 font-brand text-3xl font-semibold text-[#f7f5ef]">
              Una conversación sobre el proyecto.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#a6a8b2]">
              Reconoce el trabajo detrás de cada idea y comparte una opinión respetuosa.
            </p>

            <button
              type="button"
              onClick={() => void toggleLike()}
              disabled={busy || loading || !databaseReady}
              aria-pressed={liked}
              className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border border-[#d6b878]/30 bg-[#d6b878]/[0.08] px-5 text-sm font-medium text-[#f0d9a0] transition hover:border-[#d6b878]/65 hover:bg-[#d6b878]/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} aria-hidden />
              )}
              {liked ? 'Te gusta este proyecto' : 'Me gusta este proyecto'}
              <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs tabular-nums">{likes}</span>
            </button>

            <div className="mt-5 flex items-center gap-2 text-xs text-[#858894]">
              <MessageCircle className="h-4 w-4 text-[#d6b878]" aria-hidden />
              {commentCount} {commentCount === 1 ? 'comentario' : 'comentarios'}
            </div>
            <p className="mt-6 max-w-sm text-[0.72rem] leading-5 text-[#777b87]">
              Participas con un alias, sin correo ni registro tradicional. Tu alias y comentario serán visibles públicamente.
            </p>
          </div>

          <div className="min-w-0">
            <form onSubmit={submitComment} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 sm:p-5">
              <label htmlFor={`community-alias-${projectId}`} className="mb-2 block text-xs font-medium text-[#d8d9df]">
                Tu alias
              </label>
              <input
                id={`community-alias-${projectId}`}
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                maxLength={24}
                minLength={2}
                placeholder="Ej. Visitante 01"
                autoComplete="nickname"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0d12] px-3 text-sm text-[#f7f5ef] outline-none transition placeholder:text-[#666a75] focus:border-[#d6b878]/60"
              />

              <label htmlFor={`community-comment-${projectId}`} className="mb-2 mt-4 block text-xs font-medium text-[#d8d9df]">
                Comentario
              </label>
              <textarea
                id={`community-comment-${projectId}`}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={1200}
                rows={4}
                placeholder="Comparte una observación sobre el proyecto..."
                className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-3 text-sm leading-6 text-[#f7f5ef] outline-none transition placeholder:text-[#666a75] focus:border-[#d6b878]/60"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[0.68rem] tabular-nums text-[#777b87]">{body.length}/1200</span>
                <button
                  type="submit"
                  disabled={busy || loading || !databaseReady || !alias.trim() || !body.trim()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#d6b878] px-4 text-xs font-semibold text-[#17130c] transition hover:bg-[#f0d9a0] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
                  Publicar comentario
                </button>
              </div>
            </form>

            {notice ? (
              <p role="status" aria-live="polite" className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-xs leading-5 text-[#d6c9a9]">
                {notice}
              </p>
            ) : null}

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#f0eee8]">Voces del archivo</h3>
                <span className="text-[0.68rem] text-[#777b87]">Más recientes</span>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-7 text-xs text-[#858894]">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  Cargando conversación...
                </div>
              ) : !databaseReady ? (
                <p className="rounded-xl border border-white/[0.07] bg-black/15 px-4 py-5 text-xs leading-5 text-[#858894]">
                  La sección ya está preparada. Falta activar su estructura en Supabase para recibir participaciones.
                </p>
              ) : comments.length === 0 ? (
                <p className="rounded-xl border border-white/[0.07] bg-black/15 px-4 py-5 text-xs text-[#858894]">
                  Todavía no hay comentarios. Puedes iniciar la conversación.
                </p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li key={comment.id} className="rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#e9d5a7]">{comment.display_name}</span>
                        <time dateTime={comment.created_at} className="text-[0.65rem] text-[#777b87]">
                          {formatDate(comment.created_at)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#c8cad3]">{comment.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
