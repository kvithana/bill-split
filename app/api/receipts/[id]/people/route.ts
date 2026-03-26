import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"
import { personNameCollides } from "@/lib/people"
import { PersonSchema } from "@/lib/types"
// Schema for request body when adding a person - standardized to only use full person object
const AddPersonSchema = z.object({
  person: PersonSchema,
  shareKey: z.string().optional(), // Optional shareKey for shared links
  hash: z.string().optional(), // Hash of the receipt for concurrency control
})

/**
 * POST /api/receipts/[id]/people - Add a person to a receipt
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params
    const body = await request.json()

    // Validate the request body
    const { success, data, error } = AddPersonSchema.safeParse(body)
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid person data",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    // Extract person data
    const { person } = data

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

    const existingPeople = authResult.receipt.toData().people
    if (personNameCollides(existingPeople, person.name)) {
      return NextResponse.json(
        { success: false, error: "Someone with this name is already on this bill" },
        { status: 409 }
      )
    }

    try {
      // Add the person to the receipt
      const updatedReceipt = await CloudReceiptStorage.addPerson(receiptId, person, data.hash)

      if (!updatedReceipt) {
        return NextResponse.json(
          { success: false, error: "Receipt not found or update failed" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        receipt: updatedReceipt,
        personId: person.id, // Return the person ID for clients that may need it
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
    console.error("Error adding person:", error)
    const message = error instanceof Error ? error.message : "Failed to add person"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
