/** Mapa en memoria blob: → File/Blob para subidas sin fetch (CSP connect-src no incluye blob:). */
const byUrl = new Map<string, Blob>()

export function attachObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  byUrl.set(url, blob)
  return url
}

export function getBlobForObjectUrl(url: string): Blob | undefined {
  return byUrl.get(url)
}

export function detachObjectUrl(url: string): void {
  byUrl.delete(url)
  URL.revokeObjectURL(url)
}
