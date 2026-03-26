import type { ReceiptAdjustment } from "@/lib/types"

/**
 * Canonical default for adjustment split method. Call sites that apply it:
 * `Receipt.create`, `fromRow`, PUT `/api/receipts/[id]/adjustments`.
 * UI fallbacks use `DEFAULT_ADJUSTMENT_SPLIT_METHOD` so they stay aligned with normalization.
 */
export const DEFAULT_ADJUSTMENT_SPLIT_METHOD = "proportional" as const

export function normalizeAdjustmentSplitting(
  splitting: ReceiptAdjustment["splitting"] | undefined
): ReceiptAdjustment["splitting"] {
  const method = splitting?.method ?? DEFAULT_ADJUSTMENT_SPLIT_METHOD
  return {
    method,
    portions: method === "manual" ? (splitting?.portions ?? []) : [],
  }
}

/** Ensures a full adjustment has canonical splitting (default method, no stray portions for non-manual). */
export function normalizeReceiptAdjustment(adj: {
  id: string
  name: string
  amountInCents: number
  splitting?: ReceiptAdjustment["splitting"]
}): ReceiptAdjustment {
  return {
    id: adj.id,
    name: adj.name,
    amountInCents: adj.amountInCents,
    splitting: normalizeAdjustmentSplitting(adj.splitting),
  }
}
