"use client"

import { useEffect, useRef, useState } from "react"
import DisplayView from "./display-view"
import EditItemsView from "./edit-items-view"
import SplittingView from "./splitting-view"
import SummaryView from "./summary-view"
import { Receipt, ReceiptSchema } from "@/lib/types"
import { useReceiptStore } from "@/data/state"
import useStore from "@/hooks/use-store"
import { generateId } from "@/lib/id"
import FloatingNav from "./floating-nav"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
type ViewMode = "display" | "edit" | "split" | "summary"

export default function ReceiptContainer({ id }: { id: string }) {
  const [receipt] = useStore((state) => state.receipts[id])
  const addPersonAction = useReceiptStore((state) => state.addPerson)
  const removePersonAction = useReceiptStore((state) => state.removePerson)
  const setReceipt = useReceiptStore((state) => state.updateReceipt)
  const [viewMode, setViewMode] = useState<ViewMode>("display")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [scrollPosition, setScrollPosition] = useState<{ [key: string]: number }>({})
  const router = useRouter()

  const screenId = viewMode === "split" ? viewMode + selectedItemId : viewMode

  useEffect(() => {
    if (screenId === "display" && scrollPosition[screenId]) {
      window.scrollTo(0, scrollPosition[screenId])
    }
  }, [screenId])

  const handleSave = (updatedReceipt: Receipt) => {
    setReceipt(id, ReceiptSchema.parse(updatedReceipt))
    handleViewChange("display")
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    handleViewChange("split")
  }

  const addPerson = (name: string) => {
    addPersonAction(id, { id: generateId(), name })
  }

  const removePerson = (personId: string) => {
    removePersonAction(id, personId)
  }

  if (!receipt) {
    return <div>Receipt not found</div>
  }

  const handleViewChange = (newView: ViewMode) => {
    if (newView === "summary") {
      const isFullySplit =
        receipt.lineItems.every((item) => (item.splitting?.portions || []).length > 0) &&
        receipt.adjustments.every((adj) =>
          adj.splitting.method === "manual" ? (adj.splitting.portions || []).length > 0 : true
        )
      if (!isFullySplit) {
        toast({
          title: "Some items are not split",
          description: "Please split all items before viewing the summary.",
          variant: "destructive",
        })
        return
      }
    }

    // set previous view scroll position
    setScrollPosition((prev) => ({ ...prev, [screenId]: window.scrollY }))

    setViewMode(newView)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/")}
        className="hidden md:flex items-center fixed top-4 left-4 bg-[#fffdf8] border border-dashed border-gray-300 rounded-full"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span className="text-sm font-mono">Back</span>
      </Button>
      <div className="flex-1 w-full pb-16">
        {viewMode === "display" && (
          <DisplayView
            receipt={receipt}
            onItemSelect={handleItemSelect}
            onAddPerson={addPerson}
            onRemovePerson={removePerson}
          />
        )}
        {viewMode === "edit" && <EditItemsView receipt={receipt} onSave={handleSave} />}
        {viewMode === "split" && selectedItemId && (
          <SplittingView
            receipt={receipt}
            itemId={selectedItemId}
            onSave={handleSave}
            onBack={() => handleViewChange("display")}
            onAddPerson={addPerson}
          />
        )}
        {viewMode === "summary" && <SummaryView receipt={receipt} />}
      </div>
      <FloatingNav
        currentView={viewMode}
        onViewChange={handleViewChange}
        onBack={() => router.push("/")}
      />
    </div>
  )
}
