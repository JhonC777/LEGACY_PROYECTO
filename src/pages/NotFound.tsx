import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main
      id="contenido"
      className="flex h-dvh items-center justify-center overflow-hidden bg-legacy-black px-6 text-legacy-white"
    >
      <div className="flex w-full max-w-[28rem] flex-col items-center text-center">
        <p className="font-brand text-base font-semibold tracking-[0.28em] text-legacy-gold uppercase">
          LEGACY
        </p>
        <p className="mt-6 font-brand text-6xl leading-none font-semibold text-legacy-gold sm:text-7xl">
          404
        </p>
        <h1 className="mt-5 font-brand text-[1.75rem] leading-tight font-semibold sm:text-[2rem]">
          Página no encontrada
        </h1>
        <p className="mt-4 font-display text-xl leading-snug text-legacy-white italic">
          Donde el conocimiento deja legado.
        </p>
        <p className="mt-4 max-w-sm font-sans text-base leading-relaxed text-legacy-muted">
          Esta ruta no está en el archivo. Vuelve al inicio para elegir una institución.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-legacy-gold px-6 font-sans text-base font-semibold text-legacy-black transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-legacy-gold motion-reduce:transition-none"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
