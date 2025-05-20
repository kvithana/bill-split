import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { ReceiptLineItem, ReceiptLineItemSchema } from "@/lib/types"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"

// Schema for the request body
const UpdateLineItemsSchema = z.object({
  lineItems: z.array(ReceiptLineItemSchema),
  shareKey: z.string().optional(), // Optional shareKey for shared links
})

/**
 * PUT /api/receipts/[id]/line-items - Update line items in a receipt
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params
    const body = await request.json()

    // Validate the request body
    const { success, data, error } = UpdateLineItemsSchema.safeParse(body)
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid line items data",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    // Update the receipt with new line items
    const updatedReceipt = await CloudReceiptStorage.updateReceipt(receiptId, {
      lineItems: data.lineItems,
    })

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
    console.error("Error updating line items:", error)
    const message = error instanceof Error ? error.message : "Failed to update line items"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
