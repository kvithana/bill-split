import { Person, Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import { create } from "zustand"
import { omit } from "ramda"
import { persist, createJSONStorage, combine } from "zustand/middleware"
import type { State } from "./types"
import { receipt } from "./model"

type Action = {
  addReceipt: (receipt: Receipt) => void
  removeReceipt: (receipt: Receipt) => void
  updateReceipt: (id: string, receipt: Receipt) => void
  addPerson: (receiptId: string, person: Person) => void
  removePerson: (receiptId: string, personId: string) => void
  updateLineItems: (receiptId: string, lineItems: ReceiptLineItem[]) => void
  updateAdjustments: (receiptId: string, adjustments: ReceiptAdjustment[]) => void
}

export type ReceiptStore = State & Action

export const useReceiptStore = create<ReceiptStore>()(
  persist(
    combine({ receipts: {} as Record<string, Receipt> }, (set, get) => ({
      addReceipt: (receipt: Receipt) => {
        set((state) => ({ receipts: { ...state.receipts, [receipt.id]: receipt } }))
      },
      removeReceipt: (receipt: Receipt) => {
        set((state) => ({
          receipts: omit([receipt.id], state.receipts),
        }))
      },
      updateReceipt: (id: string, receipt: Receipt) => {
        console.warn("[DEPRECATED] updateReceipt", id, receipt)
        set((state) => ({
          receipts: { ...state.receipts, [id]: receipt },
        }))
      },
      addPerson: (receiptId: string, person: Person) => {
        receipt.addPerson(set, receiptId)(person)
      },
      removePerson: (receiptId: string, personId: string) => {
        receipt.removePerson(set, receiptId)(personId)
      },
      updateLineItems: (receiptId: string, lineItems: ReceiptLineItem[]) => {
        receipt.updateLineItems(set, receiptId)(lineItems)
      },
      updateAdjustments: (receiptId: string, adjustments: ReceiptAdjustment[]) => {
        receipt.updateAdjustments(set, receiptId)(adjustments)
      },
    })),
    {
      version: 0,
      name: "receipts",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
