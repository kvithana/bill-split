import { describe, it, expect } from "vitest"
import type { Receipt } from "@/lib/types"
import { UNALLOCATED_ID } from "@/lib/constants"
import {
  calculateAdjustmentAmount,
  calculateAllocatedTotal,
  calculatePersonTotal,
  calculatePortionAmount,
  calculateReceiptTotal,
  hasAllocationMismatch,
} from "@/lib/calculations"
import { sanitizeReceiptPortions } from "@/lib/receipt/sanitize-portions"

const baseReceipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: "r1",
  createdAt: "2026-01-01T00:00:00.000Z",
  imageUrl: "",
  hash: "",
  metadata: { totalInCents: 0 },
  people: [
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
  ],
  lineItems: [],
  adjustments: [],
  ...overrides,
})

describe("calculatePortionAmount", () => {
  it("splits evenly for equal portions", () => {
    expect(calculatePortionAmount(1000, 1, 2)).toBe(500)
  })

  it("returns 0 when totalPortions is 0", () => {
    expect(calculatePortionAmount(1000, 1, 0)).toBe(0)
  })

  it("returns 0 for non-finite inputs", () => {
    expect(calculatePortionAmount(1000, 1, Number.NaN)).toBe(0)
  })
})

describe("line item claims", () => {
  it("divides an item across N claimants so shares sum to the item total", () => {
    const receipt = baseReceipt({
      lineItems: [
        {
          id: "li1",
          name: "Pizza",
          quantity: 1,
          totalPriceInCents: 3000,
          splitting: {
            portions: [
              { personId: "alice", portions: 1 },
              { personId: "bob", portions: 1 },
              { personId: "carol", portions: 1 },
            ],
          },
        },
      ],
      people: [
        { id: "alice", name: "Alice" },
        { id: "bob", name: "Bob" },
        { id: "carol", name: "Carol" },
      ],
    })

    const shares = receipt.people.map((p) => calculatePersonTotal(receipt, p.id))
    expect(shares.every((s) => s === 1000)).toBe(true)
    expect(shares.reduce((a, b) => a + b, 0)).toBe(3000)
  })

  it("ignores orphan portions after sanitize so real claimants get the full item", () => {
    const dirty = baseReceipt({
      lineItems: [
        {
          id: "li1",
          name: "Yuzu",
          quantity: 3,
          totalPriceInCents: 3600,
          splitting: {
            portions: [
              { personId: "1", portions: 0.33 },
              { personId: "2", portions: 0.34 },
              { personId: "3", portions: 0.33 },
              { personId: "alice", portions: 1 },
              { personId: "bob", portions: 1 },
            ],
          },
        },
      ],
    })

    const receipt = sanitizeReceiptPortions(dirty)
    expect(receipt.lineItems[0].splitting?.portions).toEqual([
      { personId: "alice", portions: 1 },
      { personId: "bob", portions: 1 },
    ])
    expect(calculatePersonTotal(receipt, "alice")).toBe(1800)
    expect(calculatePersonTotal(receipt, "bob")).toBe(1800)
  })
})

describe("equal adjustments", () => {
  it("never overcharges in aggregate vs tip amount", () => {
    const receipt = baseReceipt({
      people: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
        { id: "d", name: "D" },
      ],
      adjustments: [
        {
          id: "tip",
          name: "Tip",
          amountInCents: 1000,
          // Stale portions that previously caused tip/1 per person
          splitting: {
            method: "equal",
            portions: [{ personId: "a", portions: 1 }],
          },
        },
      ],
    })

    const totalTipCharged = receipt.people.reduce(
      (sum, p) => sum + calculateAdjustmentAmount(receipt, receipt.adjustments[0], p.id),
      0
    )
    expect(totalTipCharged).toBe(1000)
    expect(calculateAdjustmentAmount(receipt, receipt.adjustments[0], "a")).toBe(250)
  })

  it("returns 0 when there are no people", () => {
    const receipt = baseReceipt({
      people: [],
      adjustments: [
        { id: "tip", name: "Tip", amountInCents: 500, splitting: { method: "equal", portions: [] } },
      ],
    })
    expect(calculateAdjustmentAmount(receipt, receipt.adjustments[0], "nobody")).toBe(0)
  })
})

describe("allocation invariant", () => {
  it("matches receipt total when everything is claimed", () => {
    const receipt = baseReceipt({
      lineItems: [
        {
          id: "li1",
          name: "Burger",
          quantity: 1,
          totalPriceInCents: 1200,
          splitting: { portions: [{ personId: "alice", portions: 1 }] },
        },
        {
          id: "li2",
          name: "Fries",
          quantity: 1,
          totalPriceInCents: 400,
          splitting: {
            portions: [
              { personId: "alice", portions: 1 },
              { personId: "bob", portions: 1 },
            ],
          },
        },
      ],
      adjustments: [
        {
          id: "tip",
          name: "Tip",
          amountInCents: 200,
          splitting: { method: "proportional", portions: [] },
        },
      ],
    })

    expect(calculateAllocatedTotal(receipt)).toBe(calculateReceiptTotal(receipt))
    expect(hasAllocationMismatch(receipt)).toBe(false)
  })

  it("flags mismatch when orphan portions steal from the total before sanitize", () => {
    const dirty = baseReceipt({
      lineItems: [
        {
          id: "li1",
          name: "Item",
          quantity: 1,
          totalPriceInCents: 1000,
          splitting: {
            portions: [
              { personId: "ghost", portions: 1 },
              { personId: "alice", portions: 1 },
            ],
          },
        },
      ],
      adjustments: [],
    })

    expect(hasAllocationMismatch(dirty)).toBe(true)
    expect(hasAllocationMismatch(sanitizeReceiptPortions(dirty))).toBe(false)
  })

  it("counts unallocated money toward allocated total", () => {
    const receipt = baseReceipt({
      lineItems: [
        {
          id: "li1",
          name: "Open",
          quantity: 1,
          totalPriceInCents: 500,
          splitting: { portions: [] },
        },
        {
          id: "li2",
          name: "Partial",
          quantity: 1,
          totalPriceInCents: 1000,
          splitting: {
            portions: [
              { personId: "alice", portions: 1 },
              { personId: UNALLOCATED_ID, portions: 1 },
            ],
          },
        },
      ],
    })

    expect(calculateAllocatedTotal(receipt)).toBe(1500)
    expect(hasAllocationMismatch(receipt)).toBe(false)
  })
})
