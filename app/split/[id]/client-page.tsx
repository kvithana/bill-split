"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Receipt, Person } from "@/lib/types"
import SplitReceiptContainer from "@/components/split-receipt-container"
import NameSelectionDialog from "@/components/name-selection-dialog"
import { generateId } from "@/lib/id"
import { personNameCollides } from "@/lib/people"
import { splitShareDisplayNameKey } from "@/lib/share-session"

export function SplitReceiptPage() {
  const { id: receiptId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const shareKey = searchParams.get("key")
  const viewParam = searchParams.get("view")
  const initialView = viewParam === "summary" ? "summary" : "display"

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [prefillShareName, setPrefillShareName] = useState("")

  useEffect(() => {
    if (typeof window === "undefined" || !receiptId) return

    const stored = localStorage.getItem(splitShareDisplayNameKey(receiptId))
    if (stored?.trim()) {
      setPrefillShareName(stored.trim())
      return
    }

    const idRaw = localStorage.getItem(`split-identity-${receiptId}`)
    if (!idRaw) return
    try {
      const p = JSON.parse(idRaw) as Person
      if (p?.name?.trim()) setPrefillShareName(p.name.trim())
    } catch {
      // ignore
    }
  }, [receiptId])

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

  // Restore saved identity once receipt is loaded (don't block if none saved)
  useEffect(() => {
    if (!receipt || selectedPerson) return

    const saved = localStorage.getItem(`split-identity-${receiptId}`)
    if (!saved) return

    try {
      const savedPerson = JSON.parse(saved) as Person
      const stillExists = receipt.people.find((p) => p.id === savedPerson.id)
      if (stillExists) {
        setSelectedPerson(savedPerson)
      }
    } catch {
      // Ignore parse errors — user will be prompted via the banner
    }
  }, [receipt, receiptId, selectedPerson])

  const handleNameSelection = async (selectedName: string, isExistingPerson: boolean) => {
    if (!receipt) return

    try {
      if (isExistingPerson) {
        const person = receipt.people.find((p) => p.name === selectedName)
        if (person) {
          localStorage.setItem(`split-identity-${receiptId}`, JSON.stringify(person))
          localStorage.setItem(splitShareDisplayNameKey(receiptId), person.name)
          setSelectedPerson(person)
          setIsNameDialogOpen(false)
          return
        }
      }

      if (personNameCollides(receipt.people, selectedName)) {
        toast({
          title: "Name already on this bill",
          description: "Choose yourself from the list or use a different name.",
          variant: "destructive",
        })
        return
      }

      const newPerson: Person = {
        id: generateId(),
        name: selectedName.trim(),
      }

      const response = await fetch(`/api/receipts/${receiptId}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Share-Key": shareKey!,
        },
        body: JSON.stringify({
          person: newPerson,
          shareKey,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add person: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.receipt) {
        localStorage.setItem(`split-identity-${receiptId}`, JSON.stringify(newPerson))
        localStorage.setItem(splitShareDisplayNameKey(receiptId), newPerson.name)
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

  return (
    <>
      <SplitReceiptContainer
        receipt={receipt}
        currentPerson={selectedPerson}
        onRequestIdentity={() => setIsNameDialogOpen(true)}
        receiptId={receiptId}
        shareKey={shareKey!}
        initialView={initialView}
      />
      <NameSelectionDialog
        isOpen={isNameDialogOpen}
        onClose={() => setIsNameDialogOpen(false)}
        onSelect={handleNameSelection}
        existingPeople={receipt.people}
        prefillNewName={prefillShareName}
      />
    </>
  )
}
