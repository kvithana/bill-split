import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import type { Receipt } from "@/lib/types"
import { SyncConflictError, useReceipt } from "@/hooks/use-receipt"

// ---------------------------------------------------------------------------
// Hoisted mock values (must be created before vi.mock factories run)
// ---------------------------------------------------------------------------
const { mockStoreActions, mockToast } = vi.hoisted(() => ({
  mockStoreActions: {
    updateLineItems: vi.fn(),
    updateAdjustments: vi.fn(),
    addPerson: vi.fn(),
    removePerson: vi.fn(),
    updateReceipt: vi.fn(),
  },
  mockToast: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/data/state", () => {
  const useReceiptStore = vi.fn().mockImplementation(
    (selector: (s: { receipts: Record<string, Receipt> }) => unknown) =>
      selector({ receipts: {} })
  )
  useReceiptStore.getState = () => ({ receipts: {}, ...mockStoreActions })
  return { useReceiptStore }
})

vi.mock("@/hooks/use-toast", () => ({ toast: (...args: unknown[]) => mockToast(...args) }))
vi.mock("@/lib/device-id", () => ({ getDeviceId: () => "test-device" }))

// Minimal Supabase realtime stub — not under test here
vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const BASE_HASH = "original-hash"

const baseCloudReceipt: Receipt = {
  id: "receipt-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  billName: "Test Bill",
  imageUrl: "",
  metadata: { totalInCents: 1000, businessName: "Test" },
  people: [],
  lineItems: [{ id: "li1", name: "Burger", quantity: 1, totalPriceInCents: 1000 }],
  adjustments: [],
  ownerId: "test-device",
  deviceId: "test-device",
  isShared: true,
  shareKey: "share-key-1",
  hash: BASE_HASH,
}

const updatedLineItems = [{ id: "li1", name: "Burger", quantity: 2, totalPriceInCents: 2000 }]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock Response object with an empty statusText to simulate HTTP/2. */
function mockResponse(status: number, body: unknown, { ok }: { ok?: boolean } = {}) {
  return {
    ok: ok ?? status < 400,
    status,
    statusText: "", // HTTP/2 never sends statusText
    json: async () => body,
  } as Response
}

/**
 * Sets up global.fetch with sequential responses, then mounts the hook and
 * waits until the hook is in cloud mode and the initial GET has finished.
 */
async function setupCloudHook(fetchResponses: Response[]) {
  let callIndex = 0
  global.fetch = vi.fn().mockImplementation(async () => {
    const response = fetchResponses[callIndex] ?? fetchResponses[fetchResponses.length - 1]
    callIndex++
    return response
  })

  const { result } = renderHook(() =>
    useReceipt("receipt-1", { initialReceipt: baseCloudReceipt })
  )

  // Wait for cloud mode AND for the initial GET to complete (isLoading → false)
  await waitFor(() => {
    expect(result.current.isCloud).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  return result
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

describe("saveChanges — stale hash fix", () => {
  it("passes the hash from the line-items response to the adjustments call", async () => {
    const HASH_AFTER_LINE_ITEMS = "hash-after-line-items"
    const receiptAfterLineItems = { ...baseCloudReceipt, hash: HASH_AFTER_LINE_ITEMS }
    const receiptAfterAdjustments = { ...baseCloudReceipt, hash: "hash-after-adjustments" }

    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),         // initial GET
      mockResponse(200, { success: true, receipt: receiptAfterLineItems }),    // PUT line-items
      mockResponse(200, { success: true, receipt: receiptAfterAdjustments }),  // PUT adjustments
    ])

    await act(async () => {
      await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems })
    })

    const allCalls = vi.mocked(global.fetch).mock.calls
    const adjCall = allCalls.find(([url]) => (url as string).includes("/adjustments"))
    expect(adjCall).toBeDefined()

    const body = JSON.parse(adjCall![1]!.body as string)
    // KEY assertion: must use the hash returned by the line-items response,
    // not the stale hash that was in the hook state at the start of the save.
    expect(body.hash).toBe(HASH_AFTER_LINE_ITEMS)
    expect(body.hash).not.toBe(BASE_HASH)
  })

  it("sends the original hash to the line-items call", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      mockResponse(200, { success: true, receipt: { ...baseCloudReceipt, hash: "h2" } }),
      mockResponse(200, { success: true, receipt: { ...baseCloudReceipt, hash: "h3" } }),
    ])

    await act(async () => {
      await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems })
    })

    const allCalls = vi.mocked(global.fetch).mock.calls
    const lineItemsCall = allCalls.find(([url]) => (url as string).includes("/line-items"))
    expect(lineItemsCall).toBeDefined()

    const body = JSON.parse(lineItemsCall![1]!.body as string)
    expect(body.hash).toBe(BASE_HASH)
  })
})

