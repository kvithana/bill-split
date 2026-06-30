import { Receipt as ReceiptType, ReceiptLineItem, ReceiptAdjustment, ReceiptScan } from "@/lib/types"
import { generateId } from "@/lib/id"
import { getDeviceId } from "@/lib/device-id"
import { normalizeReceiptAdjustment } from "@/lib/receipt/adjustment-splitting"
import { UNALLOCATED_ID } from "@/lib/constants"

type CreateReceiptParams = {
  metadata: { businessName?: string; totalInCents: number }
  lineItems: Omit<ReceiptLineItem, "id">[]
  adjustments: ReceiptScan["adjustments"]
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
        splitting: item.splitting ?? {
          portions: [{ personId: UNALLOCATED_ID, portions: item.quantity }],
        },
      })),
      adjustments: params.adjustments.map((adj) =>
        normalizeReceiptAdjustment({ ...adj, id: generateId() })
      ),
      ownerId: deviceId,
      hash: "",
    }

    return new Receipt(receipt)
  }

  toData(): ReceiptType {
    return this.receipt
  }
}
