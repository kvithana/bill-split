import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"

/**
 * DELETE /api/receipts/[id]/people/[personId] - Remove a person from a receipt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  try {
    const { id: receiptId, personId } = await params

    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    // Remove the person from the receipt
    const updatedReceipt = await CloudReceiptStorage.removePerson(receiptId, personId)

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