describe("saveChanges — 409 sync conflict handling", () => {
  it("throws SyncConflictError when line-items returns 409 syncRequired", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),             // initial GET
      mockResponse(409, { success: false, syncRequired: true, error: "Modified" }), // PUT line-items → conflict
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),             // fetchReceipt refresh
    ])

    let caughtError: unknown
    await act(async () => {
      try {
        await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems })
      } catch (e) {
        caughtError = e
      }
    })

    expect(caughtError).toBeInstanceOf(SyncConflictError)
  })

  it("throws SyncConflictError when adjustments returns 409 syncRequired", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      mockResponse(200, { success: true, receipt: { ...baseCloudReceipt, hash: "h2" } }), // line-items OK
      mockResponse(409, { success: false, syncRequired: true, error: "Modified" }),        // adjustments conflict
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),                    // refresh
    ])

    let caughtError: unknown
    await act(async () => {
      try {
        await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems })
      } catch (e) {
        caughtError = e
      }
    })

    expect(caughtError).toBeInstanceOf(SyncConflictError)
  })

  it("shows the out-of-sync toast on sync conflict, not a generic error toast", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      mockResponse(409, { success: false, syncRequired: true, error: "Modified" }),
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
    ])

    await act(async () => {
      try { await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems }) } catch { /* expected */ }
    })

    expect(mockToast).toHaveBeenCalledOnce()
    const [toastArgs] = mockToast.mock.calls
    expect(toastArgs[0].title).toBe("Receipt out of sync")
    // Must NOT show a generic "Failed to save" toast — the hook leaves that to the caller
    expect(toastArgs[0].title).not.toContain("Failed")
  })

  it("refreshes the receipt after a sync conflict so the view shows the latest state", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      mockResponse(409, { success: false, syncRequired: true, error: "Modified" }),
      mockResponse(200, { success: true, receipt: baseCloudReceipt }), // the refresh call
    ])

    await act(async () => {
      try { await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems }) } catch { /* expected */ }
    })

    const allCalls = vi.mocked(global.fetch).mock.calls
    const getCalls = allCalls.filter(
      ([url, init]) => (url as string).includes("receipt-1") && (init as RequestInit).method === "GET"
    )
    // Should have been called twice: initial mount + refresh after conflict
    expect(getCalls.length).toBeGreaterThanOrEqual(2)
  })
})

describe("saveChanges — error message quality (empty statusText fix)", () => {
  it("includes the HTTP status code when the body has no error field", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      // 500 with non-JSON body (json() throws) — old code: "Failed to update: " (empty statusText)
      {
        ok: false,
        status: 500,
        statusText: "",
        json: async () => { throw new Error("not json") },
      } as unknown as Response,
    ])

    let caughtError: unknown
    await act(async () => {
      try {
        await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems })
      } catch (e) {
        caughtError = e
      }
    })

    expect(caughtError).toBeInstanceOf(Error)
    const message = (caughtError as Error).message
    // Must contain the status code — not an empty string like the old behaviour
    expect(message).toContain("500")
    expect(message).not.toBe("Failed to update line items: ")
  })

  it("uses the error field from the response body when present", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      mockResponse(422, {
        success: false,
        error: "Invalid line items data",
      }),
    ])

    let caughtError: unknown
    await act(async () => {
      try {
        await result.current.saveChanges({ ...baseCloudReceipt, lineItems: updatedLineItems })
      } catch (e) {
        caughtError = e
      }
    })

    expect((caughtError as Error).message).toBe("Invalid line items data")
  })
})

describe("updateLineItems — 409 handling (no longer throws with empty statusText)", () => {
  it("handles 409 syncRequired gracefully without throwing", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),           // initial GET
      mockResponse(409, { success: false, syncRequired: true, error: "Modified" }), // PUT → conflict
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),           // fetchReceipt refresh
    ])

    let caughtError: unknown
    await act(async () => {
      try {
        await result.current.updateLineItems(updatedLineItems)
      } catch (e) {
        caughtError = e
      }
    })

    // Should NOT throw — sync conflict is handled gracefully by refreshing
    expect(caughtError).toBeUndefined()
    // The out-of-sync toast should have been shown
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Receipt out of sync" })
    )
  })

  it("throws (with a real message) when a non-conflict error occurs", async () => {
    const result = await setupCloudHook([
      mockResponse(200, { success: true, receipt: baseCloudReceipt }),
      mockResponse(500, { success: false, error: "DB connection failed" }),
    ])

    let caughtError: unknown
    await act(async () => {
      try {
        await result.current.updateLineItems(updatedLineItems)
      } catch (e) {
        caughtError = e
      }
    })

    expect(caughtError).toBeInstanceOf(Error)
    expect((caughtError as Error).message).toBe("DB connection failed")
    // Old behavior was "Failed to update line items: " (empty) — verify it now has content
    expect((caughtError as Error).message.trim()).not.toBe("")
  })
})
