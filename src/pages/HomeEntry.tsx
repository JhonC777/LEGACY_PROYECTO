import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccessModeDialog } from '@/components/entry/AccessModeDialog'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { EntryMessage } from '@/components/entry/EntryMessage'
import { InstitutionSelector } from '@/components/entry/InstitutionSelector'
import { LegacyBrand } from '@/components/entry/LegacyBrand'
import {
  MOCK_INSTITUTIONS,
  type Institution,
} from '@/data/mockInstitutions'

export function HomeEntry() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Institution | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSelect = (institution: Institution) => {
    if (!institution.isActive) return
    setSelected(institution)
    setDialogOpen(true)
  }

  const handleExploreAll = () => {
    navigate('/explorar')
  }

  const handleGuestAccess = (institution: Institution) => {
    setDialogOpen(false)
    navigate(`/instituciones/${institution.slug}`)
  }

  const handleAdminAccess = (institution: Institution) => {
    setDialogOpen(false)
    navigate(`/admin/login?institution=${institution.slug}`)
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <CosmicBackground />

      <div className="relative z-10 flex min-h-dvh flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 py-4 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 xl:gap-16">
          <section className="flex flex-col justify-center">
            <LegacyBrand align="start" />
            <EntryMessage align="start" />
          </section>

          <section className="flex flex-col justify-center lg:min-h-[28rem]">
            <InstitutionSelector
              institutions={MOCK_INSTITUTIONS}
              onSelect={handleSelect}
              onExploreAll={handleExploreAll}
            />
          </section>
        </div>

        <p className="relative z-10 mt-6 text-center font-display text-[0.8rem] tracking-[0.12em] text-legacy-muted/70 lg:mt-8 lg:text-sm home-tagline-live">
          Los archivos no se guardan, trascenden.
        </p>
      </div>

      <AccessModeDialog
        institution={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onGuestAccess={handleGuestAccess}
        onAdminAccess={handleAdminAccess}
      />
    </main>
  )
}
