/**
 * Moderación preventiva de comentarios públicos de LEGACY.
 *
 * Esta validación mejora la experiencia en el navegador, pero no sustituye
 * la validación autoritativa de PostgreSQL (ver migración SQL).
 */

export type CommentModerationResult =
  | { allowed: true; normalizedText: string }
  | { allowed: false; reason: 'empty' | 'too_long' | 'language'; normalizedText: string }

const MAX_COMMENT_LENGTH = 1200

// Insultos directos, ataques discriminatorios y expresiones de acoso comunes.
// Mantener este vocabulario deliberadamente acotado reduce falsos positivos.
const BLOCKED_TERMS = [
  'abortado', 'analfabeta de mierda', 'asqueroso', 'baboso', 'bestia',
  'bruto', 'cabron', 'cabrón', 'carechimba', 'caremonda', 'chupa pija',
  'chupapija', 'cojudo', 'come mierda', 'comemierda', 'culero', 'estupida',
  'estúpida', 'estupido', 'estúpido', 'fuck you', 'gillipollas', 'gilipollas',
  'gonorrea', 'hijueputa', 'hijo de puta', 'hp', 'idiota de mierda',
  'imbecil', 'imbécil', 'imbecil de mierda', 'imbécil de mierda',
  'mal nacido', 'malparida', 'malparido', 'maricon', 'maricón',
  'mierda', 'mongolico', 'mongólico', 'perra', 'perra hp', 'pendeja',
  'pendejo', 'puta', 'puto', 'ramera', 'retrasado', 'retrasada',
  'sidoso', 'subnormal', 'tarado', 'zorra',
] as const

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  '$': 's',
  '7': 't',
  '8': 'b',
}

export function normalizeCommentForModeration(value: string): string {
  let normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')

  normalized = Array.from(normalized, (character) => LEET_MAP[character] ?? character).join('')

  // Une letras separadas por signos/espacios: h.i.j.u.e.p.u.t.a -> hijueputa.
  // Los espacios entre palabras normales se conservan para evitar unir frases.
  normalized = normalized.replace(/([a-z])(?:[\s._*\-·•|/\\])+([a-z])/g, '$1$2')
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1')
  return normalized.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

const BLOCKED_NORMALIZED = BLOCKED_TERMS.map(normalizeCommentForModeration)

export function moderateComment(value: string): CommentModerationResult {
  const normalizedText = normalizeCommentForModeration(value)

  if (!normalizedText) return { allowed: false, reason: 'empty', normalizedText }
  if (value.trim().length > MAX_COMMENT_LENGTH) {
    return { allowed: false, reason: 'too_long', normalizedText }
  }

  const padded = ` ${normalizedText} `
  const containsBlockedLanguage = BLOCKED_NORMALIZED.some((term) =>
    padded.includes(` ${term} `),
  )

  if (containsBlockedLanguage) {
    return { allowed: false, reason: 'language', normalizedText }
  }

  return { allowed: true, normalizedText }
}

export const COMMENT_MODERATION_MESSAGE =
  'Tu comentario contiene lenguaje no permitido. Revísalo e inténtalo nuevamente.'
