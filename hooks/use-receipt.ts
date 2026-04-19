"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useReceiptStore } from "@/data/state"
import { Receipt, ReceiptLineItem, ReceiptAdjustment, Person } from "@/lib/types"
import { getDeviceId } from "@/lib/device-id"
import { generateId } from "@/lib/id"
import { toast } from "@/hooks/use-toast"
import { personNameCollides } from "@/lib/people"
import { computeReceiptHash } from "@/lib/receipt/hash"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { fromRow } from "@/lib/receipt/row-mapper"

// Type for receipt source - determines where the receipt is stored
export type ReceiptSource = "local" | "cloud"

/**
 * Thrown by saveChanges when the server rejects the update because the receipt
 * was concurrently modified. The hook already shows a "out of sync" toast and
 * refreshes the receipt — callers should NOT show an additional error toast.
 */
export class SyncConflictError extends Error {
  constructor() {
    super(
      "Receipt was updated by someone else. Your view has been refreshed — please re-save your changes."
    )
    this.name = "SyncConflictError"
  }
}

// Type for the return value of the useReceipt hook
export type UseReceiptResult = {
  receipt: Receipt | null
  isLoading: boolean
  error: string | null
  isCloud: boolean
  isRealtimeConnected: boolean
  // Mutations
  updateLineItems: (lineItems: ReceiptLineItem[]) => Promise<void>
  updateAdjustments: (adjustments: ReceiptAdjustment[]) => Promise<void>
  saveChanges: (lineItems: ReceiptLineItem[], adjustments: ReceiptAdjustment[]) => Promise<void>
  addPerson: (person: Person) => Promise<boolean>
  removePerson: (personId: string) => Promise<void>
  moveToCloud: () => Promise<{ receiptId: string; shareKey: string } | null>
  refresh: () => Promise<void>
}

/**
 * Hook to manage receipt data, abstracting away the difference between local and cloud storage.
 */
