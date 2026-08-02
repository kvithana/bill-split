import type { Person, PersonPortion, Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import { UNALLOCATED_ID } from "@/lib/constants"
import { normalizeReceiptAdjustment } from "@/lib/receipt/adjustment-splitting"
import { syncUnallocated } from "@/lib/receipt/portions"

const isValidPortionWeight = (portions: number): boolean =>
  Number.isFinite(portions) && Number.isInteger(portions) && portions > 0

const isAllowedPersonId = (personId: string, peopleIds: Set<string>): boolean =>
  Boolean(personId) &&
  personId !== "undefined" &&
  (peopleIds.has(personId) || personId === UNALLOCATED_ID)

function toPeopleIdSet(people: Person[] | string[]): Set<string> {
  if (people.length === 0) return new Set()
  if (typeof people[0] === "string") return new Set(people as string[])
  return new Set((people as Person[]).map((p) => p.id))
}

/** Loose portion shape accepted at API boundaries before validation. */
type RawPortion = { personId?: unknown; portions?: unknown }

/** Keep only portions that reference known people (or unallocated) with positive integer weights. */
export function sanitizePortions(
  portions: PersonPortion[] | RawPortion[] | undefined,
  people: Person[] | string[]
): PersonPortion[] {
  const peopleIds = toPeopleIdSet(people)

  return (portions ?? []).flatMap((raw) => {
    const personId = typeof raw.personId === "string" ? raw.personId : ""
    const portionsValue = typeof raw.portions === "number" ? raw.portions : Number.NaN
    if (!isAllowedPersonId(personId, peopleIds) || !isValidPortionWeight(portionsValue)) {
      return []
    }
    return [{ personId, portions: portionsValue }]
  })
}

export function sanitizeLineItems(
  lineItems: Array<
    Omit<ReceiptLineItem, "splitting"> & {
      splitting?: { portions?: PersonPortion[] | RawPortion[] }
      quantity: number
    }
  >,
  people: Person[] | string[]
): ReceiptLineItem[] {
  return lineItems.map((item) => {
    // Drop orphans/invalids first, then re-sync unallocated against quantity so
    // sum(real)+unallocated stays consistent with the quantity-denominator model.
    const cleaned = sanitizePortions(item.splitting?.portions, people).filter(
      (p) => p.personId !== UNALLOCATED_ID
    )
    return {
      ...item,
      splitting: {
        portions: syncUnallocated(item.quantity, cleaned),
      },
    }
  })
}

export function sanitizeAdjustments(
  adjustments: ReceiptAdjustment[],
  people: Person[] | string[]
): ReceiptAdjustment[] {
  return adjustments.map((adj) => {
    const normalized = normalizeReceiptAdjustment(adj)
    return {
      ...normalized,
      splitting: {
        ...normalized.splitting,
        portions:
          normalized.splitting.method === "manual"
            ? sanitizePortions(normalized.splitting.portions, people)
            : [],
      },
    }
  })
}

/** Drop orphan / invalid portion entries across a receipt. */
export function sanitizeReceiptPortions(receipt: Receipt): Receipt {
  return {
    ...receipt,
    lineItems: sanitizeLineItems(receipt.lineItems, receipt.people),
    adjustments: sanitizeAdjustments(receipt.adjustments, receipt.people),
  }
}
