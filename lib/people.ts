import type { Person } from "@/lib/types"

/** Trimmed lowercase key for comparing display names. */
export function personNameKey(name: string): string {
  return name.trim().toLowerCase()
}

/** True if `name` matches an existing person (case-insensitive, trimmed). */
export function personNameCollides(people: Person[], name: string): boolean {
  const key = personNameKey(name)
  if (!key) return false
  return people.some((p) => personNameKey(p.name) === key)
}
