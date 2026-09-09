const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const dayFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatDay(iso: string) {
  const label = dayFormatter.format(new Date(iso))
  return label.charAt(0).toLocaleUpperCase('es') + label.slice(1)
}

export function formatRelative(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `hace ${days} d`
  if (days < 30) return `hace ${Math.round(days / 7)} sem`
  return formatDate(iso)
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function dayKey(iso: string) {
  return iso.slice(0, 10)
}
