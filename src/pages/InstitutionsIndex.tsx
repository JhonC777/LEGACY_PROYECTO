import { Link } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { MOCK_INSTITUTIONS } from '@/data/mockInstitutions'

/** Placeholder — listado completo de instituciones */
export function InstitutionsIndex() {
  return (
    <main className="app-shell relative">
      <CosmicBackground />
      <div className="relative z-10 flex h-full flex-col px-4 py-6 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-legacy-muted transition-colors hover:text-legacy-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </Link>

        <h1 className="font-display text-3xl text-legacy-white">Instituciones</h1>
        <p className="mt-2 text-sm text-legacy-muted">
          Explora los espacios afiliados a LEGACY
        </p>

        <div className="mt-6 max-w-lg space-y-2.5 pb-4">
          {MOCK_INSTITUTIONS.map((institution) => (
            <Link
              key={institution.id}
              to={
                institution.isActive
                  ? `/instituciones/${institution.slug}`
                  : '#'
              }
              aria-disabled={!institution.isActive}
              onClick={(event) => {
                if (!institution.isActive) event.preventDefault()
              }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
                institution.isActive
                  ? 'border-legacy-border bg-legacy-surface/70 hover:border-legacy-gold/40'
                  : 'pointer-events-none border-legacy-border/50 bg-legacy-surface/40 opacity-55'
              }`}
            >
              {institution.logoUrl ? (
                <InstitutionLogo
                  name={institution.name}
                  logoUrl={institution.logoUrl}
                  fallback=""
                  decorative
                  className="h-11 w-11 rounded-xl border border-legacy-gold/25"
                  imageClassName="bg-white/95 p-1"
                />
              ) : (
                <Building2 className="h-5 w-5 text-legacy-gold" aria-hidden />
              )}
              <span>
                <span className="block font-medium text-legacy-white">
                  {institution.name}
                </span>
                <span className="block text-xs text-legacy-muted">
                  {institution.location}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
