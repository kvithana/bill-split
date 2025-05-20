import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"

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
})

/**
 * PUT /api/receipts/[id]/adjustments - Update adjustments in a receipt
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

    // Update the receipt with new adjustments
    const updatedReceipt = await CloudReceiptStorage.updateReceipt(
      receiptId,
      { adjustments: data.adjustments },
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
    console.error("Error updating adjustments:", error)
    const message = error instanceof Error ? error.message : "Failed to update adjustments"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
