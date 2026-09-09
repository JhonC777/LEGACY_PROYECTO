import { Lock, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { MOCK_INSTITUTION_CARDS } from '@/data/mockExplore'

export function InstitutionsSection() {
  const navigate = useNavigate()

  return (
    <section id="instituciones" className="mt-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-legacy-white lg:text-[1.75rem]">
          Un legado. Muchas instituciones.
        </h2>
        <a
          href="#instituciones"
          className="text-sm font-semibold text-legacy-gold hover:opacity-80"
        >
          Ver todas las instituciones →
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_INSTITUTION_CARDS.map((institution) => {
          if (institution.variant === 'locked') {
            return (
              <article
                key={institution.id}
                className="explore-card flex flex-col items-center justify-center rounded-2xl px-5 py-10 text-center opacity-70"
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-legacy-muted">
                  <Lock className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-semibold text-legacy-white">{institution.name}</h3>
                <p className="mt-1 text-sm text-legacy-muted">{institution.location}</p>
                <span className="mt-4 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-legacy-muted uppercase">
                  Próximamente
                </span>
              </article>
            )
          }

          if (institution.variant === 'demo') {
            return (
              <article
                key={institution.id}
                className="explore-card flex flex-col rounded-2xl p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <InstitutionLogo
                    name={institution.name}
                    logoUrl={institution.logoUrl}
                    fallback={institution.logoLabel}
                    accent={institution.logoColor}
                    decorative
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                    imageClassName="rounded-lg bg-white/95 p-1"
                  />
                  <div>
                    <h3 className="font-semibold text-legacy-white">{institution.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-legacy-muted">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {institution.location}
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-legacy-muted">
                  Acceso de demostración. Te lleva de vuelta al inicio cósmico de LEGACY.
                </p>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="uppercase tracking-wide"
                  >
                    Demo
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="uppercase tracking-wide"
                  >
                    Log in
                  </Button>
                </div>
              </article>
            )
          }

          return (
            <article
              key={institution.id}
              className="explore-card flex flex-col rounded-2xl p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <InstitutionLogo
                  name={institution.name}
                  logoUrl={institution.logoUrl}
                  fallback={institution.logoLabel}
                  accent={institution.logoColor}
                  decorative
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                  imageClassName="rounded-lg bg-white/95 p-1"
                />
                <div>
                  <h3 className="font-semibold text-legacy-white">{institution.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-legacy-muted">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {institution.location}
                  </p>
                </div>
              </div>

              <div className="mb-5 flex gap-4 text-xs text-legacy-muted">
                <span>{institution.projectsLabel}</span>
                <span>{institution.yearsLabel}</span>
              </div>

              <Link
                to={`/instituciones/${institution.slug}`}
                className="btn btn-primary btn-md mt-auto w-full"
              >
                Explorar Institución →
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
