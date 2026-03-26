import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { validateRequest } from "@/lib/auth/validate-request"
import { z } from "zod"

// Schema for the DELETE request body
const DeletePersonSchema = z.object({
  hash: z.string().optional(), // Hash for concurrency control
})

/**
 * DELETE /api/receipts/[id]/people/[personId] - Remove a person from a receipt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  try {
    const { id: receiptId, personId } = await params

    // Validate authentication
    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    // Parse body to get hash (if any)
    let hash: string | undefined
    try {
      const body = await request.json()
      const { success, data } = DeletePersonSchema.safeParse(body)
      if (success) {
        hash = data.hash
      }
    } catch (err) {
      // It's okay if there's no body - hash is optional
      console.log("No body in DELETE request, continuing without hash")
    }

    try {
      // Remove the person from the receipt
      const updatedReceipt = await CloudReceiptStorage.removePerson(receiptId, personId, hash)

      if (!updatedReceipt) {
        return NextResponse.json(
          { success: false, error: "Receipt not found or person removal failed" },
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
    console.error("Error removing person:", error)
    const message = error instanceof Error ? error.message : "Failed to remove person"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
