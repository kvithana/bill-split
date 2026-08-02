import { describe, it, expect } from "vitest"
import { UNALLOCATED_ID } from "@/lib/constants"
import {
  sanitizePortions,
  sanitizeLineItems,
  sanitizeReceiptPortions,
} from "@/lib/receipt/sanitize-portions"
import type { Receipt } from "@/lib/types"

const people = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
]

describe("sanitizePortions", () => {
  it("keeps known people and unallocated", () => {
    expect(
      sanitizePortions(
        [
          { personId: "alice", portions: 1 },
          { personId: UNALLOCATED_ID, portions: 2 },
          { personId: "bob", portions: 1 },
        ],
        people
      )
    ).toEqual([
      { personId: "alice", portions: 1 },
      { personId: UNALLOCATED_ID, portions: 2 },
      { personId: "bob", portions: 1 },
    ])
  })

  it("drops orphan ids, undefined literal, and fractional weights", () => {
    expect(
      sanitizePortions(
        [
          { personId: "1", portions: 1 },
          { personId: "undefined", portions: 1 },
          { personId: "alice", portions: 0.33 },
          { personId: "bob", portions: 0 },
          { personId: "alice", portions: 2 },
        ],
        people
      )
    ).toEqual([{ personId: "alice", portions: 2 }])
  })
})

describe("sanitizeLineItems / sanitizeReceiptPortions", () => {
  it("strips OCR-style ghost portions from line items", () => {
    const cleaned = sanitizeLineItems(
      [
        {
          id: "li1",
          name: "Yuzu",
          quantity: 3,
          totalPriceInCents: 3600,
          splitting: {
            portions: [
              { personId: "1", portions: 0.33 },
              { personId: "alice", portions: 1 },
            ],
          },
        },
      ],
      people
    )

    expect(cleaned[0]?.splitting?.portions).toEqual([{ personId: "alice", portions: 1 }])
  })

  it("clears non-manual adjustment portions while sanitizing manual ones", () => {
    const receipt: Receipt = {
      id: "r1",
      createdAt: "2026-01-01T00:00:00.000Z",
      imageUrl: "",
      hash: "",
      metadata: { totalInCents: 100 },
      people,
      lineItems: [],
      adjustments: [
        {
          id: "a1",
          name: "Tip",
          amountInCents: 100,
          splitting: {
            method: "equal",
            portions: [{ personId: "1", portions: 1 }],
          },
        },
        {
          id: "a2",
          name: "Manual fee",
          amountInCents: 50,
          splitting: {
            method: "manual",
            portions: [
              { personId: "ghost", portions: 1 },
              { personId: "bob", portions: 1 },
            ],
          },
        },
      ],
    }

    const cleaned = sanitizeReceiptPortions(receipt)
    expect(cleaned.adjustments[0].splitting).toEqual({ method: "equal", portions: [] })
    expect(cleaned.adjustments[1].splitting.portions).toEqual([{ personId: "bob", portions: 1 }])
  })
})
