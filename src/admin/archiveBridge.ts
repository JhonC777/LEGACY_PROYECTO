import { useEffect, useState } from 'react'
import {
  DEMO_PROJECTS,
  getRelatedProjects as relatedFromPool,
  type DemoInstitution,
  type DemoProject,
} from '@/data/demoData'
import type { AdminProject, InstitutionSettings, MediaAsset, ActivityEntry } from './types'

const EVENT = 'legacy-archive-change'
const keyFor = (slug: string) => `legacy.admin.archive.${slug}`

export type ArchiveSnapshot = {
  slug: string
  projects: AdminProject[]
  settings: InstitutionSettings
  media: MediaAsset[]
  activity: ActivityEntry[]
}

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function readArchiveSnapshot(slug: string): ArchiveSnapshot | null {
  if (!canUseStorage() || !slug) return null
  try {
    const raw = window.sessionStorage.getItem(keyFor(slug))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ArchiveSnapshot
    if (!parsed || parsed.slug !== slug || !Array.isArray(parsed.projects)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeArchiveSnapshot(snapshot: ArchiveSnapshot) {
  if (!canUseStorage()) return
  const persistable: ArchiveSnapshot = {
    ...snapshot,
    media: snapshot.media.filter((asset) => !asset.url.startsWith('blob:')),
  }
  window.sessionStorage.setItem(keyFor(snapshot.slug), JSON.stringify(persistable))
  window.dispatchEvent(new Event(EVENT))
}

export function clearArchiveSnapshot(slug: string) {
  if (!canUseStorage() || !slug) return
  window.sessionStorage.removeItem(keyFor(slug))
  window.dispatchEvent(new Event(EVENT))
}

function asDemoProject(project: AdminProject): DemoProject {
  return {
    ...project,
    gallery: [...project.gallery],
  }
}

export function resolveInstitution(institution: DemoInstitution): DemoInstitution {
  const snap = readArchiveSnapshot(institution.slug)
  if (!snap) return institution
  return {
    ...institution,
    name: snap.settings.name || institution.name,
    shortName: snap.settings.shortName || institution.shortName,
    description: snap.settings.description || institution.description,
    accent: snap.settings.accent || institution.accent,
    logoUrl: snap.settings.logoUrl || institution.logoUrl,
  }
}

export function resolveInstitutionProjects(
  institution: DemoInstitution,
  publishedOnly = true,
): DemoProject[] {
  const snap = readArchiveSnapshot(institution.slug)
  const pool: DemoProject[] = snap
    ? snap.projects
        .filter((project) => project.institutionId === institution.id)
        .map(asDemoProject)
    : DEMO_PROJECTS.filter((project) => project.institutionId === institution.id)

  return publishedOnly ? pool.filter((project) => project.status === 'published') : pool
}

export function resolveProjectBySlug(institution: DemoInstitution, slug?: string) {
  if (!slug) return undefined
  return resolveInstitutionProjects(institution, true).find((project) => project.slug === slug)
}

export function resolveRelatedProjects(institution: DemoInstitution, project: DemoProject, limit = 3) {
  return relatedFromPool(project, limit, resolveInstitutionProjects(institution, true))
}

/** Fuerza relectura del puente cuando el admin guarda cambios en esta pestaña. */
export function useArchiveRevision() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const bump = () => setRevision((current) => current + 1)
    window.addEventListener(EVENT, bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener(EVENT, bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
  return revision
}
