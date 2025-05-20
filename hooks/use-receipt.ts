"use client"

import { useState, useCallback, useEffect } from "react"
import { useReceiptStore } from "@/data/state"
import { Receipt, ReceiptLineItem, ReceiptAdjustment, Person } from "@/lib/types"
import { getDeviceId } from "@/lib/device-id"

// Type for receipt source - determines where the receipt is stored
export type ReceiptSource = "local" | "cloud"

// Type for the return value of the useReceipt hook
export type UseReceiptResult = {
  receipt: Receipt | null
  isLoading: boolean
  error: string | null
  isCloud: boolean
  // Mutations
  updateLineItems: (lineItems: ReceiptLineItem[]) => Promise<void>
  updateAdjustments: (adjustments: ReceiptAdjustment[]) => Promise<void>
  addPerson: (person: Person) => Promise<void>
  removePerson: (personId: string) => Promise<void>
  moveToCloud: () => Promise<string | null> // Returns the cloud ID if successful
  refresh: () => Promise<void> // Force refresh from the source
}

/**
 * Hook to manage receipt data, abstracting away the difference between local and cloud storage
 * @param receiptId The ID of the receipt to manage
 * @returns An object with receipt data and mutation methods
 */
export function useReceipt(receiptId: string): UseReceiptResult {
  const [source, setSource] = useState<ReceiptSource>("local")
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Get store methods
  const localReceipt = useReceiptStore(
    useCallback((state) => state.receipts[receiptId], [receiptId])
  )
  const updateLocalLineItems = useReceiptStore((state) => state.updateLineItems)
  const updateLocalAdjustments = useReceiptStore((state) => state.updateAdjustments)
  const addLocalPerson = useReceiptStore((state) => state.addPerson)
  const removeLocalPerson = useReceiptStore((state) => state.removePerson)

  // Fetch receipt data based on the source
  const fetchReceipt = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (source === "local") {
        // Local receipts come directly from the store
        setReceipt(localReceipt || null)
      } else {
        // Cloud receipts are fetched from the API
        const response = await fetch(`/api/receipts/${receiptId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Device-ID": getDeviceId(),
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch receipt: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.success && data.receipt) {
          setReceipt(data.receipt)
        } else {
          throw new Error(data.error || "Unknown error")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      // Fall back to local state if cloud fetch fails
      if (source === "cloud" && localReceipt) {
        setReceipt(localReceipt)
        setSource("local")
      }
    } finally {
      setIsLoading(false)
    }
  }, [receiptId, source, localReceipt])

  // Initialize and handle source changes
  useEffect(() => {
    // Determine if this is a cloud receipt by checking if it has isShared flag
    if (localReceipt && "isShared" in localReceipt && localReceipt.isShared === true) {
      setSource("cloud")
    } else {
      setSource("local")
    }

    fetchReceipt()
  }, [fetchReceipt, localReceipt])

  // Update line items based on the source
  const updateLineItems = useCallback(
    async (lineItems: ReceiptLineItem[]) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          updateLocalLineItems(receiptId, lineItems)
          // Update the receipt state
          setReceipt((prev) => (prev ? { ...prev, lineItems } : null))
        } else {
          // Update cloud state
          const response = await fetch(`/api/receipts/${receiptId}/line-items`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Device-ID": getDeviceId(),
            },
            body: JSON.stringify({ lineItems }),
          })

          if (!response.ok) {
            throw new Error(`Failed to update line items: ${response.statusText}`)
          }

          // Refresh the receipt data from the cloud
          await fetchReceipt()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    },
    [receipt, source, receiptId, updateLocalLineItems, fetchReceipt]
  )

  // Update adjustments based on the source
  const updateAdjustments = useCallback(
    async (adjustments: ReceiptAdjustment[]) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          updateLocalAdjustments(receiptId, adjustments)
          // Update the receipt state
          setReceipt((prev) => (prev ? { ...prev, adjustments } : null))
        } else {
          // Update cloud state
          const response = await fetch(`/api/receipts/${receiptId}/adjustments`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Device-ID": getDeviceId(),
            },
            body: JSON.stringify({ adjustments }),
          })

          if (!response.ok) {
            throw new Error(`Failed to update adjustments: ${response.statusText}`)
          }

          // Refresh the receipt data from the cloud
          await fetchReceipt()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    },
    [receipt, source, receiptId, updateLocalAdjustments, fetchReceipt]
  )

  // Add a person based on the source
  const addPerson = useCallback(
    async (person: Person) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          addLocalPerson(receiptId, person)
          // Update the receipt state
          setReceipt((prev) => (prev ? { ...prev, people: [...prev.people, person] } : null))
        } else {
          // Update cloud state
          const response = await fetch(`/api/receipts/${receiptId}/people`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Device-ID": getDeviceId(),
            },
            body: JSON.stringify({ person }),
          })

          if (!response.ok) {
            throw new Error(`Failed to add person: ${response.statusText}`)
          }

          // Refresh the receipt data from the cloud
          await fetchReceipt()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    },
    [receipt, source, receiptId, addLocalPerson, fetchReceipt]
  )

  // Remove a person based on the source
  const removePerson = useCallback(
    async (personId: string) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          removeLocalPerson(receiptId, personId)
          // Update the receipt state
          setReceipt((prev) =>
            prev
              ? {
                  ...prev,
                  people: prev.people.filter((p) => p.id !== personId),
                }
              : null
          )
        } else {
          // Update cloud state
          const response = await fetch(`/api/receipts/${receiptId}/people/${personId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-Device-ID": getDeviceId(),
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to remove person: ${response.statusText}`)
          }

          // Refresh the receipt data from the cloud
          await fetchReceipt()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    },
    [receipt, source, receiptId, removeLocalPerson, fetchReceipt]
  )

  // Move a local receipt to the cloud
  const moveToCloud = useCallback(async () => {
    if (!receipt) return null

    // If already a cloud receipt, just return the ID
    if (source === "cloud") return receiptId

    try {
      setIsLoading(true)

      // Call the API to create a cloud version
      const response = await fetch("/api/receipts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": getDeviceId(),
        },
        body: JSON.stringify({
          receipt: {
            ...receipt,
            deviceId: getDeviceId(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to move receipt to cloud: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.receiptId) {
        // Update local receipt to indicate it's now in the cloud
        const updatedReceipt = {
          ...receipt,
          isShared: true,
        } as Receipt

        // Update local storage with the updated receipt
        useReceiptStore.getState().updateReceipt(receiptId, updatedReceipt)

        // Update our state
        setReceipt(updatedReceipt)
        setSource("cloud")

        return data.receiptId
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [receipt, source, receiptId])

  // Force refresh from the source
  const refresh = useCallback(async () => {
    await fetchReceipt()
  }, [fetchReceipt])

  return {
    receipt,
    isLoading,
    error,
    isCloud: source === "cloud",
    updateLineItems,
    updateAdjustments,
    addPerson,
    removePerson,
    moveToCloud,
    refresh,
  }
}
