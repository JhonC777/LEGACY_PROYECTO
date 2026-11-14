/**
 * Filtro preventivo de lenguaje ofensivo para la comunidad pública de LEGACY.
 * La validación definitiva también vive en PostgreSQL.
 */

export type CommentModerationResult =
  | { allowed: true; normalizedText: string }
  | { allowed: false; reason: 'empty' | 'too_long' | 'language'; normalizedText: string }

const MAX_COMMENT_LENGTH = 1200
const BLOCKED_TERMS = [
  'abortado', 'analfabeta de mierda', 'asqueroso', 'baboso', 'bestia',
  'bruto', 'cabron', 'carechimba', 'caremonda', 'chupa pija', 'chupapija',
  'cojudo', 'come mierda', 'comemierda', 'culero', 'estupida', 'estupido',
  'fuck you', 'gillipollas', 'gilipollas', 'gonorrea', 'hijueputa',
  'hijo de puta', 'hp', 'idiota de mierda', 'imbecil', 'imbecil de mierda',
  'mal nacido', 'malparida', 'malparido', 'maricon', 'mierda', 'mongolico',
  'perra', 'perra hp', 'pendeja', 'pendejo', 'puta', 'puto', 'ramera',
  'retrasado', 'retrasada', 'sidoso', 'subnormal', 'tarado', 'zorra',
] as const

const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a',
  '5': 's', '$': 's', '7': 't', '8': 'b',
}

export function normalizeCommentForModeration(value: string) {
  let normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')

  normalized = Array.from(normalized, (character) => LEET_MAP[character] ?? character).join('')
  normalized = normalized.replace(/([a-z])(?:[._*·•|/-])+([a-z])/g, '$1$2')
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1')
  return normalized.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

const BLOCKED_NORMALIZED = BLOCKED_TERMS.map(normalizeCommentForModeration)

export function moderateComment(value: string): CommentModerationResult {
  const normalizedText = normalizeCommentForModeration(value)
  if (!normalizedText) return { allowed: false, reason: 'empty', normalizedText }
  if (value.trim().length > MAX_COMMENT_LENGTH) return { allowed: false, reason: 'too_long', normalizedText }

  const padded = ` ${normalizedText} `
  if (BLOCKED_NORMALIZED.some((term) => padded.includes(` ${term} `))) {
    return { allowed: false, reason: 'language', normalizedText }
  }
  return { allowed: true, normalizedText }
}

export const COMMENT_MODERATION_MESSAGE =
  'Tu comentario contiene lenguaje no permitido. Revísalo e inténtalo nuevamente.'
