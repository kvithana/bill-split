import type { Receipt, ReceiptAdjustment, PersonPortion } from "@/lib/types"
import { UNALLOCATED_ID } from "@/lib/constants"
import { DEFAULT_ADJUSTMENT_SPLIT_METHOD } from "@/lib/receipt/adjustment-splitting"

export const formatCurrency = (cents: number): string => `$${(cents / 100).toFixed(2)}`

export const getPersonPortion = (personId: string) => (portions: PersonPortion[]) =>
  portions.find((portion) => portion.personId === personId)

export const calculatePortionAmount = (
  total: number,
  portion: number,
  totalPortions: number
): number => {
  if (totalPortions <= 0 || !Number.isFinite(totalPortions) || !Number.isFinite(portion)) {
    return 0
  }
  return Math.round((total * portion) / totalPortions)
}

/**
 * Share denominator for a line item: normally `quantity`, but never less than the sum of
 * real (non-unallocated) portions. Prevents overcharge when claimants exceed quantity
 * (e.g. three people each with portions:1 on a qty-1 shared dish).
 */
export const getLineItemShareDenominator = (item: {
  quantity: number
  splitting?: { portions?: PersonPortion[] }
}): number => {
  const realSum = (item.splitting?.portions ?? [])
    .filter((p) => p.personId !== UNALLOCATED_ID)
    .reduce((sum, p) => sum + p.portions, 0)
  return Math.max(item.quantity || 0, realSum)
}

export const calculatePersonLineItemsTotal = (receipt: Receipt, personId: string): number =>
  receipt.lineItems.reduce((total, item) => {
    const personPortion = getPersonPortion(personId)(item.splitting?.portions || [])
    if (!personPortion) return total

    return (
      total +
      calculatePortionAmount(
        item.totalPriceInCents,
        personPortion.portions,
        getLineItemShareDenominator(item)
      )
    )
  }, 0)

export const calculateAdjustmentAmount = (
  receipt: Receipt,
  adjustment: ReceiptAdjustment,
  personId: string
): number => {
  const method = adjustment.splitting.method ?? DEFAULT_ADJUSTMENT_SPLIT_METHOD

  if (method === "equal") {
    // Always split evenly among everyone on the bill (matches UI copy).
    // Do not use portions.length — stale/partial portions would overcharge.
    const n = receipt.people.length
    if (n === 0) return 0
    return Math.round(adjustment.amountInCents / n)
  }

  if (method === "proportional") {
    const personTotal = calculatePersonLineItemsTotal(receipt, personId)
    const receiptTotal = calculateLineItemsTotal(receipt)
    return receiptTotal === 0
      ? 0
      : Math.round((adjustment.amountInCents * personTotal) / receiptTotal)
  }

  // manual splitting
  const personPortion = getPersonPortion(personId)(adjustment.splitting.portions || [])
  if (!personPortion) return 0

  const totalPortions = adjustment.splitting.portions?.reduce((sum, p) => sum + p.portions, 0) || 0
  return calculatePortionAmount(adjustment.amountInCents, personPortion.portions, totalPortions)
}

export const calculateLineItemsTotal = (receipt: Receipt): number =>
  receipt.lineItems.reduce((sum, item) => sum + (item.totalPriceInCents || 0), 0)

export const calculateAdjustmentsTotal = (receipt: Receipt): number =>
  receipt.adjustments.reduce((sum, adj) => sum + (adj.amountInCents || 0), 0)

export const calculateReceiptTotal = (receipt: Receipt): number =>
  calculateLineItemsTotal(receipt) + calculateAdjustmentsTotal(receipt)

export const calculatePersonTotal = (receipt: Receipt, personId: string): number => {
  // Don't calculate totals for the unallocated pseudo-person
  if (personId === UNALLOCATED_ID) return 0

  const lineItemsTotal = calculatePersonLineItemsTotal(receipt, personId)
  const adjustmentsTotal = receipt.adjustments.reduce(
    (sum, adj) => sum + calculateAdjustmentAmount(receipt, adj, personId),
    0
  )
  return lineItemsTotal + adjustmentsTotal
}

export const calculateUnallocatedAmount = (receipt: Receipt): number => {
  // Calculate amount from line items with no allocations
  const unallocatedLineItemsAmount = receipt.lineItems
    .filter((item) => !item.splitting?.portions || item.splitting.portions.length === 0)
    .reduce((sum, item) => sum + item.totalPriceInCents, 0)

  // Calculate amount from adjustments with no allocations
  const unallocatedAdjustmentsAmount = receipt.adjustments
    .filter(
      (adj) =>
        adj.splitting.method === "manual" &&
        (!adj.splitting.portions || adj.splitting.portions.length === 0)
    )
    .reduce((sum, adj) => sum + adj.amountInCents, 0)

  // Calculate explicitly unallocated portions from line items
  const explicitlyUnallocatedLineItemsAmount = receipt.lineItems
    .filter((item) => item.splitting?.portions?.some((p) => p.personId === UNALLOCATED_ID))
    .reduce((sum, item) => {
      const unallocatedPortion = item.splitting?.portions?.find(
        (p) => p.personId === UNALLOCATED_ID
      )
      if (!unallocatedPortion) return sum

      return (
        sum +
        calculatePortionAmount(
          item.totalPriceInCents,
          unallocatedPortion.portions,
          getLineItemShareDenominator(item)
        )
      )
    }, 0)

  // Calculate explicitly unallocated portions from adjustments
  const explicitlyUnallocatedAdjustmentsAmount = receipt.adjustments
    .filter(
      (adj) =>
        adj.splitting.method === "manual" &&
        adj.splitting.portions?.some((p) => p.personId === UNALLOCATED_ID)
    )
    .reduce((sum, adj) => {
      const unallocatedPortion = adj.splitting.portions?.find((p) => p.personId === UNALLOCATED_ID)
      if (!unallocatedPortion) return sum

      const totalPortions = adj.splitting.portions?.reduce((s, p) => s + p.portions, 0) || 0
      return (
        sum + calculatePortionAmount(adj.amountInCents, unallocatedPortion.portions, totalPortions)
      )
    }, 0)

  return (
    unallocatedLineItemsAmount +
    unallocatedAdjustmentsAmount +
    explicitlyUnallocatedLineItemsAmount +
    explicitlyUnallocatedAdjustmentsAmount
  )
}

/** Sum of every person's owed amount plus explicitly/implicitly unallocated money. */
export const calculateAllocatedTotal = (receipt: Receipt): number =>
  receipt.people.reduce((sum, person) => sum + calculatePersonTotal(receipt, person.id), 0) +
  calculateUnallocatedAmount(receipt)

/**
 * True when person shares diverge from the receipt total beyond rounding slack.
 * Skips while any money is still unallocated — proportional tips intentionally leave a gap
 * until food is fully claimed, which would otherwise false-alarm mid-split.
 */
export const hasAllocationMismatch = (receipt: Receipt): boolean => {
  if (calculateUnallocatedAmount(receipt) > 0) return false

  const slack = Math.max(receipt.people.length, 2)
  return Math.abs(calculateAllocatedTotal(receipt) - calculateReceiptTotal(receipt)) > slack
}
