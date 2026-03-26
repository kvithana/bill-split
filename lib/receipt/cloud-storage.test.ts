import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Receipt } from "@/lib/types"

// Mock Supabase client before importing cloud-storage
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from "@/lib/supabase/client"
import { CloudReceiptStorage } from "./cloud-storage"

const mockFrom = vi.mocked(supabase.from)

const baseReceipt: Receipt = {
  id: "receipt-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  billName: "Test Receipt",
  imageUrl: "https://example.com/image.jpg",
  metadata: { totalInCents: 2000, businessName: "Test Restaurant" },
  people: [{ id: "p1", name: "Alice" }],
  lineItems: [{ id: "li1", name: "Burger", quantity: 1, totalPriceInCents: 1200 }],
  adjustments: [],
  ownerId: "device-1",
  deviceId: "device-1",
  isShared: false,
  shareKey: undefined,
  hash: "",
}

function makeSupabaseChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    upsert: vi.fn().mockResolvedValue({ error: null, ...overrides }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null, ...overrides }),
    delete: vi.fn().mockReturnThis(),
    ...overrides,
  }
  // Allow chaining
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.or.mockReturnValue(chain)
  chain.delete.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CloudReceiptStorage.getReceipt", () => {
  it("returns null when receipt not found (PGRST116)", async () => {
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "not found" } })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.getReceipt("nonexistent")
    expect(result).toBeNull()
  })

  it("throws on unexpected DB error", async () => {
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: null, error: { code: "500", message: "DB error" } })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    await expect(CloudReceiptStorage.getReceipt("r1")).rejects.toThrow("Failed to fetch receipt")
  })

  it("returns a deserialized receipt when found", async () => {
    const row = {
      id: "receipt-1",
      created_at: "2024-01-01T00:00:00.000Z",
      bill_name: "Test Receipt",
      image_url: "https://example.com/image.jpg",
      metadata: { totalInCents: 2000, businessName: "Test Restaurant" },
      people: [{ id: "p1", name: "Alice" }],
      line_items: [{ id: "li1", name: "Burger", quantity: 1, totalPriceInCents: 1200 }],
      adjustments: [],
      owner_id: "device-1",
      device_id: "device-1",
      is_shared: true,
      share_key: "abc123",
      hash: "somehash",
      last_synced_at: null,
    }
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: row, error: null })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.getReceipt("receipt-1")
    expect(result).not.toBeNull()
    expect(result?.id).toBe("receipt-1")
    expect(result?.billName).toBe("Test Receipt")
    expect(result?.isShared).toBe(true)
    expect(result?.shareKey).toBe("abc123")
    expect(result?.people).toEqual([{ id: "p1", name: "Alice" }])
  })
})

describe("CloudReceiptStorage.saveReceipt", () => {
  it("upserts the receipt with isShared=true and a computed hash", async () => {
    const chain = makeSupabaseChain()
    chain.upsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const saved = await CloudReceiptStorage.saveReceipt(baseReceipt)
    expect(saved.isShared).toBe(true)
    expect(saved.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(chain.upsert).toHaveBeenCalledOnce()
  })

  it("throws on upsert error", async () => {
    const chain = makeSupabaseChain()
    chain.upsert.mockResolvedValue({ error: { message: "constraint violation" } })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    await expect(CloudReceiptStorage.saveReceipt(baseReceipt)).rejects.toThrow("Failed to save receipt")
  })
})

describe("CloudReceiptStorage.updateReceipt", () => {
  it("returns null if receipt not found", async () => {
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "not found" } })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.updateReceipt("nonexistent", { billName: "New Name" })
    expect(result).toBeNull()
  })

  it("succeeds without a hash (unconditional update)", async () => {
    const savedHash = "abc123"
    const existingRow = {
      id: "receipt-1", created_at: "2024-01-01T00:00:00.000Z", bill_name: "Old Name",
      image_url: "img", metadata: { totalInCents: 0 }, people: [], line_items: [], adjustments: [],
      owner_id: "d1", device_id: "d1", is_shared: true, share_key: null, hash: savedHash, last_synced_at: null,
    }
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: existingRow, error: null })
    chain.upsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.updateReceipt("receipt-1", { billName: "New Name" })
    expect(result?.billName).toBe("New Name")
  })

  it("throws conflict error when hash does not match", async () => {
    const existingRow = {
      id: "receipt-1", created_at: "2024-01-01T00:00:00.000Z", bill_name: "Name",
      image_url: "img", metadata: { totalInCents: 0 }, people: [], line_items: [], adjustments: [],
      owner_id: "d1", device_id: "d1", is_shared: true, share_key: null, hash: "stored-hash", last_synced_at: null,
    }
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: existingRow, error: null })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    await expect(
      CloudReceiptStorage.updateReceipt("receipt-1", { billName: "New" }, "wrong-hash")
    ).rejects.toThrow("Receipt has been modified by another user")
  })

  it("succeeds when hash matches", async () => {
    const savedHash = "matching-hash"
    const existingRow = {
      id: "receipt-1", created_at: "2024-01-01T00:00:00.000Z", bill_name: "Name",
      image_url: "img", metadata: { totalInCents: 0 }, people: [], line_items: [], adjustments: [],
      owner_id: "d1", device_id: "d1", is_shared: true, share_key: null, hash: savedHash, last_synced_at: null,
    }
    const chain = makeSupabaseChain()
    chain.single.mockResolvedValue({ data: existingRow, error: null })
    chain.upsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.updateReceipt("receipt-1", { billName: "Updated" }, savedHash)
    expect(result?.billName).toBe("Updated")
  })
})

describe("CloudReceiptStorage.deleteReceipt", () => {
  it("returns false when no rows are deleted (not found or wrong owner)", async () => {
    const chain = makeSupabaseChain()
    // delete chain needs to resolve with count
    const deleteChain = { eq: vi.fn().mockReturnThis() }
    deleteChain.eq.mockReturnValueOnce(deleteChain).mockResolvedValue({ error: null, count: 0 })
    chain.delete.mockReturnValue(deleteChain)
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.deleteReceipt("r1", "wrong-device")
    expect(result).toBe(false)
  })
})

describe("CloudReceiptStorage.listReceiptsByDevice", () => {
  it("returns an empty array when no receipts found", async () => {
    const chain = makeSupabaseChain()
    chain.or.mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>)

    const result = await CloudReceiptStorage.listReceiptsByDevice("device-1")
    expect(result).toEqual([])
  })
})
