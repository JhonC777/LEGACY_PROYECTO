import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { LEGACY_SLOGAN } from '@/lib/brand'

type AdminAuthFrameProps = {
  kicker: string
  title: string
  backTo?: string
  backLabel?: string
  asideFooter?: ReactNode
  children: ReactNode
}

export function AdminAuthFrame({
  kicker,
  title,
  backTo = '/',
  backLabel = 'Volver al inicio',
  asideFooter,
  children,
}: AdminAuthFrameProps) {
  return (
    <main className="app-shell relative">
      <CosmicBackground />
      <div className="legacy-hidden-scroll relative z-10 flex h-full items-center justify-center overflow-y-auto px-4 py-6 sm:px-6">
        <section className="admin-auth-stage">
          <aside className="admin-auth-aside">
            <div className="admin-auth-aside-copy">
              <LegacyMark size="md" />
              <p className="admin-auth-kicker mt-8">{kicker}</p>
              <h1 className="admin-auth-title">{title}</h1>
              <div className="admin-auth-rule" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p className="admin-auth-slogan">{LEGACY_SLOGAN}</p>
            </div>
            {asideFooter ? <div className="relative">{asideFooter}</div> : null}
          </aside>
          <div className="admin-auth-panel">
            <div className="admin-auth-mobile-head">
              <p className="admin-auth-kicker">{kicker}</p>
              <h1 className="admin-auth-title text-[1.85rem]">{title}</h1>
            </div>
            {children}
            <div className="mt-6 flex justify-center">
              <Link to={backTo} className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {backLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
