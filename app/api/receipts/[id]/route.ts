import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { Receipt } from "@/lib/types"
import { redis } from "@/lib/upstash/client"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"

// Schema for the request body when updating a receipt
const UpdateReceiptSchema = z.object({
  updates: z.record(z.any()).optional(),
  shareKey: z.string().optional(), // Optional shareKey for shared links
})

/**
 * GET /api/receipts/[id] - Get a single receipt by ID
 * Can also accept ?key=shareKey to fetch by shareKey instead of device auth
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params
    const url = new URL(request.url)

    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    return NextResponse.json({ success: true, receipt: authResult.receipt.toData() })
  } catch (error) {
    console.error("Error fetching receipt:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch receipt" }, { status: 500 })
  }
}

/**
 * PUT /api/receipts/[id] - Update a receipt
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params
    const body = await request.json()

    // Validate the request body
    const { success, data, error } = UpdateReceiptSchema.safeParse(body)
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    // Extract updates from the body
    let updates: Partial<Receipt> = {}

    if (data.updates && typeof data.updates === "object") {
      updates = data.updates
    } else if (typeof body === "object") {
      // Allow direct properties in the body (excluding shareKey)
      const { shareKey, ...otherProps } = body
      updates = otherProps
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid updates provided" },
        { status: 400 }
      )
    }

    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    // Update the receipt
    const updatedReceipt = await CloudReceiptStorage.updateReceipt(receiptId, updates)

    if (!updatedReceipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found or update failed" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      receipt: updatedReceipt,
      shareKey: updatedReceipt.shareKey, // Explicitly include shareKey in the response
    })
  } catch (error) {
    console.error("Error updating receipt:", error)
    const message = error instanceof Error ? error.message : "Failed to update receipt"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
