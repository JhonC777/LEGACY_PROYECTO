/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SENTRY_DSN?: string
  /** Inyectado en el build desde VERCEL_ENV. Vacío fuera de Vercel. */
  readonly VITE_VERCEL_ENV?: string
}

declare const __LEGACY_SENTRY_TEST__: boolean

interface ImportMeta {
  readonly env: ImportMetaEnv
}
