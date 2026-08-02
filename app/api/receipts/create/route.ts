import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { Receipt, ReceiptSchema } from "@/lib/types"
import { sanitizeReceiptPortions } from "@/lib/receipt/sanitize-portions"
import { z } from "zod"

// Schema for the request body
const CreateReceiptSchema = z.object({
  receipt: ReceiptSchema,
})

/**
 * POST /api/receipts/create - Create a new cloud receipt
 */
export async function POST(request: NextRequest) {
  try {
    // Get device ID from header
    const deviceId = request.headers.get("X-Device-ID")
    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Missing device ID" }, { status: 400 })
    }

    const body = await request.json()

    // Drop orphan/fractional portions before Zod so stale local receipts can still move to cloud.
    if (
      body?.receipt &&
      typeof body.receipt === "object" &&
      Array.isArray(body.receipt.people) &&
      Array.isArray(body.receipt.lineItems) &&
      Array.isArray(body.receipt.adjustments)
    ) {
      body.receipt = sanitizeReceiptPortions(body.receipt as Receipt)
    }

    const { success, data, error } = CreateReceiptSchema.safeParse(body)
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid receipt data",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    const receipt = data.receipt

    // Make sure the device ID is set
    const receiptToSave: Receipt = {
      ...receipt,
      deviceId: receipt.deviceId || deviceId,
      ownerId: receipt.ownerId || deviceId,
      isShared: true,
      lastSyncedAt: new Date().toISOString(),
      shareKey: receipt.shareKey,
    }

    // saveReceipt sanitizes again before persist
    const savedReceipt = await CloudReceiptStorage.saveReceipt(receiptToSave)

    return NextResponse.json({
      success: true,
      receiptId: savedReceipt.id,
      receipt: savedReceipt,
      shareKey: savedReceipt.shareKey,
    })
  } catch (error) {
    console.error("Error creating receipt:", error)
    return NextResponse.json({ success: false, error: "Failed to create receipt" }, { status: 500 })
  }
}
