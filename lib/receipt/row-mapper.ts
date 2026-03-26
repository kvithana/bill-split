import { Receipt } from "@/lib/types"

// Type matching the Supabase receipts table columns
export type ReceiptRow = {
  id: string
  created_at: string
  bill_name: string | null
  image_url: string
  metadata: Record<string, unknown>
  people: Record<string, unknown>[]
  line_items: Record<string, unknown>[]
  adjustments: Record<string, unknown>[]
  owner_id: string
  device_id: string
  is_shared: boolean
  share_key: string | null
  hash: string
  last_synced_at: string | null
  is_settled: boolean
}

export function toRow(receipt: Receipt): ReceiptRow {
  return {
    id: receipt.id,
    created_at: receipt.createdAt,
    bill_name: receipt.billName ?? null,
    image_url: receipt.imageUrl,
    metadata: receipt.metadata as Record<string, unknown>,
    people: receipt.people as Record<string, unknown>[],
    line_items: receipt.lineItems as Record<string, unknown>[],
    adjustments: receipt.adjustments as Record<string, unknown>[],
    owner_id: receipt.ownerId ?? "",
    device_id: receipt.deviceId ?? receipt.ownerId ?? "",
    is_shared: receipt.isShared ?? false,
    share_key: receipt.shareKey ?? null,
    hash: receipt.hash,
    last_synced_at: receipt.lastSyncedAt ?? null,
    is_settled: receipt.isSettled ?? false,
  }
}

export function fromRow(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    createdAt: row.created_at,
    billName: row.bill_name ?? undefined,
    imageUrl: row.image_url,
    metadata: row.metadata as Receipt["metadata"],
    people: row.people as Receipt["people"],
    lineItems: row.line_items as Receipt["lineItems"],
    adjustments: row.adjustments as Receipt["adjustments"],
    ownerId: row.owner_id,
    deviceId: row.device_id,
    isShared: row.is_shared,
    shareKey: row.share_key ?? undefined,
    hash: row.hash,
    lastSyncedAt: row.last_synced_at ?? undefined,
    isSettled: row.is_settled ?? false,
  }
}
