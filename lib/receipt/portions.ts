import { UNALLOCATED_ID } from "@/lib/constants"

type Portion = { personId: string; portions: number }

/**
 * Ensures the UNALLOCATED_ID entry in a line-item's portions array always
 * equals max(0, quantity - sum(real portions)). Call this after every mutation
 * so the invariant is maintained without manual delta tracking.
 */
export function syncUnallocated(quantity: number, portions: Portion[]): Portion[] {
  const real = portions.filter((p) => p.personId !== UNALLOCATED_ID)
  const allocated = real.reduce((sum, p) => sum + p.portions, 0)
  const remaining = Math.max(0, quantity - allocated)
  return remaining > 0 ? [...real, { personId: UNALLOCATED_ID, portions: remaining }] : real
}
