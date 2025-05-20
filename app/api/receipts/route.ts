import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/upstash/client"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { Receipt } from "@/lib/types"

/**
 * GET /api/receipts - Get all receipts for the current device
 */
export async function GET(request: NextRequest) {
  try {
    // Get device ID from header
    const deviceId = request.headers.get("X-Device-ID")
    if (!deviceId) {
      return NextResponse.json({ error: "Missing device ID" }, { status: 400 })
    }

    // Query all receipt keys
    const keys = await redis.keys(`receipt:*`)
    const receipts: Record<string, Receipt> = {}

    // For each key, get the receipt and check if it belongs to this device
    for (const key of keys) {
      const receiptId = key.replace("receipt:", "")
      const receipt = await CloudReceiptStorage.getReceipt(receiptId)

      // Include receipts that are owned by this device or that the device has contributed to
      if (receipt && (receipt.deviceId === deviceId || receipt.ownerId === deviceId)) {
        receipts[receipt.id] = receipt
      }
    }

    return NextResponse.json({
      success: true,
      receipts,
    })
  } catch (error) {
    console.error("Error fetching receipts:", error)
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 })
  }
}
