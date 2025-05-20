import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"
import { PersonSchema } from "@/lib/types"
// Schema for request body when adding a person - standardized to only use full person object
const AddPersonSchema = z.object({
  person: PersonSchema,
  shareKey: z.string().optional(), // Optional shareKey for shared links
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

    // Add the person to the receipt
    const updatedReceipt = await CloudReceiptStorage.addPerson(receiptId, person)

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
    console.error("Error adding person:", error)
    const message = error instanceof Error ? error.message : "Failed to add person"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
