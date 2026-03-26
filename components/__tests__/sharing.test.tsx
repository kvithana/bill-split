import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import type { Receipt } from "@/lib/types"

// Minimal mocks for dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement("div", props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}))

const MockIcon = () => React.createElement("span")
vi.mock("lucide-react", () => ({
  CloudIcon: MockIcon,
  Share2: MockIcon,
  UsersIcon: MockIcon,
  RefreshCwIcon: MockIcon,
  RefreshCw: MockIcon,
  Check: MockIcon,
  Copy: MockIcon,
}))

vi.mock("@/hooks/use-standalone", () => ({ useStandalone: () => false }))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    React.createElement("button", { onClick, disabled, ...props }, children),
}))

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement("div", { "data-testid": "dialog" }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h2", null, children),
  DialogTrigger: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement("p", null, children),
}))

const baseReceipt: Receipt = {
  id: "receipt-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  billName: "Test",
  imageUrl: "https://example.com/img.jpg",
  metadata: { totalInCents: 2000 },
  people: [],
  lineItems: [],
  adjustments: [],
  ownerId: "device-1",
  deviceId: "device-1",
  isShared: false,
  hash: "",
}

describe("ShareReceiptButton", () => {
  // Dynamic import inside describe so mocks are set up first
  let ShareReceiptButton: typeof import("../share-receipt-button").ShareReceiptButton

  beforeEach(async () => {
    const mod = await import("../share-receipt-button")
    ShareReceiptButton = mod.ShareReceiptButton
  })

  it("renders nothing when isOwner is false and receipt is not shared", () => {
    const { container } = render(
      <ShareReceiptButton receipt={baseReceipt} isOwner={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders SHARE button when isOwner is true and receipt is not shared", () => {
    const onMakeCollaborative = vi.fn().mockResolvedValue(null)
    render(
      <ShareReceiptButton
        receipt={baseReceipt}
        isOwner={true}
        onMakeCollaborative={onMakeCollaborative}
      />
    )
    expect(screen.getByRole("button")).toBeDefined()
  })

  it("renders SHARED button when receipt.isShared is true", () => {
    const sharedReceipt = { ...baseReceipt, isShared: true, shareKey: "abc123" }
    render(<ShareReceiptButton receipt={sharedReceipt} isOwner={true} />)
    // Should render a button (the SHARED button)
    expect(screen.getByRole("button")).toBeDefined()
  })
})

describe("ShareReceiptDialog", () => {
  let ShareReceiptDialog: typeof import("../share-receipt-dialog").ShareReceiptDialog

  beforeEach(async () => {
    const mod = await import("../share-receipt-dialog")
    ShareReceiptDialog = mod.ShareReceiptDialog
  })

  it("calls onShare when confirm is clicked", async () => {
    const onShare = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()

    render(
      <ShareReceiptDialog
        open={true}
        onOpenChange={onOpenChange}
        onShare={onShare}
        isSharing={false}
      />
    )

    const buttons = screen.getAllByRole("button")
    const confirmButton = buttons.find((b) => b.textContent?.includes("CONFIRM"))
    expect(confirmButton).toBeDefined()
    fireEvent.click(confirmButton!)
    expect(onShare).toHaveBeenCalledOnce()
  })

  it("calls onOpenChange(false) when cancel is clicked", () => {
    const onShare = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ShareReceiptDialog
        open={true}
        onOpenChange={onOpenChange}
        onShare={onShare}
        isSharing={false}
      />
    )

    const buttons = screen.getAllByRole("button")
    const cancelButton = buttons.find((b) => b.textContent?.includes("CANCEL"))
    expect(cancelButton).toBeDefined()
    fireEvent.click(cancelButton!)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe("RealtimeStatusBadge", () => {
  let RealtimeStatusBadge: typeof import("../realtime-status-badge").RealtimeStatusBadge

  beforeEach(async () => {
    const mod = await import("../realtime-status-badge")
    RealtimeStatusBadge = mod.RealtimeStatusBadge
  })

  it("shows Live indicator when connected", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    render(<RealtimeStatusBadge isConnected={true} onRefresh={onRefresh} />)
    expect(screen.getByText("Live")).toBeDefined()
  })

  it("shows Refresh button when disconnected", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    render(<RealtimeStatusBadge isConnected={false} onRefresh={onRefresh} />)
    expect(screen.getByRole("button")).toBeDefined()
  })
})
