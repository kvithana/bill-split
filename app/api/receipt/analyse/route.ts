import { ReceiptReader } from "@/lib/ocr/receipt-reader"
import { NextResponse } from "next/server"
import { z } from "zod"

export async function POST(request: Request) {
  const body = await request.json()

  const ip = request.headers.get("x-forwarded-for")

  if (!ip) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const schema = z.object({
    path: z.string(),
    deviceId: z.string().optional(),
  })

  const { data, error } = schema.safeParse(body)

  if (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { path, deviceId } = data

  const reader = ReceiptReader.create()

  const receipt = await reader.readReceipt(path, deviceId)

  if (receipt.receipt?.lineItems.length === 0) {
    return NextResponse.json(
      { success: false, error: "Could not find a receipt in the image" },
      { status: 200 }
    )
  }

  return NextResponse.json(receipt)
}
