import type { Receipt as ReceiptType } from "@/lib/types"

export type State = {
  receipts: {
    [key: string]: ReceiptType
  }
}
