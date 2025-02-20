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
  addLineItem: (receiptId: string, lineItem: ReceiptLineItem) => void
  removeLineItem: (receiptId: string, lineItemId: string) => void
  addAdjustment: (receiptId: string, adjustment: ReceiptAdjustment) => void
  removeAdjustment: (receiptId: string, adjustmentId: string) => void
  updateLineItem: (receiptId: string, lineItemId: string, lineItem: ReceiptLineItem) => void
  updateAdjustment: (receiptId: string, adjustmentId: string, adjustment: ReceiptAdjustment) => void
  updatePerson: (receiptId: string, personId: string, person: Person) => void
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
      addLineItem: (receiptId: string, lineItem: ReceiptLineItem) => {
        receipt.addLineItem(set, receiptId)(lineItem)
      },
      removeLineItem: (receiptId: string, lineItemId: string) => {
        receipt.removeLineItem(set, receiptId)(lineItemId)
      },
      addAdjustment: (receiptId: string, adjustment: ReceiptAdjustment) => {
        receipt.addAdjustment(set, receiptId)(adjustment)
      },
      removeAdjustment: (receiptId: string, adjustmentId: string) => {
        receipt.removeAdjustment(set, receiptId)(adjustmentId)
      },
      updateLineItem: (receiptId: string, lineItemId: string, lineItem: ReceiptLineItem) => {
        receipt.updateLineItem(set, receiptId)(lineItemId, lineItem)
      },
      updateAdjustment: (
        receiptId: string,
        adjustmentId: string,
        adjustment: ReceiptAdjustment
      ) => {
        receipt.updateAdjustment(set, receiptId)(adjustmentId, adjustment)
      },
      updatePerson: (receiptId: string, personId: string, person: Person) => {
        receipt.updatePerson(set, receiptId)(personId, person)
      },
    })),
    {
      version: 0,
      name: "receipts",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
