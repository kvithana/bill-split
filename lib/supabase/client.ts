import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (cached) return cached

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) {
    throw new Error("Missing SUPABASE_URL environment variable")
  }
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  })
  return cached
}

/** Lazily created so Next can analyze routes at build time without Supabase env. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase()
    const value = Reflect.get(client, prop, receiver) as unknown
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value
  },
})
