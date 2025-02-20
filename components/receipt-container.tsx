"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import DisplayView from "./display-view"
import EditItemsView from "./edit-items-view"
import SplittingView from "./splitting-view"
import SummaryView from "./summary-view"
import { Receipt, ReceiptSchema } from "@/lib/types"
import { useReceiptStore } from "@/data/state"
import useStore from "@/hooks/use-store"
import { generateId } from "@/lib/id"

type ViewMode = "display" | "edit" | "splitting" | "summary"

export default function ReceiptContainer({ id }: { id: string }) {
  const [receipt] = useStore((state) => state.receipts[id])
  const addPersonAction = useReceiptStore((state) => state.addPerson)
  const removePersonAction = useReceiptStore((state) => state.removePerson)
  const setReceipt = useReceiptStore((state) => state.updateReceipt)
  const [viewMode, setViewMode] = useState<ViewMode>("display")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const handleSave = (updatedReceipt: Receipt) => {
    setReceipt(id, ReceiptSchema.parse(updatedReceipt))
    setViewMode("display")
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    setViewMode("splitting")
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

  console.log(receipt)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4">
      <div className="flex space-x-2 mb-4">
        <Button onClick={() => setViewMode("display")}>View</Button>
        <Button onClick={() => setViewMode("edit")}>Edit</Button>
        <Button onClick={() => setViewMode("summary")}>Summary</Button>
      </div>
      {viewMode === "display" && (
        <DisplayView
          receipt={receipt}
          onItemSelect={handleItemSelect}
          onAddPerson={addPerson}
          onRemovePerson={removePerson}
        />
      )}
      {viewMode === "edit" && <EditItemsView receipt={receipt} onSave={handleSave} />}
      {viewMode === "splitting" && selectedItemId && (
        <SplittingView
          receipt={receipt}
          itemId={selectedItemId}
          onSave={handleSave}
          onBack={() => setViewMode("display")}
          onAddPerson={addPerson}
        />
      )}
      {viewMode === "summary" && <SummaryView receipt={receipt} />}
    </div>
  )
}