export function useReceipt(
  receiptId: string,
  options?: { shareKey?: string; initialReceipt?: Receipt }
): UseReceiptResult {
  const [source, setSource] = useState<ReceiptSource>("local")
  const [receipt, setReceipt] = useState<Receipt | null>(options?.initialReceipt || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const [isFetching, setIsFetching] = useState(false)

  const receiptSelector = useCallback(
    (state: { receipts: Record<string, Receipt> }) => state.receipts[receiptId],
    [receiptId]
  )

  const localReceipt = useReceiptStore(receiptSelector)

  const storeActions = useMemo(() => {
    return {
      updateLineItems: useReceiptStore.getState().updateLineItems,
      updateAdjustments: useReceiptStore.getState().updateAdjustments,
      addPerson: useReceiptStore.getState().addPerson,
      removePerson: useReceiptStore.getState().removePerson,
      updateReceipt: useReceiptStore.getState().updateReceipt,
    }
  }, [])

  const isRealtimeConnectedRef = useRef(false)
  isRealtimeConnectedRef.current = isRealtimeConnected

  const isReceiptCloud = useCallback((r: Receipt | null | undefined) => {
    return r && "isShared" in r && r.isShared === true
  }, [])

  const headers = useMemo(() => {
    if (options?.shareKey) {
      return {
        "Content-Type": "application/json",
        "X-Share-Key": options.shareKey,
      } as Record<string, string>
    }
    return {
      "Content-Type": "application/json",
      "X-Device-ID": getDeviceId(),
    }
  }, [options?.shareKey])

  const fetchReceipt = useCallback(
    async (skipLoadingState = false) => {
      if (isFetching) return

      try {
        if (!skipLoadingState) setIsLoading(true)
        setIsFetching(true)
        setError(null)

        if (source === "local") {
          setReceipt(localReceipt || options?.initialReceipt || null)
          return
        }

        const response = await fetch(`/api/receipts/${receiptId}`, {
          method: "GET",
          headers,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch receipt: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.success && data.receipt) {
          const [newHash, currentHash] = await Promise.all([
            computeReceiptHash(data.receipt),
            receipt ? computeReceiptHash(receipt) : Promise.resolve(null),
          ])

          if (newHash !== currentHash) {
            storeActions.updateReceipt(receiptId, data.receipt)
            setReceipt(data.receipt)
          }
        } else {
          throw new Error(data.error || "Unknown error")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
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
  )

  useEffect(() => {
    const newSource = isReceiptCloud(receipt) ? "cloud" : "local"
    if (newSource !== source) setSource(newSource)
  }, [receipt, source, isReceiptCloud])

  useEffect(() => {
    fetchReceipt()
  }, [source, fetchReceipt])

  // Supabase Realtime subscription for cloud receipts
  useEffect(() => {
    if (source !== "cloud") return

    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`receipt:${receiptId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "receipts",
          filter: `id=eq.${receiptId}`,
        },
        async (payload) => {
           
          const incoming = fromRow(payload.new as any)
          const [incomingHash, currentHash] = await Promise.all([
            computeReceiptHash(incoming),
            receipt ? computeReceiptHash(receipt) : Promise.resolve(null),
          ])
          if (incomingHash !== currentHash) {
            storeActions.updateReceipt(receiptId, incoming)
            setReceipt(incoming)
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
      setIsRealtimeConnected(false)
    }
  }, [source, receiptId])

  const setReceiptFromCloud = useCallback(
    async (incoming: Receipt) => {
      const [newHash, currentHash] = await Promise.all([
        computeReceiptHash(incoming),
        receipt ? computeReceiptHash(receipt) : Promise.resolve(null),
      ])
      if (newHash !== currentHash) {
        storeActions.updateReceipt(receiptId, incoming)
        setReceipt(incoming)
      }
    },
    [receiptId, receipt, storeActions]
  )

  const handleApiResponse = useCallback(
    async (response: Response, operationName: string) => {
      // Always parse the body first — statusText is empty in HTTP/2 and the body
      // carries the real error message and the syncRequired flag.
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean
        receipt?: Receipt
        syncRequired?: boolean
        error?: string
      }

      if (data.success && data.receipt) {
        await setReceiptFromCloud(data.receipt)
        return true
      }

      if (data.syncRequired) {
        // Only show toast if not getting live updates via Realtime
        if (!isRealtimeConnectedRef.current) {
          toast({
            title: "Receipt out of sync",
            description: "Someone else has updated this receipt. Refreshing your view.",
            variant: "destructive",
            duration: 5000,
          })
        }
        await fetchReceipt(false)
        return false
      }

      throw new Error(
        data.error ||
          (response.status ? `Server error (${response.status})` : `Unknown error during ${operationName}`)
      )
    },
    [fetchReceipt, setReceiptFromCloud]
  )

  const updateLineItems = useCallback(
    async (lineItems: ReceiptLineItem[]) => {
      if (!receipt) return

      try {
        if (source === "local") {
          storeActions.updateLineItems(receiptId, lineItems)
          setReceipt((prev) => (prev ? { ...prev, lineItems } : null))
        } else {
          setIsLoading(true)
          const response = await fetch(`/api/receipts/${receiptId}/line-items`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ lineItems, hash: receipt.hash }),
          })

          // Pass the full response to handleApiResponse so it can parse the body
          // and properly detect syncRequired on 409 before throwing.
          const success = await handleApiResponse(response, "update line items")
          if (success) {
            toast({ title: "Changes saved", description: "Line items updated successfully", duration: 1000 })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        throw err // Let the caller show the appropriate error UI
      } finally {
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, handleApiResponse]
  )

  const updateAdjustments = useCallback(
    async (adjustments: ReceiptAdjustment[]) => {
      if (!receipt) return

      try {
        if (source === "local") {
          storeActions.updateAdjustments(receiptId, adjustments)
          setReceipt((prev) => (prev ? { ...prev, adjustments } : null))
        } else {
          setIsLoading(true)
          const response = await fetch(`/api/receipts/${receiptId}/adjustments`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ adjustments, hash: receipt.hash }),
          })

          const success = await handleApiResponse(response, "update adjustments")
          if (success) {
            toast({ title: "Changes saved", description: "Adjustments updated successfully", duration: 1000 })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        throw err // Let the caller show the appropriate error UI
      } finally {
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, handleApiResponse]
  )

  // Saves line items and adjustments in sequence, using the hash returned by the
  // line-items response for the adjustments call. This avoids the stale-hash
  // 409 conflict that occurs when the two calls are made independently.
  const saveChanges = useCallback(
    async (lineItems: ReceiptLineItem[], adjustments: ReceiptAdjustment[]) => {
      if (!receipt) return

      if (source === "local") {
        storeActions.updateLineItems(receiptId, lineItems)
        storeActions.updateAdjustments(receiptId, adjustments)
        setReceipt((prev) => (prev ? { ...prev, lineItems, adjustments } : null))
        return
      }

      setIsLoading(true)
      try {
        const lineItemsResponse = await fetch(`/api/receipts/${receiptId}/line-items`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ lineItems, hash: receipt.hash }),
        })

        // Parse the body before checking ok — statusText is empty in HTTP/2
        // and the body carries the real error and the syncRequired flag.
        const lineItemsData = (await lineItemsResponse.json().catch(() => ({}))) as {
          success?: boolean
          receipt?: Receipt
          syncRequired?: boolean
          error?: string
        }

        if (!lineItemsResponse.ok || !lineItemsData.success) {
          if (lineItemsData.syncRequired) {
            if (!isRealtimeConnectedRef.current) {
              toast({
                title: "Receipt out of sync",
                description: "Someone else has updated this receipt. Refreshing your view.",
                variant: "destructive",
                duration: 5000,
              })
            }
            await fetchReceipt(false)
            throw new SyncConflictError()
          }
          throw new Error(
            lineItemsData.error ||
              `Failed to update items (${lineItemsResponse.status})`
          )
        }

        const updatedAfterLineItems = lineItemsData.receipt!
        storeActions.updateReceipt(receiptId, updatedAfterLineItems)
        setReceipt(updatedAfterLineItems)

        // Use the hash from the line-items response so the server sees the correct version
        const adjustmentsResponse = await fetch(`/api/receipts/${receiptId}/adjustments`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ adjustments, hash: updatedAfterLineItems.hash }),
        })

        const adjustmentsData = (await adjustmentsResponse.json().catch(() => ({}))) as {
          success?: boolean
          receipt?: Receipt
          syncRequired?: boolean
          error?: string
        }

        if (!adjustmentsResponse.ok || !adjustmentsData.success) {
          if (adjustmentsData.syncRequired) {
            if (!isRealtimeConnectedRef.current) {
              toast({
                title: "Receipt out of sync",
                description: "Someone else has updated this receipt. Refreshing your view.",
                variant: "destructive",
                duration: 5000,
              })
            }
            await fetchReceipt(false)
            throw new SyncConflictError()
          }
          throw new Error(
            adjustmentsData.error ||
              `Failed to update adjustments (${adjustmentsResponse.status})`
          )
        }

        await setReceiptFromCloud(adjustmentsData.receipt!)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        throw err // Caller decides whether to show a toast (SyncConflictError → no extra toast)
      } finally {
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, fetchReceipt, headers, setReceiptFromCloud]
  )

  const addPerson = useCallback(
    async (person: Person): Promise<boolean> => {
      if (!receipt) return false

      if (personNameCollides(receipt.people, person.name)) {
        toast({
          title: "Name already on this bill",
          description: "Use a different name or pick yourself from the list.",
          variant: "destructive",
        })
        return false
      }

      try {
        if (source === "local") {
          storeActions.addPerson(receiptId, person)
          setReceipt((prev) => (prev ? { ...prev, people: [...prev.people, person] } : null))
          return true
        }

        setIsLoading(true)
        const response = await fetch(`/api/receipts/${receiptId}/people`, {
          method: "POST",
          headers,
          body: JSON.stringify({ person, hash: receipt.hash }),
        })

        const data = (await response.json().catch(() => ({}))) as {
          success?: boolean
          receipt?: Receipt
          syncRequired?: boolean
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error || `Failed to add person: ${response.statusText}`)
        }

        if (data.success && data.receipt) {
          await setReceiptFromCloud(data.receipt)
          toast({
            title: "Changes saved",
            description: `${person.name} added successfully`,
            duration: 1000,
          })
          return true
        }

        if (data.syncRequired) {
          if (!isRealtimeConnectedRef.current) {
            toast({
              title: "Receipt out of sync",
              description: "Someone else has updated this receipt. Refreshing your view.",
              variant: "destructive",
              duration: 5000,
            })
          }
          await fetchReceipt(false)
          return false
        }

        throw new Error(data.error || "Unknown error during add person")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        toast({
          title: "Failed to add person",
          description: err instanceof Error ? err.message : "Unknown error occurred",
          variant: "destructive",
        })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, setReceiptFromCloud, fetchReceipt, headers]
  )

  const removePerson = useCallback(
    async (personId: string) => {
      if (!receipt) return

      try {
        if (source === "local") {
          storeActions.removePerson(receiptId, personId)
          setReceipt((prev) =>
            prev ? { ...prev, people: prev.people.filter((p) => p.id !== personId) } : null
          )
        } else {
          setIsLoading(true)
          const personName = receipt.people.find((p) => p.id === personId)?.name || "Person"

          const response = await fetch(`/api/receipts/${receiptId}/people/${personId}`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ hash: receipt.hash }),
          })

          if (!response.ok) {
            throw new Error(`Failed to remove person: ${response.statusText}`)
          }

          const success = await handleApiResponse(response, "remove person")
          if (success) {
            toast({ title: "Changes saved", description: `${personName} removed successfully`, duration: 1000 })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        toast({
          title: "Failed to remove person",
          description: err instanceof Error ? err.message : "Unknown error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [receipt, source, receiptId, storeActions, handleApiResponse]
  )

  const moveToCloud = useCallback(async () => {
    if (!receipt) return null

    if (source === "cloud") {
      if (receipt.shareKey) return { receiptId, shareKey: receipt.shareKey }

      const shareKey = generateId()
      try {
        const response = await fetch(`/api/receipts/${receiptId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ shareKey }),
        })

        if (response.ok) {
          const updatedReceipt = { ...receipt, shareKey } as Receipt
          setReceipt(updatedReceipt)
          return { receiptId, shareKey }
        }

        return { receiptId, shareKey: "" }
      } catch {
        return { receiptId, shareKey: "" }
      }
    }

    try {
      setIsLoading(true)
      const shareKey = generateId()

      const response = await fetch("/api/receipts/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          receipt: { ...receipt, deviceId: getDeviceId(), shareKey },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to move receipt to cloud: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.receiptId) {
        const updatedReceipt = { ...receipt, isShared: true, shareKey } as Receipt
        storeActions.updateReceipt(receiptId, updatedReceipt)
        setReceipt(updatedReceipt)
        setSource("cloud")
        return { receiptId: data.receiptId, shareKey }
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

  const refresh = useCallback(async () => {
    await fetchReceipt(false)
  }, [fetchReceipt])

  return useMemo(
    () => ({
      receipt,
      isLoading,
      error,
      isCloud: source === "cloud",
      isRealtimeConnected,
      updateLineItems,
      updateAdjustments,
      saveChanges,
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
      isRealtimeConnected,
      updateLineItems,
      updateAdjustments,
      saveChanges,
      addPerson,
      removePerson,
      moveToCloud,
      refresh,
    ]
  )
}
