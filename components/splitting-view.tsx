"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Minus, Percent, Equal, Sliders, UserPlus, UserMinus } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import * as R from "ramda"
import { getColorForPerson } from "@/lib/colors"

export default function SplittingView({
  receipt,
  itemId,
  onSave,
  onBack,
  onAddPerson,
}: {
  receipt: Receipt
  itemId: string
  onSave: (editedReceipt: Receipt) => void
  onBack: () => void
  onAddPerson: (name: string) => void
}) {
  const [editedReceipt, setEditedReceipt] = useState(receipt)
  const [newPersonName, setNewPersonName] = useState("")

  const isLineItem = (item: ReceiptLineItem | ReceiptAdjustment): item is ReceiptLineItem =>
    "totalPriceInCents" in item

  const findItem = R.pipe(
    (id: string) => [
      R.find((x) => x.id === id, editedReceipt.lineItems),
      R.find((x) => x.id === id, editedReceipt.adjustments),
    ],
    R.reject(R.isNil),
    R.head<ReceiptLineItem | ReceiptAdjustment>
  )

  const item = findItem(itemId)
  if (!item) throw new Error("Item not found")

  const handlePortionChange = (personId: string, newPortion: number) => {
    if (isLineItem(item)) {
      const updatedItem: ReceiptLineItem = {
        ...item,
        splitting: {
          ...item.splitting,
          portions:
            item.splitting?.portions?.map((p) =>
              p.personId === personId ? { ...p, portions: Math.max(1, newPortion) } : p
            ) || [],
        },
      }
      updateItem(updatedItem)
    } else {
      const updatedItem: ReceiptAdjustment = {
        ...item,
        splitting: {
          ...item.splitting,
          portions:
            item.splitting?.portions?.map((p) =>
              p.personId === personId ? { ...p, portions: Math.max(1, newPortion) } : p
            ) || [],
        },
      }
      updateItem(updatedItem)
    }
  }

  const handleMethodChange = (method: "equal" | "proportional" | "manual") => {
    if (isLineItem(item)) return

    let updatedPortions = item.splitting?.portions || []

    if (method === "equal") {
      updatedPortions = []
    } else if (method === "proportional") {
      updatedPortions = []
    }

    const updatedItem = {
      ...item,
      splitting: {
        ...item.splitting,
        method,
        portions: updatedPortions,
      },
    }
    updateItem(updatedItem)
  }

  const updateItem = (updatedItem: ReceiptLineItem | ReceiptAdjustment) => {
    setEditedReceipt((prev) => ({
      ...prev,
      [isLineItem(item) ? "lineItems" : "adjustments"]: prev[
        isLineItem(item) ? "lineItems" : "adjustments"
      ].map((i) => (i.id === itemId ? updatedItem : i)),
    }))
  }

  const addPerson = () => {
    if (!newPersonName.trim()) return
    onAddPerson(newPersonName)
    setNewPersonName("")
  }

  const togglePerson = (personId: string) => {
    const personIndex = item.splitting?.portions?.findIndex((p) => p.personId === personId)
    let updatedPortions

    if (personIndex === -1) {
      updatedPortions = [...(item.splitting?.portions || []), { personId, portions: 1 }]
    } else {
      updatedPortions = (item.splitting?.portions || []).filter((p) => p.personId !== personId)
    }

    const updatedItem = {
      ...item,
      splitting: {
        ...item.splitting,
        portions: updatedPortions,
      },
    } as ReceiptLineItem | ReceiptAdjustment
    updateItem(updatedItem)
  }

  const selectAllPeople = () => {
    const updatedPortions = receipt.people.map((person) => ({ personId: person.id, portions: 1 }))
    const updatedItem = {
      ...item,
      splitting: {
        ...item.splitting,
        portions: updatedPortions,
      },
    } as ReceiptLineItem | ReceiptAdjustment
    updateItem(updatedItem)
  }

  const unselectAllPeople = () => {
    const updatedItem = {
      ...item,
      splitting: {
        ...item.splitting,
        portions: [],
      },
    } as ReceiptLineItem | ReceiptAdjustment
    updateItem(updatedItem)
  }

  const total = isLineItem(item) ? item.totalPriceInCents : item.amountInCents

  const splittingMethod = !isLineItem(item) ? item.splitting?.method : "manual"

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <h2 className="text-lg font-bold">{item.name}</h2>
        <p className="text-sm">${(total / 100).toFixed(2)}</p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {!isLineItem(item) && (
          <div className="space-y-2">
            <Label className="font-bold">Splitting Method</Label>
            <RadioGroup
              value={splittingMethod}
              onValueChange={handleMethodChange}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal" className="flex items-center space-x-2 cursor-pointer">
                  <Equal className="h-4 w-4" />
                  <span>Equal - Split evenly among all people</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                <RadioGroupItem value="proportional" id="proportional" />
                <Label
                  htmlFor="proportional"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Percent className="h-4 w-4" />
                  <span>Proportional - Split based on each person's share of other items</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex items-center space-x-2 cursor-pointer">
                  <Sliders className="h-4 w-4" />
                  <span>Manual - Customize portions for each person</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        {(isLineItem(item) || splittingMethod === "manual") && (
          <div className="space-y-2">
            <div className="flex justify-between md:items-center w-full md:flex-row flex-col">
              <Label className="flex-1 font-bold">Assign to People</Label>
              <div className="space-x-2 md:mt-0 mt-2 flex w-full md:w-auto md:flex-1">
                <Button
                  className="w-full md:w-auto"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPeople}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Select All
                </Button>
                <Button
                  className="w-full md:w-auto"
                  variant="outline"
                  size="sm"
                  onClick={unselectAllPeople}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unselect All
                </Button>
              </div>
            </div>
            {receipt.people.map((person, index) => {
              const isSelected = item.splitting?.portions?.some((p) => p.personId === person.id)
              const portion = item.splitting?.portions?.find((p) => p.personId === person.id)
              return (
                <div key={person.id} className="flex items-center space-x-2">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="flex-grow"
                    onClick={() => togglePerson(person.id)}
                    style={isSelected ? { backgroundColor: getColorForPerson(index) } : {}}
                  >
                    {person.name}
                  </Button>
                  {isSelected && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newVal = (portion?.portions || 1) - 1
                          handlePortionChange(person.id, newVal)
                          if (newVal === 0) {
                            togglePerson(person.id)
                          }
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={portion?.portions || 1}
                        onChange={(e) =>
                          handlePortionChange(person.id, Number.parseInt(e.target.value))
                        }
                        className="w-12 md:w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePortionChange(person.id, (portion?.portions || 1) + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {(splittingMethod === "manual" || isLineItem(item)) && (
          <div className="flex items-center space-x-2">
            <Input
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="New person name"
              className="flex-grow"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newPersonName.trim()) {
                  addPerson()
                }
              }}
            />
            <Button onClick={addPerson}>Add Person</Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onSave(editedReceipt)}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
