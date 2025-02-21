"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import type { Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function EditItemsView({
  receipt,
  onSave,
}: {
  receipt: Receipt
  onSave: (receipt: Receipt) => void
}) {
  const [editedReceipt, setEditedReceipt] = useState({
    ...receipt,
    lineItems: receipt.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      totalPriceInCents: (item.totalPriceInCents / 100).toFixed(2),
    })),
    adjustments: receipt.adjustments.map((adjustment) => ({
      ...adjustment,
      amountInCents: (adjustment.amountInCents / 100).toFixed(2),
    })),
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleMetadataChange = (field: keyof Receipt["metadata"], value: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
    }))
  }

  const handleItemChange = (id: string, field: keyof ReceiptLineItem, value: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
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
              [field]: value,
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
        { id: newId.toString(), name: "", quantity: "1", totalPriceInCents: "0.00" },
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
        {
          id: newId.toString(),
          name: "",
          amountInCents: "0.00",
          splitting: { method: "proportional", portions: [] },
        },
      ],
    }))
  }

  const removeAdjustment = (id: string) => {
    setEditedReceipt((prev) => ({
      ...prev,
      adjustments: prev.adjustments.filter((adj) => adj.id !== id),
    }))
  }

  const calculateTotal = (): number | string => {
    const itemsTotal = editedReceipt.lineItems.reduce((sum, item) => {
      const itemTotal = Number.parseFloat(item.totalPriceInCents) * Number.parseFloat(item.quantity)
      return isNaN(itemTotal) ? sum : sum + itemTotal
    }, 0)

    const adjustmentsTotal = editedReceipt.adjustments.reduce((sum, adj) => {
      const adjAmount = Number.parseFloat(adj.amountInCents)
      return isNaN(adjAmount) ? sum : sum + adjAmount
    }, 0)

    const total = itemsTotal + adjustmentsTotal
    return isNaN(total) ? "ERR!" : total.toFixed(2)
  }

  const validateReceipt = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    editedReceipt.lineItems.forEach((item, index) => {
      if (!item.name) newErrors[`item-${index}-name`] = "Name is required"
      if (isNaN(Number.parseFloat(item.quantity)) || Number.parseFloat(item.quantity) <= 0) {
        newErrors[`item-${index}-quantity`] = "Quantity must be a positive number"
      }
      if (isNaN(Number.parseFloat(item.totalPriceInCents))) {
        newErrors[`item-${index}-price`] = "Price must be a valid number"
      }
    })

    editedReceipt.adjustments.forEach((adjustment, index) => {
      if (!adjustment.name) newErrors[`adjustment-${index}-name`] = "Name is required"
      if (isNaN(Number.parseFloat(adjustment.amountInCents))) {
        newErrors[`adjustment-${index}-amount`] = "Amount must be a valid number"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && calculateTotal() !== "ERR!"
  }

  const handleSave = () => {
    if (validateReceipt()) {
      const updatedReceipt = {
        ...editedReceipt,
        lineItems: editedReceipt.lineItems.map((item) => ({
          ...item,
          quantity: Number.parseInt(item.quantity),
          totalPriceInCents: Math.round(Number.parseFloat(item.totalPriceInCents) * 100),
        })),
        adjustments: editedReceipt.adjustments.map((adjustment) => ({
          ...adjustment,
          amountInCents: Math.round(Number.parseFloat(adjustment.amountInCents) * 100),
        })),
      }
      onSave(updatedReceipt)
      toast({
        title: "Changes saved successfully",
        description: "Your receipt has been updated.",
      })
    } else {
      toast({
        title: "Validation error",
        description: "Please correct the errors before saving.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
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
          {editedReceipt.lineItems.map((item, index) => (
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
              {errors[`item-${index}-name`] && (
                <p className="text-red-500 text-xs">{errors[`item-${index}-name`]}</p>
              )}
              <div className="flex items-center space-x-2">
                <Label className="md:hidden">Qty.</Label>
                <Input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                  className="md:w-12 w-14"
                />
                {errors[`item-${index}-quantity`] && (
                  <p className="text-red-500 text-xs">{errors[`item-${index}-quantity`]}</p>
                )}
                <Label className="md:hidden">$</Label>
                <Input
                  type="text"
                  value={item.totalPriceInCents}
                  onChange={(e) => handleItemChange(item.id, "totalPriceInCents", e.target.value)}
                  className="md:w-20 w-24"
                />
                {errors[`item-${index}-price`] && (
                  <p className="text-red-500 text-xs">{errors[`item-${index}-price`]}</p>
                )}
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
          {editedReceipt.adjustments.map((adjustment, index) => (
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
              {errors[`adjustment-${index}-name`] && (
                <p className="text-red-500 text-xs">{errors[`adjustment-${index}-name`]}</p>
              )}
              <div className="flex items-center space-x-2">
                <Label className="md:hidden">$</Label>
                <Input
                  type="text"
                  value={adjustment.amountInCents}
                  onChange={(e) =>
                    handleAdjustmentChange(adjustment.id, "amountInCents", e.target.value)
                  }
                  className="w-20"
                />
                {errors[`adjustment-${index}-amount`] && (
                  <p className="text-red-500 text-xs">{errors[`adjustment-${index}-amount`]}</p>
                )}
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
        <span className={`font-bold text-lg ${calculateTotal() === "ERR!" ? "text-red-500" : ""}`}>
          ${calculateTotal()}
        </span>
      </CardFooter>
      <div className="p-4 mt-2">
        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </div>
    </Card>
  )
}
