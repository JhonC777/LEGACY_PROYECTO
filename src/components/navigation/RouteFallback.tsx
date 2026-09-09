/** Estado de espera mientras se descarga el bundle de una ruta diferida. */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-legacy-black"
    >
      <span aria-hidden className="route-fallback-ring" />
      <p className="text-xs font-semibold tracking-[0.16em] text-legacy-muted uppercase">
        Cargando
      </p>
    </div>
  )
}
