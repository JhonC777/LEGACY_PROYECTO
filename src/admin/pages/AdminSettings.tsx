import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { Building2, CircleDashed, ImagePlus, Save, Star, Trash2 } from 'lucide-react'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { cn } from '@/lib/cn'
import { useDeferredAction } from '@/lib/useDeferredAction'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../components/AdminStates'
import { PageHeader } from '../components/PageHeader'
import { useAdminStore } from '../store'
import { useToast } from '../toast'
import type { InstitutionSettings } from '../types'

const MAX_FEATURED = 6
const HEX = /^#([0-9a-f]{6})$/i

export function AdminSettings() {
  const { institution, settings, projects, status, reload, updateSettings, setFeatured } =
    useAdminStore()
  const { notify } = useToast()
  const defer = useDeferredAction()
  const [form, setForm] = useState<InstitutionSettings>(settings)
  const [featured, setFeaturedLocal] = useState<string[]>(settings.featuredProjectIds)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status !== 'ready') return
    setForm(settings)
    setFeaturedLocal(settings.featuredProjectIds)
  }, [status, settings])

  const published = useMemo(
    () =>
      [...projects]
        .filter((project) => project.status === 'published')
        .sort((a, b) => a.title.localeCompare(b.title, 'es')),
    [projects],
  )

  const identityDirty = JSON.stringify({ ...form, featuredProjectIds: [] }) !==
    JSON.stringify({ ...settings, featuredProjectIds: [] })
  const featuredDirty =
    JSON.stringify([...featured].sort()) !==
    JSON.stringify([...settings.featuredProjectIds].sort())
  const dirty = identityDirty || featuredDirty

  const errors: string[] = []
  if (!form.name.trim()) errors.push('El nombre es obligatorio')
  if (!form.shortName.trim() || form.shortName.trim().length > 12) {
    errors.push('El nombre corto debe tener entre 1 y 12 caracteres')
  }
  if (!HEX.test(form.accent)) errors.push('El color debe ser hexadecimal (#RRGGBB)')

  const set = <K extends keyof InstitutionSettings>(key: K, value: InstitutionSettings[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const draftLogoUrl = useRef<string | null>(null)
  const savedLogoUrl = useRef(settings.logoUrl)
  savedLogoUrl.current = settings.logoUrl

  /** Libera el logo elegido que aún no se ha guardado; nunca el ya persistido. */
  const releaseDraftLogo = () => {
    const url = draftLogoUrl.current
    if (url && url !== savedLogoUrl.current) URL.revokeObjectURL(url)
    draftLogoUrl.current = null
  }

  useEffect(() => releaseDraftLogo, [])

  const onLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify({ tone: 'error', title: 'Solo imágenes', description: 'El logo debe ser PNG, JPG, WebP o SVG.' })
      return
    }
    releaseDraftLogo()
    const url = URL.createObjectURL(file)
    draftLogoUrl.current = url
    set('logoUrl', url)
  }

  const toggleFeatured = (id: string) =>
    setFeaturedLocal((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_FEATURED) {
        notify({
          tone: 'info',
          title: `Máximo ${MAX_FEATURED} destacados`,
          description: 'Quita uno para poder añadir otro a la portada.',
        })
        return current
      }
      return [...current, id]
    })

  const handleSave = () => {
    if (errors.length > 0) {
      notify({ tone: 'error', title: 'Revisa el formulario', description: errors[0] })
      return
    }
    setSaving(true)
    defer(() => {
      if (identityDirty) {
        updateSettings({
          name: form.name.trim(),
          shortName: form.shortName.trim(),
          description: form.description.trim(),
          accent: form.accent,
          logoUrl: form.logoUrl,
        })
      }
      if (featuredDirty) setFeatured(featured)
      setSaving(false)
      notify({
        tone: 'success',
        title: 'Ajustes guardados',
        description: 'Se aplican a esta sesión demo. El sitio público seguirá mostrando los datos de la semilla.',
      })
    }, 420)
  }

  const header = (
    <PageHeader
      eyebrow="Institución"
      title="Ajustes"
      description="Identidad visual del espacio institucional y curaduría de la portada pública."
      actions={
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          <Save className="h-4 w-4" aria-hidden />
          Guardar cambios
        </button>
      }
    />
  )

  if (status === 'loading') {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminLoadingState rows={3} />
        </div>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminErrorState onRetry={reload} />
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      {dirty ? (
        <p className="admin-dirty mt-3 w-fit">
          <CircleDashed className="h-3 w-3" aria-hidden />
          Cambios sin guardar
        </p>
      ) : null}

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="admin-card p-5" aria-labelledby="identity-title">
            <div className="mb-5 flex items-start gap-3">
              <span className="admin-stat-icon mt-0.5">
                <Building2 className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 id="identity-title" className="font-display text-xl font-semibold text-legacy-white">
                  Identidad institucional
                </h2>
                <p className="mt-0.5 text-xs text-legacy-muted">
                  Cómo se presenta tu institución en el encabezado y el espacio público.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
              <div>
                <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">Logo</p>
                <label className={cn('admin-dropzone aspect-square', form.logoUrl && 'has-media')}>
                  <input type="file" accept="image/*" className="sr-only" onChange={onLogo} />
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo actual" className="!object-contain bg-white/95 p-3" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-center text-xs text-legacy-muted">
                      <ImagePlus className="h-6 w-6 text-legacy-gold" aria-hidden />
                      Subir logo
                    </span>
                  )}
                  <span className="admin-dropzone-overlay">
                    <ImagePlus className="h-4 w-4" aria-hidden />
                    {form.logoUrl ? 'Reemplazar' : 'Elegir'}
                  </span>
                </label>
                {form.logoUrl ? (
                  <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => set('logoUrl', undefined)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Quitar
                  </button>
                ) : null}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                    Nombre <span className="text-legacy-gold">*</span>
                  </span>
                  <input
                    className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                    value={form.name}
                    maxLength={80}
                    onChange={(event) => set('name', event.target.value)}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                      Nombre corto <span className="text-legacy-gold">*</span>
                    </span>
                    <input
                      className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-sm"
                      value={form.shortName}
                      maxLength={12}
                      onChange={(event) => set('shortName', event.target.value)}
                      placeholder="Ej. FyA"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                      Color de acento
                    </span>
                    <span className="flex items-center gap-2">
                      <input
                        type="color"
                        value={HEX.test(form.accent) ? form.accent : '#7662c9'}
                        onChange={(event) => set('accent', event.target.value)}
                        className="admin-color"
                        aria-label="Selector de color"
                      />
                      <input
                        className="glass-input liquid-field w-full rounded-xl px-3 py-3 font-mono text-sm uppercase"
                        value={form.accent}
                        maxLength={7}
                        onChange={(event) => set('accent', event.target.value.trim())}
                        aria-label="Color en hexadecimal"
                      />
                    </span>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
                    Descripción
                    <span className="font-medium normal-case tracking-normal">{form.description.length}/240</span>
                  </span>
                  <textarea
                    className="glass-input liquid-field w-full resize-y rounded-xl px-4 py-3 text-sm leading-relaxed"
                    rows={3}
                    maxLength={240}
                    value={form.description}
                    onChange={(event) => set('description', event.target.value)}
                  />
                </label>
                {errors.length > 0 ? (
                  <ul className="space-y-1 text-xs text-amber-300/90">
                    {errors.map((error) => (
                      <li key={error}>· {error}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>

          <section className="admin-card p-5" aria-labelledby="featured-title">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="admin-stat-icon mt-0.5">
                  <Star className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 id="featured-title" className="font-display text-xl font-semibold text-legacy-white">
                    Destacados en portada
                  </h2>
                  <p className="mt-0.5 text-xs text-legacy-muted">
                    Solo proyectos publicados. Aparecen en la portada pública de la institución.
                  </p>
                </div>
              </div>
              <span className="admin-count">
                {featured.length}/{MAX_FEATURED}
              </span>
            </div>

            {published.length === 0 ? (
              <AdminEmptyState
                compact
                icon={Star}
                title="Sin proyectos publicados"
                description="Publica al menos un proyecto para poder destacarlo en la portada."
              />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {published.map((project) => {
                  const active = featured.includes(project.id)
                  return (
                    <li key={project.id}>
                      <button
                        type="button"
                        className={cn('admin-row w-full text-left', active && 'is-active')}
                        aria-pressed={active}
                        onClick={() => toggleFeatured(project.id)}
                      >
                        <span className="admin-thumb" aria-hidden>
                          {project.coverImage ? <img src={project.coverImage} alt="" loading="lazy" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-legacy-white">
                            {project.title}
                          </span>
                          <span className="block truncate text-xs text-legacy-muted">
                            {project.area} · {project.year}
                          </span>
                        </span>
                        <Star
                          className={cn('h-4 w-4 shrink-0', active ? 'fill-current text-legacy-gold' : 'text-white/25')}
                          aria-hidden
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <section className="admin-card p-5" aria-label="Vista previa de identidad">
            <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-legacy-gold uppercase">
              Vista previa
            </p>
            <div className="admin-identity-preview" style={{ '--preview-accent': form.accent } as CSSProperties}>
              <div className="flex items-center gap-3">
                <InstitutionLogo
                  name={form.name || institution.name}
                  logoUrl={form.logoUrl}
                  fallback={form.shortName || institution.shortName}
                  accent={HEX.test(form.accent) ? form.accent : institution.accent}
                  decorative
                  className="h-12 w-12 rounded-xl text-sm font-bold text-white"
                  imageClassName="rounded-lg bg-white/95 p-1.5"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-legacy-white">
                    {form.name || 'Nombre de la institución'}
                  </p>
                  <p className="text-[11px] text-legacy-muted">Espacio institucional · Demo</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-legacy-muted">
                {form.description || 'Descripción de la institución.'}
              </p>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-legacy-muted">
              Los cambios se guardan en esta sesión de demostración y no modifican el sitio público
              hasta conectar la base de datos.
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
