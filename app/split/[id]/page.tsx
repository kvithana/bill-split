"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Receipt, Person } from "@/lib/types"
import { EmptyState } from "@/components/empty-state"
import SplitReceiptContainer from "@/components/split-receipt-container"
import NameSelectionDialog from "@/components/name-selection-dialog"
import { generateId } from "@/lib/id"

export default function SplitReceiptPage() {
  const { id: receiptId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const shareKey = searchParams.get("key")

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)

  // Fetch the receipt with the shareKey
  useEffect(() => {
    async function fetchReceipt() {
      if (!shareKey) {
        setError("Missing share key")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/receipts/${receiptId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Share-Key": shareKey,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch receipt: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.receipt) {
          setReceipt(data.receipt)
          setIsNameDialogOpen(false)
        } else {
          throw new Error(data.error || "Failed to load receipt")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load receipt"
        setError(message)
        toast({
          title: "Error loading receipt",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReceipt()
  }, [receiptId, shareKey])

  // Handler for when user selects or creates a name
  const handleNameSelection = async (selectedName: string, isExistingPerson: boolean) => {
    if (!receipt) return

    try {
      if (isExistingPerson) {
        // Find the existing person in the receipt
        const person = receipt.people.find((p) => p.name === selectedName)
        if (person) {
          setSelectedPerson(person)
          setIsNameDialogOpen(false)
          return
        }
      }

      // Create new person if not using existing one
      const newPerson: Person = {
        id: generateId(),
        name: selectedName,
      }

      // Add the person to the receipt using standardized format
      const response = await fetch(`/api/receipts/${receiptId}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person: newPerson, // Using full person object format
          shareKey, // Pass the shareKey for verification
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add person: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.receipt) {
        setReceipt(data.receipt)
        setSelectedPerson(newPerson)
        setIsNameDialogOpen(false)
      } else {
        throw new Error(data.error || "Failed to add person to receipt")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add person"
      toast({
        title: "Error adding person",
        description: message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-sm p-6 font-mono">
          <div className="text-center border-b border-dashed border-gray-300 pb-4">
            <div className="uppercase text-lg font-bold">SPLIT // IT</div>
            <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          </div>

          <div className="py-8 flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
            <div className="text-sm uppercase font-bold">Loading Receipt</div>
            <div className="text-xs text-gray-500 mt-2">
              Please wait while we retrieve your bill
            </div>
          </div>

          <div className="text-center border-t border-dashed border-gray-300 pt-4 text-[0.6rem] text-gray-400">
            <p>*** THANK YOU FOR YOUR PATIENCE ***</p>
            <p className="mt-1">RECEIPT ID: {receiptId.substring(0, 8)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-sm p-6 font-mono">
          <div className="text-center border-b border-dashed border-gray-300 pb-4">
            <div className="uppercase text-lg font-bold">BILL-SPLIT</div>
            <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          </div>

          <div className="py-8 flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <div className="text-sm uppercase font-bold">Receipt Not Found</div>
            <div className="text-xs text-gray-500 mt-2 text-center max-w-xs">
              {error || "The shared receipt link is invalid or has expired"}
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="mt-6 py-2 px-4 bg-black text-white text-sm hover:bg-gray-800"
            >
              RETURN HOME
            </button>
          </div>

          <div className="text-center border-t border-dashed border-gray-300 pt-4 text-[0.6rem] text-gray-400">
            <p>*** ERROR CODE: 404 ***</p>
            <p className="mt-1">RECEIPT ID: {receiptId.substring(0, 8)}</p>
          </div>
        </div>
      </div>
    )
  }

  // If name not selected yet, show only the dialog (which is controlled by isNameDialogOpen)
  if (!selectedPerson) {
    return (
      <>
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-sm shadow-md p-6 font-mono">
            <div className="text-center border-b border-dashed border-gray-300 pb-4">
              <div className="uppercase text-lg font-bold">SPLIT // IT</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="py-6 text-center">
              <h2 className="text-sm uppercase font-bold mb-2">
                {receipt.metadata.businessName || "Receipt"}
              </h2>
              <p className="text-xs text-gray-600 mb-6">
                {receipt.billName ||
                  `Bill from ${new Date(receipt.createdAt).toLocaleDateString()}`}
              </p>

              <p className="text-sm mb-2">To start splitting this bill</p>
              <p className="text-xs text-gray-500 mb-6">Please identify yourself below</p>

              <button
                onClick={() => setIsNameDialogOpen(true)}
                className="w-full py-3 px-4 bg-black text-white hover:bg-gray-800 transition-colors border border-dashed border-gray-300"
              >
                <div className="uppercase text-sm">Select Your Name</div>
                <div className="text-xs mt-1 text-gray-300">or add yourself to this bill</div>
              </button>
            </div>

            <div className="text-center border-t border-dashed border-gray-300 pt-4 text-[0.6rem] text-gray-400">
              <p>*** THANK YOU FOR USING SPLIT // IT ***</p>
              <p className="mt-1">RECEIPT ID: {receiptId.substring(0, 8)}</p>
            </div>
          </div>
        </div>

        <NameSelectionDialog
          isOpen={isNameDialogOpen}
          onClose={() => setIsNameDialogOpen(false)}
          onSelect={handleNameSelection}
          existingPeople={receipt.people}
        />
      </>
    )
  }

  return (
    <SplitReceiptContainer
      receipt={receipt}
      currentPerson={selectedPerson}
      receiptId={receiptId}
      shareKey={shareKey!}
    />
  )
}
