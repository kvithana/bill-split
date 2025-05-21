"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useState, useRef, useEffect } from "react"
import type { Person, Receipt } from "@/lib/types"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { calculateReceiptTotal, formatCurrency } from "@/lib/calculations"
import { generateId } from "@/lib/id"
import ConfirmDialog from "../confirm-dialog"
import { ShareReceiptButton } from "../share-receipt-button"
import ReceiptLineItemRow from "../receipt/receipt-line-item-row"
import ReceiptAdjustmentRow from "../receipt/receipt-adjustments-row"
import CustomerSection from "../receipt/customer-section"

export default function DisplayView({
  receipt,
  onItemSelect,
  onRemovePerson,
  onAddPerson,
  isOwner = true,
  onMakeCollaborative,
}: {
  receipt: Receipt
  onItemSelect: (id: string) => void
  onRemovePerson: (id: string) => void
  onAddPerson: (person: Person) => Promise<void>
  isOwner?: boolean
  onMakeCollaborative?: () => Promise<{ receiptId: string; shareKey: string } | null>
}) {
  const { metadata, lineItems, adjustments, people } = receipt
  const contentRef = useRef<HTMLDivElement>(null)
  const [isCustomerSectionExpanded, setIsCustomerSectionExpanded] = useState(false)

  // Add state for confirm dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [personToRemove, setPersonToRemove] = useState<Person | null>(null)

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("scrollPosition")
    if (savedScrollPosition && contentRef.current) {
      contentRef.current.scrollTop = Number.parseInt(savedScrollPosition)
    }
  }, [])

  const handleAddPerson = (name: string) => {
    if (name.trim()) {
      const person: Person = {
        id: generateId(),
        name: name.trim(),
      }

      onAddPerson(person)
    }
  }

  // Updated remove person handler
  const handleRemovePersonClick = (person: Person) => {
    setPersonToRemove(person)
    setIsConfirmDialogOpen(true)
  }

  // New method to confirm removal
  const confirmRemovePerson = () => {
    if (personToRemove) {
      onRemovePerson(personToRemove.id)
      setPersonToRemove(null)
      setIsConfirmDialogOpen(false)
    }
  }

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <div className="flex items-center justify-center relative">
          <h2 className="text-lg font-bold uppercase">{metadata.businessName}</h2>

          {/* Share button or indicator */}
          <ShareReceiptButton
            receipt={receipt}
            isOwner={isOwner}
            onMakeCollaborative={onMakeCollaborative}
          />
        </div>
        <p className="text-xs text-gray-500">
          {new Date(receipt.metadata.dateAsISOString ?? receipt.createdAt).toLocaleDateString()}
        </p>
        <p className="text-sm font-handwriting mt-2">{receipt.billName}</p>
        {receipt.imageUrl && (
          <p>
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-2 border-b border-dotted border-gray-400 hover:border-gray-600 text-xs uppercase text-gray-500">
                  original receipt
                </button>
              </DialogTrigger>
              <DialogContent className="border-none p-2">
                <DialogTitle className="flex items-center justify-center font-mono font-normal text-xs mt-2">
                  Uploaded on {format(new Date(receipt.createdAt), "MMM d, yyyy HH:mm a")}
                </DialogTitle>{" "}
                <div className="relative w-full h-[80dvh] flex items-center justify-center">
                  <img
                    src={receipt.imageUrl}
                    alt="Receipt"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </p>
        )}
      </CardHeader>

      {/* Customer section moved to the top, after header */}
      <CustomerSection
        people={people}
        isExpanded={isCustomerSectionExpanded}
        onToggle={() => setIsCustomerSectionExpanded(!isCustomerSectionExpanded)}
        onRemove={handleRemovePersonClick}
        onAdd={handleAddPerson}
        isOwner={isOwner}
      />

      <CardContent className="p-2 md:p-4 space-y-2" ref={contentRef}>
        <div className="space-y-2">
          {lineItems.map((item) => (
            <ReceiptLineItemRow
              key={item.id}
              item={item}
              people={people}
              onItemSelect={onItemSelect}
              contentRef={contentRef}
            />
          ))}
        </div>

        {/* Adjustments */}
        {!!adjustments.length && (
          <div className="pt-2 border-t border-dashed border-gray-300">
            {adjustments.map((adjustment) => (
              <ReceiptAdjustmentRow
                key={adjustment.id}
                adjustment={adjustment}
                people={people}
                onItemSelect={onItemSelect}
                contentRef={contentRef}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4 px-5 md:px-8">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">{formatCurrency(calculateReceiptTotal(receipt))}</span>
      </CardFooter>

      {/* Add confirmation dialog */}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={confirmRemovePerson}
        onCancel={() => {
          setPersonToRemove(null)
          setIsConfirmDialogOpen(false)
        }}
        title="Remove Customer"
        description={`Are you sure you want to remove ${personToRemove?.name || ""} from this bill? Any items assigned to them will become unallocated.`}
        confirmText="REMOVE"
        cancelText="CANCEL"
      />
    </Card>
  )
}
