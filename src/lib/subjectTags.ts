import type { CSSProperties } from 'react'

const SUBJECT_PALETTE: Array<{ terms: string[]; color: string }> = [
  { terms: ['ciencias', 'biologia', 'quimica', 'fisica', 'salud'], color: '#63c99b' },
  { terms: ['informatica', 'tecnologia', 'innovacion', 'software', 'electronica', 'robotica'], color: '#68adf4' },
  { terms: ['matematicas', 'estadistica', 'algebra', 'geometria'], color: '#b69af2' },
  { terms: ['sociales', 'historia', 'geografia', 'ciudadania'], color: '#e4a16f' },
  { terms: ['lengua', 'literatura', 'lectura', 'idiomas', 'comunicacion'], color: '#d88cac' },
  { terms: ['arte', 'cultura', 'musica', 'diseno', 'pintura'], color: '#e7a36f' },
  { terms: ['medio ambiente', 'ambiental', 'ecologia', 'sostenibilidad', 'naturaleza'], color: '#a9bd78' },
  { terms: ['emprendimiento', 'negocios', 'economia', 'empresa'], color: '#d6b878' },
]

function normalizeSubject(value: string) {
  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase('es')
}

export function getSubjectColor(label: string) {
  const normalized = normalizeSubject(label)
  return SUBJECT_PALETTE.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.color ?? '#b6bac6'
}

export function subjectTagStyle(label: string): CSSProperties {
  return { '--subject-color': getSubjectColor(label) } as CSSProperties
}
