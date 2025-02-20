import { prop, uniqBy } from "ramda"
import { State } from "./types"
import { Person, ReceiptAdjustment, ReceiptLineItem, Receipt as ReceiptType } from "@/lib/types"

type SetFn = (fn: (state: State) => Partial<State>) => void

// Helper function to update a property in a specific receipt
const updateReceiptProperty = <T>(
  set: SetFn,
  receiptId: string,
  property: keyof ReceiptType,
  updateFn: (current: T[]) => T[]
) => {
  set((state) => ({
    receipts: {
      ...state.receipts,
      [receiptId]: {
        ...state.receipts[receiptId],
        [property]: updateFn(state.receipts[receiptId][property] as T[]),
      },
    },
  }))
}

export const receipt = {
  addPerson: (set: SetFn, receiptId: string) => (person: Person) => {
    updateReceiptProperty<Person>(set, receiptId, "people", (current) =>
      uniqBy(prop("id"), [...current, person])
    )
  },

  addLineItem: (set: SetFn, receiptId: string) => (lineItem: ReceiptLineItem) => {
    updateReceiptProperty<ReceiptLineItem>(set, receiptId, "lineItems", (current) => [
      ...current,
      lineItem,
    ])
  },

  addAdjustment: (set: SetFn, receiptId: string) => (adjustment: ReceiptAdjustment) => {
    updateReceiptProperty<ReceiptAdjustment>(set, receiptId, "adjustments", (current) => [
      ...current,
      adjustment,
    ])
  },

  removePerson: (set: SetFn, receiptId: string) => (personId: string) => {
    updateReceiptProperty<Person>(set, receiptId, "people", (current) =>
      current.filter((person) => person.id !== personId)
    )
    updateReceiptProperty<ReceiptLineItem>(set, receiptId, "lineItems", (current) =>
      current.map((item) => ({
        ...item,
        splitting: {
          ...item.splitting,
          portions:
            item.splitting?.portions.filter((portion) => portion.personId !== personId) ?? [],
        },
      }))
    )
    updateReceiptProperty<ReceiptAdjustment>(set, receiptId, "adjustments", (current) =>
      current.map((adj) => ({
        ...adj,
        splitting: {
          ...adj.splitting,
          portions: adj.splitting?.portions
            ? adj.splitting.portions.filter((portion) => portion.personId !== personId)
            : undefined,
        },
      }))
    )
  },

  removeLineItem: (set: SetFn, receiptId: string) => (lineItemId: string) => {
    updateReceiptProperty<ReceiptLineItem>(set, receiptId, "lineItems", (current) =>
      current.filter((item) => item.id !== lineItemId)
    )
  },

  removeAdjustment: (set: SetFn, receiptId: string) => (adjustmentId: string) => {
    updateReceiptProperty<ReceiptAdjustment>(set, receiptId, "adjustments", (current) =>
      current.filter((adj) => adj.id !== adjustmentId)
    )
  },

  updateLineItem:
    (set: SetFn, receiptId: string) => (lineItemId: string, updates: Partial<ReceiptLineItem>) => {
      updateReceiptProperty<ReceiptLineItem>(set, receiptId, "lineItems", (current) =>
        current.map((item) => (item.id === lineItemId ? { ...item, ...updates } : item))
      )
    },

  updateAdjustment:
    (set: SetFn, receiptId: string) =>
    (adjustmentId: string, updates: Partial<ReceiptAdjustment>) => {
      updateReceiptProperty<ReceiptAdjustment>(set, receiptId, "adjustments", (current) =>
        current.map((adj) => (adj.id === adjustmentId ? { ...adj, ...updates } : adj))
      )
    },

  updatePerson: (set: SetFn, receiptId: string) => (personId: string, updates: Partial<Person>) => {
    updateReceiptProperty<Person>(set, receiptId, "people", (current) =>
      current.map((person) => (person.id === personId ? { ...person, ...updates } : person))
    )
  },
}
