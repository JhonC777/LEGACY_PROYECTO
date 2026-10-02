/**
 * Acento público de Fe y Alegría.
 * El valor guardado (#6b5ce6) no se modifica: la interfaz lo sustituye.
 */

export const INSTITUTION_FILL = '#D20B12'
export const INSTITUTION_HOVER = '#B2090F'
export const INSTITUTION_TEXT = '#E05459'

const VIOLET_ACCENTS = new Set(['#6b5ce6', '#7662c9', '#5848d4'])

type AccentSource = {
  slug?: string
  accent?: string
} | null | undefined

export function isFeYAlegriaAccent(source: AccentSource) {
  if (!source) return false
  if (source.slug === 'fe-y-alegria') return true
  const accent = source.accent?.trim().toLowerCase()
  return Boolean(accent && VIOLET_ACCENTS.has(accent))
}

/** Relleno de botones y pastillas (texto blanco, 5.53:1 sobre #D20B12). */
export function institutionFill(source: AccentSource) {
  if (isFeYAlegriaAccent(source)) return INSTITUTION_FILL
  return source?.accent || INSTITUTION_FILL
}

/** Texto, enlaces y estados activos sobre fondo oscuro. #D20B12 no pasa AA. */
export function institutionText(source: AccentSource) {
  if (isFeYAlegriaAccent(source)) return INSTITUTION_TEXT
  return source?.accent || INSTITUTION_TEXT
}
