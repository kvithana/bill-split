import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"

// Schema for the request body
const UpdateAdjustmentsSchema = z.object({
  adjustments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amountInCents: z.number(),
      splitting: z.object({
        method: z.enum(["equal", "proportional", "manual"]),
        portions: z
          .array(
            z.object({
              personId: z.string(),
              portions: z.number(),
            })
          )
          .optional(),
      }),
    })
  ),
  shareKey: z.string().optional(), // Optional shareKey for shared links
})

/**
 * PUT /api/receipts/[id]/adjustments - Update adjustments in a receipt
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params
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

    // Update the receipt with new adjustments
    const updatedReceipt = await CloudReceiptStorage.updateReceipt(receiptId, {
      adjustments: data.adjustments,
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
    console.error("Error updating adjustments:", error)
    const message = error instanceof Error ? error.message : "Failed to update adjustments"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
