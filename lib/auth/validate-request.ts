import { NextRequest } from "next/server"
import { CloudReceiptStorage } from "../receipt/cloud-storage"
import { Receipt } from "../receipt/model"

type ValidateRequestResponse =
  | {
      success: true
      receipt: Receipt
    }
  | {
      success: false
      error: string
      code: number
    }

export async function validateRequest(
  request: NextRequest,
  receiptId: string
): Promise<ValidateRequestResponse> {
  const deviceId = request.headers.get("X-Device-ID")
  const shareKey = request.headers.get("X-Share-Key")

  if (!deviceId && !shareKey) {
    return {
      success: false as const,
      error: "No authentication key provided",
      code: 401,
    }
  }

  const receipt = await CloudReceiptStorage.getReceipt(receiptId)

  if (!receipt) {
    return {
      success: false as const,
      error: "Receipt not found",
      code: 404,
    }
  }

  if (shareKey) {
    if (receipt.shareKey !== shareKey) {
      return {
        success: false as const,
        error: "Invalid share key",
        code: 401,
      }
    }
  }

  if (deviceId) {
    if (receipt.ownerId !== deviceId) {
      return {
        success: false as const,
        error: "Invalid device ID",
        code: 401,
      }
    }
  }

  return {
    success: true as const,
    receipt: new Receipt(receipt),
  }
}
