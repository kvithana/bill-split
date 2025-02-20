import { Receipt } from "@/lib/types"
import { create } from "zustand"
import { omit } from "ramda"
import { persist, createJSONStorage, combine } from "zustand/middleware"
import { ReceiptActions } from "./model"
import { State } from "./types"

type Action = {
  addReceipt: (receipt: Receipt) => void
  removeReceipt: (receipt: Receipt) => void
  receipt: (id: string) => ReceiptActions
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
      receipt: (id: string) => new ReceiptActions(id, set, get),
    })),
    {
      version: 0,
      name: "receipts",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
