import type { CSSProperties } from 'react'

const SUBJECT_PALETTE: Array<{ terms: string[]; color: string }> = [
  { terms: ['ciencias', 'biologia', 'quimica', 'fisica', 'salud'], color: '#72d6ad' },
  { terms: ['informatica', 'tecnologia', 'innovacion', 'software', 'electronica', 'robotica'], color: '#82bcff' },
  { terms: ['matematicas', 'estadistica', 'algebra', 'geometria'], color: '#c1a7ff' },
  { terms: ['sociales', 'historia', 'geografia', 'ciudadania'], color: '#efb184' },
  { terms: ['lengua', 'literatura', 'lectura', 'idiomas', 'comunicacion'], color: '#e8a0bd' },
  { terms: ['arte', 'cultura', 'musica', 'diseno', 'pintura'], color: '#f2ad8c' },
  { terms: ['medio ambiente', 'ambiental', 'ecologia', 'sostenibilidad', 'naturaleza'], color: '#b7ca82' },
  { terms: ['emprendimiento', 'negocios', 'economia', 'empresa'], color: '#e3c68b' },
]

function normalizeSubject(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

export function getSubjectColor(label: string) {
  const normalized = normalizeSubject(label)
  return SUBJECT_PALETTE.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.color ?? '#b6bac6'
}

export function subjectTagStyle(label: string): CSSProperties {
  return { '--subject-color': getSubjectColor(label) } as CSSProperties
}
