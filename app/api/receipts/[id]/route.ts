import { NextRequest, NextResponse } from "next/server"
import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { z } from "zod"
import { validateRequest } from "@/lib/auth/validate-request"

// Only allow updating safe, non-structural fields via this generic endpoint.
// Line items, adjustments, and people have their own dedicated endpoints.
const UpdateReceiptSchema = z.object({
  billName: z.string().optional(),
  metadata: z
    .object({
      businessName: z.string().optional(),
      totalInCents: z.number(),
      dateAsISOString: z.string().optional(),
    })
    .optional(),
  shareKey: z.string().optional(),
  isSettled: z.boolean().optional(),
})

/**
 * GET /api/receipts/[id] - Get a single receipt by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params

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
 * PUT /api/receipts/[id] - Update receipt metadata (billName, metadata, shareKey)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: receiptId } = await params
    const body = await request.json()

    const { success, data, error } = UpdateReceiptSchema.safeParse(body)
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid updates provided" }, { status: 400 })
    }

    const authResult = await validateRequest(request, receiptId)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: authResult.code })
    }

    // Only the owner can settle the bill
    if (data.isSettled !== undefined) {
      const deviceId = request.headers.get("X-Device-ID")
      if (!deviceId) {
        return NextResponse.json(
          { success: false, error: "Only the bill owner can settle it" },
          { status: 403 }
        )
      }
    }

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
      shareKey: updatedReceipt.shareKey,
    })
  } catch (error) {
    console.error("Error updating receipt:", error)
    const message = error instanceof Error ? error.message : "Failed to update receipt"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/receipts/[id] - Delete a receipt (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: receiptId } = await params
    const deviceId = request.headers.get("X-Device-ID")

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Missing device ID" }, { status: 401 })
    }

    const deleted = await CloudReceiptStorage.deleteReceipt(receiptId, deviceId)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Receipt not found or not authorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting receipt:", error)
    return NextResponse.json({ success: false, error: "Failed to delete receipt" }, { status: 500 })
  }
}
