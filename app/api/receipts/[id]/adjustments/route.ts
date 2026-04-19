import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"
import { ReceiptAdjustmentInputSchema } from "@/lib/types"
import { normalizeReceiptAdjustment } from "@/lib/receipt/adjustment-splitting"

// Schema for the request body
const UpdateAdjustmentsSchema = z.object({
  adjustments: z.array(ReceiptAdjustmentInputSchema),
  shareKey: z.string().optional(), // Optional shareKey for shared links
  hash: z.string().optional(), // Hash of the receipt for concurrency control
})

/**
 * PUT /api/receipts/[id]/adjustments - Update adjustments in a receipt
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let receiptId = "unknown"
  try {
    receiptId = (await params).id
    const body = await request.json()

    // Validate the request body
    const { success, data, error } = UpdateAdjustmentsSchema.safeParse(body)
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid adjustments data",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    if (authResult.receipt.toData().isSettled) {
      return NextResponse.json(
        { success: false, error: "This bill has been settled and can no longer be modified" },
        { status: 423 }
      )
    }

    try {
      // Update the receipt with new adjustments
      const updatedReceipt = await CloudReceiptStorage.updateReceipt(
        receiptId,
        {
          adjustments: data.adjustments.map(normalizeReceiptAdjustment),
        },
        data.hash
      )

      if (!updatedReceipt) {
        console.warn(`[receipts/${receiptId}/adjustments] PUT 404 — receipt not found`)
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
      // Handle hash mismatch error specifically
      if (error instanceof Error && error.message === "Receipt has been modified by another user") {
        console.warn(
          `[receipts/${receiptId}/adjustments] PUT 409 hash conflict — clientHash=${data.hash ?? "none"}`
        )
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            syncRequired: true,
          },
          { status: 409 } // Conflict status code
        )
      }
      throw error // Re-throw for generic error handling
    }
  } catch (error) {
    console.error(`[receipts/${receiptId}/adjustments] PUT 500:`, error)
    const message = error instanceof Error ? error.message : "Failed to update adjustments"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
