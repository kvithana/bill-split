import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { ReceiptLineItem } from "@/lib/types"
import { z } from "zod"

// Schema for the request body
const UpdateLineItemsSchema = z.object({
  lineItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      totalPriceInCents: z.number(),
      splitting: z
        .object({
          portions: z.array(
            z.object({
              personId: z.string(),
              portions: z.number(),
            })
          ),
        })
        .optional(),
    })
  ),
})

/**
 * PUT /api/receipts/[id]/line-items - Update line items in a receipt
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

    // Update the receipt with new line items
    const updatedReceipt = await CloudReceiptStorage.updateReceipt(
      receiptId,
      { lineItems: data.lineItems },
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
    console.error("Error updating line items:", error)
    const message = error instanceof Error ? error.message : "Failed to update line items"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
