import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { archiveAssistantPlugin } from './vite-plugin-archive-assistant'

const SENTRY_ORG = 'legacy-1e'
const SENTRY_PROJECT = 'legacy-proyecto'

function deleteEmittedSourceMaps(outDir: string): Plugin {
  return {
    name: 'legacy-delete-source-maps',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const walk = (dir: string) => {
        let entries: string[]
        try {
          entries = readdirSync(dir)
        } catch {
          return
        }
        for (const entry of entries) {
          const path = join(dir, entry)
          let isDirectory = false
          try {
            isDirectory = statSync(path).isDirectory()
          } catch {
            continue
          }
          if (isDirectory) walk(path)
          else if (entry.endsWith('.map')) rmSync(path)
        }
      }
      walk(join(process.cwd(), outDir))
    },
  }
}

export default defineConfig(({ mode }) => {
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim() ?? ''
  const uploadSourceMaps = sentryAuthToken.length > 0
  const allowSentryTest = mode !== 'production' || process.env.VERCEL_ENV === 'preview'

  return {
    define: {
      __LEGACY_SENTRY_TEST__: JSON.stringify(allowSentryTest),
      'import.meta.env.VITE_VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV ?? ''),
    },
    build: {
      sourcemap: uploadSourceMaps ? 'hidden' : false,
    },
    plugins: [
      react(),
      tailwindcss(),
      archiveAssistantPlugin(mode),
      ...(uploadSourceMaps
        ? sentryVitePlugin({
            org: SENTRY_ORG,
            project: SENTRY_PROJECT,
            authToken: sentryAuthToken,
            telemetry: false,
            errorHandler(error) {
              const message = error.message.replace(/sntrys_\S+/g, '[redacted]')
              console.warn(
                `[sentry] No se subieron los source maps. El build continúa. ${message}`,
              )
            },
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
          })
        : []),
      deleteEmittedSourceMaps('dist'),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
