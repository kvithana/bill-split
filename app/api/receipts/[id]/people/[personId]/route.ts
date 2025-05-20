import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"

/**
 * DELETE /api/receipts/[id]/people/[personId] - Remove a person from a receipt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; personId: string } }
) {
  try {
    const { id: receiptId, personId } = params
    const deviceId = request.headers.get("X-Device-ID")

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Missing device ID" }, { status: 400 })
    }

    // Remove the person from the receipt
    const updatedReceipt = await CloudReceiptStorage.removePerson(receiptId, personId, deviceId)

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
    console.error("Error removing person:", error)
    const message = error instanceof Error ? error.message : "Failed to remove person"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
