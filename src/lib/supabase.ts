import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const supabaseConfigured = Boolean(url && key)

/** Si está activo, la sesión sobrevive al cerrar el navegador. */
export const ADMIN_PERSIST_KEY = 'legacy.admin.persist'

const authStorage = {
  getItem(key: string) {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    const keep = window.localStorage.getItem(ADMIN_PERSIST_KEY) === '1'
    const primary = keep ? window.localStorage : window.sessionStorage
    const other = keep ? window.sessionStorage : window.localStorage
    other.removeItem(key)
    primary.setItem(key, value)
  },
  removeItem(key: string) {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

export function setKeepAdminSignedIn(keep: boolean) {
  if (keep) window.localStorage.setItem(ADMIN_PERSIST_KEY, '1')
  else window.localStorage.removeItem(ADMIN_PERSIST_KEY)
}

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    })
  : null
