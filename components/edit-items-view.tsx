"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Cross, X, MinusCircle, PlusCircle } from "lucide-react"
import { Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import { Label } from "./ui/label"
export default function EditItemsView({
  receipt,
  onSave,
}: {
  receipt: Receipt
  onSave: (receipt: Receipt) => void
}) {
  const [editedReceipt, setEditedReceipt] = useState(receipt)

  const handleMetadataChange = (field: keyof Receipt["metadata"], value: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
    }))
  }

  const handleItemChange = (id: string, field: keyof ReceiptLineItem, value: string | number) => {
    setEditedReceipt((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "totalPriceInCents"
                  ? Math.round(Number.parseFloat(value as unknown as string) * 100)
                  : value,
            }
          : item
      ),
    }))
  }

  const handleAdjustmentChange = (id: string, field: keyof ReceiptAdjustment, value: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      adjustments: prev.adjustments.map((adj) =>
        adj.id === id
          ? {
              ...adj,
              [field]:
                field === "amountInCents" ? Math.round(Number.parseFloat(value) * 100) : value,
            }
          : adj
      ),
    }))
  }

  const addItem = () => {
    const newId = Math.max(0, ...editedReceipt.lineItems.map((i) => Number.parseInt(i.id))) + 1
    setEditedReceipt((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: newId.toString(), name: "", quantity: 1, totalPriceInCents: 0 },
      ],
    }))
  }

  const removeItem = (id: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }))
  }

  const addAdjustment = () => {
    const newId = Math.max(0, ...editedReceipt.adjustments.map((a) => Number.parseInt(a.id))) + 1
    setEditedReceipt((prev) => ({
      ...prev,
      adjustments: [
        ...prev.adjustments,
        { id: newId.toString(), name: "", amountInCents: 0, splitting: { method: "proportional" } },
      ],
    }))
  }

  const removeAdjustment = (id: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      adjustments: prev.adjustments.filter((adj) => adj.id !== id),
    }))
  }

  const calculateTotal = () => {
    const itemsTotal = editedReceipt.lineItems.reduce(
      (sum, item) => sum + item.totalPriceInCents,
      0
    )
    const adjustmentsTotal = editedReceipt.adjustments.reduce(
      (sum, adj) => sum + adj.amountInCents,
      0
    )
    return itemsTotal + adjustmentsTotal
  }

  const handleSave = () => {
    const updatedReceipt = {
      ...editedReceipt,
      metadata: {
        ...editedReceipt.metadata,
        totalInCents: calculateTotal(),
      },
    }
    onSave(updatedReceipt)
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-[#fffdf8] font-mono text-sm">
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <Input
          value={editedReceipt.metadata.businessName}
          onChange={(e) => handleMetadataChange("businessName", e.target.value)}
          placeholder="Business Name"
          className="text-lg font-bold uppercase text-center"
        />
        <Input
          value={editedReceipt.billName}
          onChange={(e) => setEditedReceipt((prev) => ({ ...prev, billName: e.target.value }))}
          placeholder="Bill Name"
          className="text-sm font-handwriting text-center mt-2"
        />
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="md:space-y-2 space-y-4">
          {editedReceipt.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex md:flex-row flex-col items-end md:items-center space-x-2 md:space-y-0 space-y-2"
            >
              <Input
                value={item.name}
                onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                placeholder="Item name"
                className="flex-grow"
              />
              <div className="flex items-center space-x-2">
                <Label className="md:hidden">Qty.</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(item.id, "quantity", Number.parseInt(e.target.value))
                  }
                  className="md:w-12 w-14"
                />
                <Label className="md:hidden">$</Label>
                <Input
                  type="number"
                  value={item.totalPriceInCents / 100}
                  onChange={(e) =>
                    handleItemChange(
                      item.id,
                      "totalPriceInCents",
                      Number.parseFloat(e.target.value)
                    )
                  }
                  className="md:w-20 w-24"
                />
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
        <div className="pt-2 border-t border-dashed border-gray-300 md:space-y-2 space-y-4">
          <h3 className="font-bold mb-2">Receipt Adjustments</h3>
          {editedReceipt.adjustments.map((adjustment) => (
            <div
              key={adjustment.id}
              className="flex md:flex-row flex-col items-end md:items-center space-x-2 md:space-y-0 space-y-2"
            >
              <Input
                value={adjustment.name}
                onChange={(e) => handleAdjustmentChange(adjustment.id, "name", e.target.value)}
                placeholder="Adjustment name"
                className="flex-grow"
              />
              <div className="flex items-center space-x-2">
                <Label className="md:hidden">$</Label>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={() =>
                    handleAdjustmentChange(
                      adjustment.id,
                      "amountInCents",
                      ((-1 * adjustment.amountInCents) / 100).toString()
                    )
                  }
                >
                  {adjustment.amountInCents >= 0 ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  type="number"
                  value={adjustment.amountInCents / 100}
                  onChange={(e) =>
                    handleAdjustmentChange(adjustment.id, "amountInCents", e.target.value)
                  }
                  className="w-20"
                />
                <Button variant="ghost" size="icon" onClick={() => removeAdjustment(adjustment.id)}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addAdjustment} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Adjustment
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">${(calculateTotal() / 100).toFixed(2)}</span>
      </CardFooter>
      <Button onClick={handleSave} className="w-full mt-4">
        Save Changes
      </Button>
    </Card>
  )
}
