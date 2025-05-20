import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { Receipt } from "@/lib/types"

/**
 * GET /api/receipts/[id] - Get a single receipt by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const receiptId = params.id

    // Get the receipt from the cloud
    const receipt = await CloudReceiptStorage.getReceipt(receiptId)

    if (!receipt) {
      return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      receipt,
    })
  } catch (error) {
    console.error("Error fetching receipt:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch receipt" }, { status: 500 })
  }
}

/**
 * PUT /api/receipts/[id] - Update a receipt
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const receiptId = params.id
    const deviceId = request.headers.get("X-Device-ID")

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Missing device ID" }, { status: 400 })
    }

    // Get the request body
    const body = await request.json()
    const { updates } = body

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ success: false, error: "Invalid updates object" }, { status: 400 })
    }

    // Update the receipt
    const updatedReceipt = await CloudReceiptStorage.updateReceipt(
      receiptId,
      updates as Partial<Receipt>,
      deviceId
    )

    if (!updatedReceipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found or update failed" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      receipt: updatedReceipt,
    })
  } catch (error) {
    console.error("Error updating receipt:", error)
    const message = error instanceof Error ? error.message : "Failed to update receipt"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
