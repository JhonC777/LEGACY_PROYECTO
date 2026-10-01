/**
 * Solo se monta fuera de producción (dev o preview de Vercel).
 * El query `?sentry-test=1` dispara un error de render para probar el boundary.
 */
export function SentryTestGate() {
  if (!__LEGACY_SENTRY_TEST__) return null
  if (new URLSearchParams(window.location.search).get('sentry-test') === '1') {
    throw new Error('LEGACY Sentry verification')
  }
  return null
}
