import { Receipt as ReceiptType, ReceiptLineItem, ReceiptAdjustment } from "@/lib/types"
import { generateId } from "@/lib/id"
import { getDeviceId } from "@/lib/device-id"

type CreateReceiptParams = {
  metadata: { businessName?: string; totalInCents: number }
  lineItems: Omit<ReceiptLineItem, "id">[]
  adjustments: Omit<ReceiptAdjustment, "id">[]
  imageUrl: string
  deviceId?: string // Optional deviceId override
}

export class Receipt {
  private receipt: ReceiptType

  constructor(receipt: ReceiptType) {
    this.receipt = receipt
  }

  static create(params: CreateReceiptParams): Receipt {
    // Get device ID from parameters or generate one
    const deviceId = params.deviceId || (typeof window !== "undefined" ? getDeviceId() : undefined)

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
      ownerId: deviceId,
    }

    return new Receipt(receipt)
  }

  toData(): ReceiptType {
    return this.receipt
  }
}
