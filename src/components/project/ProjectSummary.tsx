import type { DemoProject } from '@/data/demoData'
import '@/styles/info.css'
import '@/styles/celestial-cards.css'

/**
 * Resume un campo largo a su primera oración (o dos, si la primera es muy corta),
 * sin inventar texto: solo recorta en un límite de palabra.
 */
export function summarize(text: string, max = 210) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const sentences = clean.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [clean]
  let out = sentences[0]?.trim() ?? clean
  if (out.length < 90 && sentences[1]) out = `${out} ${sentences[1].trim()}`
  if (out.length <= max) return out
  const cut = out.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).replace(/[,;:\s]+$/, '')}…`
}

const BLOCKS = [
  { key: 'problem', numeral: 'I', label: 'Problema' },
  { key: 'solution', numeral: 'II', label: 'Solución' },
  { key: 'results', numeral: 'III', label: 'Resultado' },
] as const

/**
 * «En 30 segundos»: Problema / Solución / Resultado a partir de los campos
 * existentes (problem, solution, results). Si un campo falta, su bloque no se
 * muestra; si faltan los tres, el resumen completo se oculta.
 */
export function ProjectSummary({ project }: { project: DemoProject }) {
  const items = BLOCKS.map((block) => ({ ...block, text: summarize(project[block.key] ?? '') })).filter(
    (block) => block.text,
  )
  if (items.length === 0) return null
  const authors = project.authors.map((author) => author.name).join(', ')

  return (
    <section className="project-summary" aria-labelledby="resumen-30">
      <div className="project-summary-head">
        <h2 id="resumen-30" className="project-summary-kicker">
          En 30 segundos
        </h2>
        {authors ? <p className="project-summary-authors">{authors}</p> : null}
      </div>
      <div className={`project-summary-grid is-${items.length}`}>
        {items.map((item) => (
          <article key={item.key} className="project-summary-item celestial-card">
            <h3>
              <span className="project-summary-numeral" aria-hidden>
                {item.numeral}
              </span>
              {item.label}
            </h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
