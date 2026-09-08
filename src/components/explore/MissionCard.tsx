import { Archive, Rocket, Star } from 'lucide-react'

const VALUES = [
  {
    title: 'Preservar',
    text: 'Conservamos los proyectos y sus recursos digitales.',
    icon: Archive,
  },
  {
    title: 'Reconocer',
    text: 'Damos visibilidad a los trabajos que destacan.',
    icon: Star,
  },
  {
    title: 'Proyectar',
    text: 'Convertimos el trabajo estudiantil en parte del legado institucional.',
    icon: Rocket,
  },
]

export function MissionCard() {
  return (
    <section id="mision" className="explore-card mt-4 rounded-2xl p-5 lg:p-6">
      <h2 className="font-display text-xl font-semibold text-explore-ink lg:text-2xl">
        Preservamos lo que merece ser recordado.
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {VALUES.map((item) => (
          <div key={item.title}>
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-explore-purple/10 text-explore-purple">
              <item.icon className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-sm font-semibold text-explore-ink">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-explore-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
