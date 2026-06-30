"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Minus,
  Percent,
  Equal,
  Sliders,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Receipt, ReceiptAdjustment, ReceiptLineItem, Person } from "@/lib/types"
import * as R from "ramda"
import { getColorForPerson } from "@/lib/colors"
import { generateId } from "@/lib/id"
import { UNALLOCATED_ID, UNALLOCATED_NAME } from "@/lib/constants"
import { DEFAULT_ADJUSTMENT_SPLIT_METHOD } from "@/lib/receipt/adjustment-splitting"
import { syncUnallocated } from "@/lib/receipt/portions"

export default function SplittingView({
  receipt,
  itemId,
  onUpdateLineItems,
  onUpdateAdjustments,
  onBack,
  onAddPerson,
  isSaving = false,
}: {
  receipt: Receipt
  itemId: string
  onUpdateLineItems: (lineItems: ReceiptLineItem[]) => void | Promise<void>
  onUpdateAdjustments: (adjustments: ReceiptAdjustment[]) => void | Promise<void>
  onBack: () => void
  onAddPerson: (person: Person) => Promise<boolean>
  isSaving?: boolean
}) {
  const [editedReceipt, setEditedReceipt] = useState(receipt)
  const [newPersonName, setNewPersonName] = useState("")
  const addPersonInputRef = useRef<HTMLInputElement>(null)
  const addPersonRowRef = useRef<HTMLDivElement>(null)

  // On iOS the keyboard shrinks visualViewport without scrolling content. When
  // the keyboard appears while the name input is focused, scroll the whole row
  // (input + button) above the keyboard.
  useEffect(() => {
    const scrollRowIntoView = () => {
      if (document.activeElement !== addPersonInputRef.current) return
      if (!addPersonRowRef.current) return
      const rect = addPersonRowRef.current.getBoundingClientRect()
      const vv = window.visualViewport
      if (!vv) return
      const visibleBottom = vv.offsetTop + vv.height
      if (rect.bottom > visibleBottom - 16) {
        window.scrollBy({ top: rect.bottom - visibleBottom + 32, behavior: "smooth" })
      }
    }
    window.visualViewport?.addEventListener("resize", scrollRowIntoView)
    return () => window.visualViewport?.removeEventListener("resize", scrollRowIntoView)
  }, [])

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
    if (!personId || personId.trim() === "") return

    if (isLineItem(item)) {
      const real = (item.splitting?.portions || [])
        .filter((p) => p.personId !== UNALLOCATED_ID)
        .map((p) => p.personId === personId ? { ...p, portions: Math.max(1, newPortion) } : p)
      updateItem({
        ...item,
        splitting: { ...item.splitting, portions: syncUnallocated(item.quantity, real) },
      } as ReceiptLineItem)
    } else {
      updateItem({
        ...item,
        splitting: {
          ...item.splitting,
          portions:
            item.splitting?.portions?.map((p) =>
              p.personId === personId ? { ...p, portions: Math.max(1, newPortion) } : p
            ) || [],
        },
      } as ReceiptAdjustment)
    }
  }

  const handleMethodChange = (method: "equal" | "proportional" | "manual") => {
    // This function only applies to adjustments, not line items
    // (line items always use manual splitting)
    if (isLineItem(item)) return

    let updatedPortions = item.splitting?.portions || []
    const unallocatedPortion = updatedPortions.find((p) => p.personId === UNALLOCATED_ID)

    if (method === "equal" || method === "proportional") {
      // For equal and proportional, clear portions
      updatedPortions = []
    } else if (method === "manual") {
      // For manual, keep only unallocated if it exists
      updatedPortions = unallocatedPortion ? [unallocatedPortion] : []
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
    // Helper function to filter out invalid portions (empty personIds)
    const filterValidPortions = (portions: { personId: string; portions: number }[] = []) =>
      portions.filter((p) => p.personId && p.personId.trim() !== "")

    if (isLineItem(updatedItem)) {
      // For line items
      const ensuredLineItem: ReceiptLineItem = {
        ...updatedItem,
        splitting: {
          portions: filterValidPortions(updatedItem.splitting?.portions),
        },
      }

      setEditedReceipt((prev) => ({
        ...prev,
        lineItems: prev.lineItems.map((i) => (i.id === itemId ? ensuredLineItem : i)),
      }))
    } else {
      // For adjustments
      const ensuredAdjustment: ReceiptAdjustment = {
        ...updatedItem,
        splitting: {
          method: updatedItem.splitting.method ?? DEFAULT_ADJUSTMENT_SPLIT_METHOD,
          portions: filterValidPortions(updatedItem.splitting.portions),
        },
      }

      setEditedReceipt((prev) => ({
        ...prev,
        adjustments: prev.adjustments.map((i) => (i.id === itemId ? ensuredAdjustment : i)),
      }))
    }
  }

  const handleSave = async () => {
    // Helper function to filter valid portions
    const filterValidPortions = (portions: { personId: string; portions: number }[] = []) =>
      portions.filter((p) => p.personId && p.personId.trim() !== "")

    // Create a clean copy of the edited receipt with valid portions
    const cleanedReceipt = {
      ...editedReceipt,
      lineItems: editedReceipt.lineItems.map((item) => ({
        ...item,
        splitting: item.splitting
          ? {
              ...item.splitting,
              portions: filterValidPortions(item.splitting.portions),
            }
          : undefined,
      })),
      adjustments: editedReceipt.adjustments.map((adjustment) => ({
        ...adjustment,
        splitting: {
          ...adjustment.splitting,
          method: adjustment.splitting.method ?? DEFAULT_ADJUSTMENT_SPLIT_METHOD,
          portions: filterValidPortions(adjustment.splitting.portions || []),
        },
      })),
    }

    if (isLineItem(item)) {
      await Promise.resolve(onUpdateLineItems(cleanedReceipt.lineItems))
    } else {
      await Promise.resolve(onUpdateAdjustments(cleanedReceipt.adjustments))
    }
  }

  const addPerson = async () => {
    const trimmed = newPersonName.trim()
    if (!trimmed) return

    const person: Person = {
      id: generateId(),
      name: trimmed,
    }

    const added = await onAddPerson(person)
    if (added) {
      setNewPersonName("")
    }
  }

  const togglePerson = (personId: string) => {
    if (!personId || personId.trim() === "") return

    const real = (item.splitting?.portions || []).filter((p) => p.personId !== UNALLOCATED_ID)
    const isSelected = real.some((p) => p.personId === personId)

    const newReal = isSelected
      ? real.filter((p) => p.personId !== personId)
      : [...real, { personId, portions: 1 }]

    const newPortions = isLineItem(item) ? syncUnallocated(item.quantity, newReal) : newReal
    updateItem({ ...item, splitting: { ...item.splitting, portions: newPortions } } as ReceiptLineItem | ReceiptAdjustment)
  }

  const selectAllPeople = () => {
    const real = receipt.people
      .filter((person) => person.id && person.id.trim() !== "")
      .map((person) => ({ personId: person.id, portions: 1 }))
    const newPortions = isLineItem(item) ? syncUnallocated(item.quantity, real) : real
    updateItem({ ...item, splitting: { ...item.splitting, portions: newPortions } } as ReceiptLineItem | ReceiptAdjustment)
  }

  const unselectAllPeople = () => {
    const newPortions = isLineItem(item) ? syncUnallocated(item.quantity, []) : []
    updateItem({ ...item, splitting: { ...item.splitting, portions: newPortions } } as ReceiptLineItem | ReceiptAdjustment)
  }

  const total = isLineItem(item) ? item.totalPriceInCents : item.amountInCents

  const splittingMethod = !isLineItem(item)
    ? (item.splitting?.method ?? DEFAULT_ADJUSTMENT_SPLIT_METHOD)
    : "manual"

  const unallocatedCount = isLineItem(item)
    ? Math.max(
        0,
        item.quantity -
          (item.splitting?.portions || [])
            .filter((p) => p.personId !== UNALLOCATED_ID)
            .reduce((s, p) => s + p.portions, 0)
      )
    : 0

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
      <CardHeader className="text-center border-b border-dashed border-gray-300 relative">
        <button
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-4 flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs uppercase"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only md:not-sr-only">Back</span>
        </button>
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

            {/* Unallocated row — read-only, derived from quantity minus assigned portions */}
            {unallocatedCount > 0 && (
              <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2 mb-2 px-1 text-sm text-gray-500">
                <span>{UNALLOCATED_NAME}</span>
                <span className="font-mono bg-gray-100 rounded px-2 py-0.5">{unallocatedCount}</span>
              </div>
            )}

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
                          if (newVal === 0) {
                            togglePerson(person.id)
                          } else {
                            handlePortionChange(person.id, newVal)
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
          <div ref={addPersonRowRef} className="flex items-center space-x-2">
            <Input
              ref={addPersonInputRef}
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="New person name"
              className="flex-grow"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newPersonName.trim()) {
                  void addPerson()
                }
              }}
            />
            <Button onClick={() => void addPerson()}>Add Person</Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  )
}
