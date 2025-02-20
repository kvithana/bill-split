import {
  Receipt as ReceiptType,
  Person,
  ReceiptLineItem,
  ReceiptAdjustment,
  PersonPortion,
} from "@/lib/types"
import { generateId } from "@/lib/id"

type CreateReceiptParams = {
  metadata: { businessName?: string; totalInCents: number }
  lineItems: Omit<ReceiptLineItem, "id">[]
  adjustments: Omit<ReceiptAdjustment, "id">[]
  imageUrl: string
}

export class Receipt {
  private receipt: ReceiptType

  constructor(receipt: ReceiptType) {
    this.receipt = receipt
  }

  static create(params: CreateReceiptParams): Receipt {
    const receipt: ReceiptType = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      people: [],
      imageUrl: params.imageUrl,
      metadata: params.metadata,
      lineItems: params.lineItems.map((item) => ({
        ...item,
        id: generateId(),
      })),
      adjustments: params.adjustments.map((adj) => ({
        ...adj,
        id: generateId(),
      })),
    }

    return new Receipt(receipt)
  }

  toData(): ReceiptType {
    return this.receipt
  }
}
