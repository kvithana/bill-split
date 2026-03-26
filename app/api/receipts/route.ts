import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"

/**
 * GET /api/receipts - Get all receipts for the current device
 */
export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get("X-Device-ID")
    if (!deviceId) {
      return NextResponse.json({ error: "Missing device ID" }, { status: 400 })
    }

    const receiptList = await CloudReceiptStorage.listReceiptsByDevice(deviceId)

    const receipts: Record<string, (typeof receiptList)[number]> = {}
    for (const receipt of receiptList) {
      receipts[receipt.id] = receipt
    }

    return NextResponse.json({ success: true, receipts })
  } catch (error) {
    console.error("Error fetching receipts:", error)
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 })
  }
}
