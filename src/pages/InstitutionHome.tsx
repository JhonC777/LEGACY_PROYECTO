import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { InstitutionHero } from '@/components/institution/InstitutionHero'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { PublicHeader } from '@/components/public/PublicHeader'
import {
  getInstitutionBySlug,
  getInstitutionProjects,
  getProjectHref,
} from '@/data/demoData'

/** Home del espacio institucional (entrada desde Home). */
export function InstitutionHome() {
  const { institutionSlug } = useParams()
  const institution = getInstitutionBySlug(institutionSlug)
  const reduceMotion = useReducedMotion()

  if (!institution) {
    return <Navigate to="/" replace />
  }

  const projects = getInstitutionProjects(institution.id)
  const featured = projects.filter((project) => project.isFeatured).slice(0, 3)
  const areas = [...new Set(projects.map((project) => project.area))]
  const years = [...new Set(projects.map((project) => project.year))]
    .filter((year) => year >= 2024)
    .sort((a, b) => b - a)
  const collections = [
    ...new Set(
      projects
        .map((project) => project.collection)
        .filter((collection): collection is string => Boolean(collection)),
    ),
  ]
  const projectsHref = `/instituciones/${institution.slug}/proyectos`

  const allYears = [...new Set(projects.map((project) => project.year))].sort(
    (a, b) => a - b,
  )
  const yearRange =
    allYears.length > 1
      ? `${allYears[0]} – ${allYears[allYears.length - 1]}`
      : allYears.length === 1
        ? String(allYears[0])
        : 'Sin años registrados'

  const heroPreview = (featured.length > 0 ? featured : projects)
    .slice(0, 3)
    .map((project) => ({
      id: project.id,
      title: project.title,
      coverImage: project.coverImage,
      href: getProjectHref(project),
    }))

  const sectionReveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28, filter: 'blur(10px)' },
          whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
          viewport: { once: true, amount: 0.2 },
          transition: {
            duration: 0.75,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }

  return (
    <div className="explore-shell">
      <PublicHeader institution={institution} />

      <main>
        <InstitutionHero
          institution={institution}
          projectsHref={projectsHref}
          stats={{
            projects: projects.length,
            areas: areas.length,
            years: years.length,
            collections: collections.length,
          }}
          preview={heroPreview}
          yearRange={yearRange}
          topAreas={areas.slice(0, 2)}
        />

        <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-8 lg:py-16">
          <motion.section {...sectionReveal()}>
            <div className="mb-2 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
                  Selección institucional
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-legacy-white lg:text-4xl">
                  Proyectos destacados
                </h2>
              </div>
              <Link
                to={projectsHref}
                className="hidden text-sm font-semibold text-legacy-gold transition-opacity hover:opacity-75 sm:inline"
              >
                Ver catálogo completo →
              </Link>
            </div>
            <div className="institution-section-rule mb-7 mt-4" aria-hidden />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((project, index) => (
                <motion.div
                  key={project.id}
                  {...(reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
                        whileInView: {
                          opacity: 1,
                          y: 0,
                          filter: 'blur(0px)',
                        },
                        viewport: { once: true, amount: 0.15 },
                        transition: {
                          duration: 0.65,
                          delay: 0.08 * index,
                          ease: [0.22, 1, 0.36, 1] as const,
                        },
                      })}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
            <Link
              to={projectsHref}
              className="mt-5 inline-flex text-sm font-semibold text-legacy-gold sm:hidden"
            >
              Ver catálogo completo →
            </Link>
          </motion.section>

          <motion.div
            className="mt-14 grid gap-5 lg:grid-cols-3"
            {...sectionReveal(0.08)}
          >
            <InstitutionPanel
              title="Áreas de conocimiento"
              items={areas}
              href={projectsHref}
              query="area"
              delay={0}
            />
            <InstitutionPanel
              title="Años de legado"
              items={years.map(String)}
              href={projectsHref}
              query="year"
              delay={0.08}
            />
            <InstitutionPanel
              title="Colecciones"
              items={collections}
              href={projectsHref}
              query="collection"
              delay={0.16}
            />
          </motion.div>
        </div>
      </main>

      <ExploreFooter />
    </div>
  )
}

function InstitutionPanel({
  title,
  items,
  href,
  query,
  delay = 0,
}: {
  title: string
  items: string[]
  href: string
  query: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      className="institution-panel rounded-2xl p-5 lg:p-6"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.6,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
      }
    >
      <h2 className="font-display text-2xl font-semibold text-legacy-white">
        {title}
      </h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-legacy-muted">
            Sin elementos en esta versión demo
          </p>
        ) : (
          items.map((item) => (
            <Link
              key={item}
              to={`${href}?${query}=${encodeURIComponent(item)}`}
              className="institution-panel-link flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm font-medium text-legacy-white"
            >
              {item}
              <ArrowRight className="h-4 w-4 shrink-0 text-legacy-gold/80" aria-hidden />
            </Link>
          ))
        )}
      </div>
    </motion.section>
  )
}
