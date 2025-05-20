import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"

// Schema for the request body when adding a person
const AddPersonSchema = z.object({
  person: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

/**
 * POST /api/receipts/[id]/people - Add a person to a receipt
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const receiptId = params.id
    const deviceId = request.headers.get("X-Device-ID")

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Missing device ID" }, { status: 400 })
    }

    // Get the request body
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

    // Add the person to the receipt
    const updatedReceipt = await CloudReceiptStorage.addPerson(receiptId, data.person, deviceId)

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
    console.error("Error adding person:", error)
    const message = error instanceof Error ? error.message : "Failed to add person"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
