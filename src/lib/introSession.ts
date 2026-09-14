/** Vive solo en memoria de la SPA. Un F5 / nueva pestaña la borra. */
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
  if (isActMode()) return true
  return !introSeenThisVisit
}

export function markIntroSeen() {
  if (isActMode()) return
  introSeenThisVisit = true
}
