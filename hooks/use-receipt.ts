"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
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

  // Use a ref to track if we're currently fetching to prevent double fetches
  const [isFetching, setIsFetching] = useState(false)

  // Memoize the selector function to avoid recreation on each render
  const receiptSelector = useCallback(
    (state: { receipts: Record<string, Receipt> }) => state.receipts[receiptId],
    [receiptId]
  )

  // Get state from Zustand with memoized selectors
  const localReceipt = useReceiptStore(receiptSelector)

  // Memoize the store actions to prevent re-renders when the component re-renders
  // but the store hasn't changed
  const storeActions = useMemo(() => {
    return {
      updateLineItems: useReceiptStore.getState().updateLineItems,
      updateAdjustments: useReceiptStore.getState().updateAdjustments,
      addPerson: useReceiptStore.getState().addPerson,
      removePerson: useReceiptStore.getState().removePerson,
      updateReceipt: useReceiptStore.getState().updateReceipt,
    }
  }, []) // Empty dependency array as we only need these once

  // Check if receipt is a cloud receipt
  const isReceiptCloud = useCallback((receipt: Receipt | null | undefined) => {
    return receipt && "isShared" in receipt && receipt.isShared === true
  }, [])

  // Fetch receipt data based on the source
  const fetchReceipt = useCallback(
    async (skipLoadingState = false) => {
      // Prevent double fetches in progress
      if (isFetching) return

      try {
        // Only set loading state if not skipping and not already loading
        if (!skipLoadingState) {
          setIsLoading(true)
        }
        setIsFetching(true)
        setError(null)

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
        setIsFetching(false)
        setIsLoading(false)
      }
    },
    [receiptId, source, localReceipt]
  ) // Removed isLoading from dependencies

  // First determine the source based on receipt properties
  useEffect(() => {
    const newSource = isReceiptCloud(localReceipt) ? "cloud" : "local"

    if (newSource !== source) {
      setSource(newSource)
    }
  }, [localReceipt, source, isReceiptCloud])

  // Then fetch the receipt whenever source changes or on initial mount
  useEffect(() => {
    fetchReceipt()
    // This effect should run when source or fetchReceipt changes
  }, [source, fetchReceipt])

  // Update line items based on the source
  const updateLineItems = useCallback(
    async (lineItems: ReceiptLineItem[]) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          storeActions.updateLineItems(receiptId, lineItems)
          // Update the receipt state to immediately reflect changes
          setReceipt((prev) => (prev ? { ...prev, lineItems } : null))
        } else {
          // For cloud state, set loading to indicate operation in progress
          setIsLoading(true)

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

          // Refresh the receipt data from the cloud, but skip setting loading state again
          await fetchReceipt(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        // Ensure loading is set to false after operation
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, fetchReceipt]
  )

  // Update adjustments based on the source
  const updateAdjustments = useCallback(
    async (adjustments: ReceiptAdjustment[]) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          storeActions.updateAdjustments(receiptId, adjustments)
          // Update the receipt state
          setReceipt((prev) => (prev ? { ...prev, adjustments } : null))
        } else {
          // For cloud state, set loading to indicate operation in progress
          setIsLoading(true)

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

          // Refresh the receipt data from the cloud, but skip setting loading state again
          await fetchReceipt(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        // Ensure loading is set to false after operation
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, fetchReceipt]
  )

  // Add a person based on the source
  const addPerson = useCallback(
    async (person: Person) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          storeActions.addPerson(receiptId, person)
          // Update the receipt state
          setReceipt((prev) => (prev ? { ...prev, people: [...prev.people, person] } : null))
        } else {
          // For cloud state, set loading to indicate operation in progress
          setIsLoading(true)

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

          // Refresh the receipt data from the cloud, but skip setting loading state again
          await fetchReceipt(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        // Ensure loading is set to false after operation
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, fetchReceipt]
  )

  // Remove a person based on the source
  const removePerson = useCallback(
    async (personId: string) => {
      if (!receipt) return

      try {
        if (source === "local") {
          // Update local state
          storeActions.removePerson(receiptId, personId)
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
          // For cloud state, set loading to indicate operation in progress
          setIsLoading(true)

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

          // Refresh the receipt data from the cloud, but skip setting loading state again
          await fetchReceipt(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        // Ensure loading is set to false after operation
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, fetchReceipt]
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
        storeActions.updateReceipt(receiptId, updatedReceipt)

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
  }, [receipt, source, receiptId, storeActions])

  // Force refresh from the source - memoized once and stable
  const refresh = useCallback(async () => {
    await fetchReceipt(false) // Explicitly set loading state for manual refresh
  }, [fetchReceipt])

  // Memoize the return value to avoid unnecessary re-renders in consumers
  return useMemo(
    () => ({
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
    }),
    [
      receipt,
      isLoading,
      error,
      source,
      updateLineItems,
      updateAdjustments,
      addPerson,
      removePerson,
      moveToCloud,
      refresh,
    ]
  )
}
