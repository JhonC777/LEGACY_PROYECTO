import { Facebook, Globe, Instagram, Linkedin, Youtube, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { withLegacyName } from '@/components/brand/LegacyName'

type SocialLink = { label: string; href: string; icon: LucideIcon }

/** Iconos disponibles para redes; se usan solo cuando haya un perfil real. */
export const SOCIAL_ICONS = {
  Instagram,
  Facebook,
  Web: Globe,
  LinkedIn: Linkedin,
  YouTube: Youtube,
} as const

/**
 * Redes reales que John confirmó (nada de enlaces genéricos).
 * Para agregar otra, sigue el mismo formato, por ejemplo:
 * { label: 'Instagram', href: 'https://www.instagram.com/<cuenta>', icon: SOCIAL_ICONS.Instagram }
 */
const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: 'Instagram de Fe y Alegría Colombia',
    href: 'https://www.instagram.com/feyalegriacolombia/',
    icon: SOCIAL_ICONS.Instagram,
  },
  {
    label: 'Facebook de la IED Germán Vargas Cantillo',
    href: 'https://www.facebook.com/IEDGermanVargasCantilloFyA/',
    icon: SOCIAL_ICONS.Facebook,
  },
  {
    label: 'Blog de la IED Germán Vargas Cantillo',
    href: 'https://iedgermanvargascantillo.blogspot.com/',
    icon: SOCIAL_ICONS.Web,
  },
]

export function ExploreFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-legacy-black/40">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-8">
        <p className="text-sm text-legacy-muted">
          © 2026 {withLegacyName('LEGACY')}. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-2 text-legacy-muted sm:gap-3">
          <Link to="/" className="text-sm hover:text-legacy-gold">
            Inicio
          </Link>
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:text-legacy-gold focus-visible:text-legacy-gold sm:h-9 sm:w-9"
            >
              <Icon className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
