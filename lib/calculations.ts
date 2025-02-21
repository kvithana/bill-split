import type { Receipt, ReceiptLineItem, ReceiptAdjustment, PersonPortion } from "@/lib/types"

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
    const participatingPeople = adjustment.splitting.portions?.length || receipt.people.length
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
  const lineItemsTotal = calculatePersonLineItemsTotal(receipt, personId)
  const adjustmentsTotal = receipt.adjustments.reduce(
    (sum, adj) => sum + calculateAdjustmentAmount(receipt, adj, personId),
    0
  )
  return lineItemsTotal + adjustmentsTotal
}
