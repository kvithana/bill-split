import type { Receipt, ReceiptLineItem, ReceiptAdjustment, PersonPortion } from "@/lib/types"
import { UNALLOCATED_ID } from "@/lib/constants"

export const formatCurrency = (cents: number): string => `$${(cents / 100).toFixed(2)}`

export const getPersonPortion = (personId: string) => (portions: PersonPortion[]) =>
  portions.find((portion) => portion.personId === personId)

export const calculatePortionAmount = (
  total: number,
  portion: number,
  totalPortions: number
): number => Math.round((total * portion) / totalPortions)

export const calculatePersonLineItemsTotal = (receipt: Receipt, personId: string): number =>
  receipt.lineItems.reduce((total, item) => {
    const personPortion = getPersonPortion(personId)(item.splitting?.portions || [])
    if (!personPortion) return total

    const totalPortions = item.splitting?.portions.reduce((sum, p) => sum + p.portions, 0) || 0
    return (
      total + calculatePortionAmount(item.totalPriceInCents, personPortion.portions, totalPortions)
    )
  }, 0)

export const calculateAdjustmentAmount = (
  receipt: Receipt,
  adjustment: ReceiptAdjustment,
  personId: string
): number => {
  if (adjustment.splitting.method === "equal") {
    // Count only real people for equal splits, not unallocated
    const realPeoplePortions = adjustment.splitting.portions?.filter(
      (p) => p.personId !== UNALLOCATED_ID
    ).length
    const participatingPeople = realPeoplePortions || receipt.people.length
    return Math.round(adjustment.amountInCents / participatingPeople)
  }

  if (adjustment.splitting.method === "proportional") {
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

      const totalPortions = item.splitting?.portions?.reduce((s, p) => s + p.portions, 0) || 0
      return (
        sum +
        calculatePortionAmount(item.totalPriceInCents, unallocatedPortion.portions, totalPortions)
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
