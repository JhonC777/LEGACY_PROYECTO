/** Vive solo en memoria de la SPA. Un F5 / nueva pestaña la borra. */

/**
 * Cinematic intro on `/`. Keep `LegacyIntro.tsx` + `intro.css` in the repo.
 * Flip to `true` when asked to plug the film back in.
 */
export const INTRO_ENABLED = false

let introSeenThisVisit = false

export function isActMode() {
  try {
    const query = new URLSearchParams(window.location.search)
    return query.get('act') === '1' || query.get('intro') === '1'
  } catch {
    return false
  }
}

export function hasSeenIntro() {
  return introSeenThisVisit
}

export function shouldPlayIntro() {
  if (!INTRO_ENABLED) return false
  if (isActMode()) return true
  return !introSeenThisVisit
}

export function markIntroSeen() {
  if (isActMode()) return
  introSeenThisVisit = true
}
