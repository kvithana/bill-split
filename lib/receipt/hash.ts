import { Receipt } from "@/lib/types"

/**
 * Compute a SHA-256 hash of the receipt's collaboratively-edited fields.
 * Uses the Web Crypto API so it works identically in both browser and Node 18+.
 *
 * Fields included: lineItems, people, adjustments, billName
 * Fields excluded: hash (self-referential), deviceId (creator-only, never changes)
 */
export async function computeReceiptHash(
  receipt: Pick<Receipt, "lineItems" | "people" | "adjustments" | "billName">
): Promise<string> {
  const data = JSON.stringify({
    lineItems: receipt.lineItems,
    people: receipt.people,
    adjustments: receipt.adjustments,
    billName: receipt.billName,
  })
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
