import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, List, X } from 'lucide-react'
import type { DemoProject } from '@/data/demoData'
import { useDialog } from '@/lib/useDialog'
import { cn } from '@/lib/cn'
import '@/styles/info.css'

const SIZES = ['s', 'm', 'l', 'xl'] as const
const SIZE_KEY = 'legacy.lectura.tamano'
const FONT_KEY = 'legacy.lectura.letra'

function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* modo privado: la preferencia vive solo en esta visita */
  }
}

/** Modo lectura: solo texto, letra grande, sin distracciones. */
export function ReadingMode({
  project,
  open,
  onClose,
}: {
  project: DemoProject
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return createPortal(<Reader project={project} onClose={onClose} />, document.body)
}

function Reader({ project, onClose }: { project: DemoProject; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(() => readPref(SIZE_KEY, SIZES, 'm'))
  const [font, setFont] = useState(() => readPref(FONT_KEY, ['serif', 'sans'] as const, 'serif'))
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('lectura-descripcion')
  const [indexOpen, setIndexOpen] = useState(false)
  useDialog(true, panelRef, onClose)

  const sections = useMemo(
    () =>
      [
        { id: 'lectura-descripcion', label: 'Descripción', text: project.description },
        { id: 'lectura-problema', label: 'Problema', text: project.problem },
        { id: 'lectura-solucion', label: 'Solución', text: project.solution },
        { id: 'lectura-metodologia', label: 'Metodología', text: project.methodology },
        { id: 'lectura-resultados', label: 'Resultados', text: project.results },
      ].filter((section) => section.text?.trim()),
    [project],
  )

  const minutes = useMemo(() => {
    const words = sections.reduce((total, section) => total + section.text.trim().split(/\s+/).length, 0)
    return Math.max(1, Math.round(words / 200))
  }, [sections])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    const update = () => {
      const max = node.scrollHeight - node.clientHeight
      setProgress(max > 0 ? Math.min(100, Math.round((node.scrollTop / max) * 100)) : 100)
      const top = node.getBoundingClientRect().top + node.clientHeight * 0.3
      let current = sections[0]?.id ?? ''
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element && element.getBoundingClientRect().top <= top) current = section.id
      }
      setActive(current)
    }
    update()
    node.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      node.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sections, size, font])

  const changeSize = (delta: 1 | -1) => {
    const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(size) + delta))]
    setSize(next)
    writePref(SIZE_KEY, next)
  }
  const changeFont = (next: 'serif' | 'sans') => {
    setFont(next)
    writePref(FONT_KEY, next)
  }
  const goTo = (id: string) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
    setIndexOpen(false)
  }

  const sizeIndex = SIZES.indexOf(size)
  const sizeControls = (
    <div className="reader-seg" role="group" aria-label="Tamaño de letra">
      <button type="button" onClick={() => changeSize(-1)} disabled={sizeIndex === 0} aria-label="Letra más pequeña">
        A−
      </button>
      <button type="button" onClick={() => changeSize(1)} disabled={sizeIndex === SIZES.length - 1} aria-label="Letra más grande">
        A+
      </button>
    </div>
  )
  const fontControls = (
    <div className="reader-seg" role="group" aria-label="Tipo de letra">
      <button type="button" aria-pressed={font === 'serif'} onClick={() => changeFont('serif')}>
        Serif
      </button>
      <button type="button" aria-pressed={font === 'sans'} onClick={() => changeFont('sans')}>
        Sans
      </button>
    </div>
  )
  const authors = project.authors.map((author) => author.name).join(', ')

  return (
    <div
      ref={panelRef}
      className={cn('reader', `is-size-${size}`, `is-${font}`)}
      role="dialog"
      aria-modal="true"
      aria-label={`Modo lectura: ${project.title}`}
      tabIndex={-1}
    >
      <header className="reader-top">
        <button type="button" className="btn btn-secondary btn-sm reader-back" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="reader-back-label">Ficha</span>
          <span className="sr-only">Volver a la ficha</span>
        </button>
        <div className="reader-heading">
          <small>Modo lectura</small>
          <b className="reader-heading-title">{project.title}</b>
          <b className="reader-heading-progress">
            {minutes} min · {progress} %
          </b>
        </div>
        <div className="reader-tools">
          {sizeControls}
          {fontControls}
        </div>
        <button type="button" className="header-action header-action-quiet reader-close" onClick={onClose} aria-label="Salir del modo lectura">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>
      <progress className="reader-progress" max={100} value={progress} aria-label="Progreso de lectura" />

      <div ref={scrollRef} className="reader-scroll">
        <div className="reader-layout">
          <nav className="reader-index" aria-label="Índice">
            <h2>Índice</h2>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={cn(active === section.id && 'is-active')}
                aria-current={active === section.id ? 'location' : undefined}
                onClick={() => goTo(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <article className="reader-article">
            <p className="reader-kicker">
              {project.area} · {project.year} · {minutes} min de lectura
            </p>
            <h1>{project.title}</h1>
            {authors ? <p className="reader-by">{authors}</p> : null}
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="reader-section" aria-label={section.label}>
                {index > 0 ? <h2>{section.label}</h2> : null}
                {section.text
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className={cn(index === 0 && paragraphIndex === 0 && 'reader-lead')}>
                      {paragraph}
                    </p>
                  ))}
              </section>
            ))}
            <p className="reader-end">Fin del texto · {project.title}</p>
          </article>
        </div>
      </div>

      <div className="reader-dock">
        {indexOpen ? (
          <div className="reader-dock-index" id="lectura-indice">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={cn(active === section.id && 'is-active')}
                onClick={() => goTo(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="reader-dock-bar">
          {sizeControls}
          <button
            type="button"
            className="btn btn-secondary btn-sm reader-dock-index-btn"
            aria-expanded={indexOpen}
            aria-controls="lectura-indice"
            onClick={() => setIndexOpen((value) => !value)}
          >
            <List className="h-4 w-4" aria-hidden />
            Índice
          </button>
          <button
            type="button"
            className="reader-font-toggle"
            onClick={() => changeFont(font === 'serif' ? 'sans' : 'serif')}
            aria-label={font === 'serif' ? 'Cambiar a letra sin serifa' : 'Cambiar a letra con serifa'}
          >
            Aa
          </button>
          <span className="reader-dock-pct" aria-hidden>
            {progress} %
          </span>
        </div>
      </div>
    </div>
  )
}
