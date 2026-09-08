import { Instagram, Linkedin, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ExploreFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-legacy-black/40">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-8">
        <p className="text-sm text-legacy-muted">
          © 2026 LEGACY. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 text-legacy-muted">
          <Link to="/" className="text-sm hover:text-legacy-gold">
            Inicio
          </Link>
          <a
            href="https://instagram.com"
            aria-label="Instagram"
            className="hover:text-legacy-gold"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com"
            aria-label="LinkedIn"
            className="hover:text-legacy-gold"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://youtube.com"
            aria-label="YouTube"
            className="hover:text-legacy-gold"
          >
            <Youtube className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}
