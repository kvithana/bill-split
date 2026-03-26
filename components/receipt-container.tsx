"use client"

import { useEffect, useRef, useState } from "react"
import DisplayView from "./views/display-view"
import EditItemsView, { type EditItemsViewHandle } from "./views/edit-items-view"
import SplittingView from "./views/splitting-view"
import SummaryView from "./views/summary-view"
import { Person, Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import FloatingNav from "./floating-nav"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { getDeviceId } from "@/lib/device-id"
import { motion, AnimatePresence } from "framer-motion"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import { useStandalone } from "@/hooks/use-standalone"
import { useReceipt } from "@/hooks/use-receipt"
import { slideVariants, backButtonVariants } from "@/lib/animations"

type ViewMode = "display" | "edit" | "split" | "summary"

export default function ReceiptContainer({ id, fromScan }: { id: string; fromScan: boolean }) {
  const {
    receipt,
    isLoading,
    error,
    updateLineItems: updateLineItemsAction,
    updateAdjustments: updateAdjustmentsAction,
    addPerson: addPersonAction,
    removePerson: removePersonAction,
    moveToCloud,
    refresh,
    isRealtimeConnected,
  } = useReceipt(id)

  const [viewMode, setViewMode] = useState<ViewMode>("display")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [scrollPosition, setScrollPosition] = useState<{ [key: string]: number }>({})
  const [hasEditChanges, setHasEditChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const [showNav, setShowNav] = useState(false)
  const [isReceiptMounted, setIsReceiptMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const isStandalone = useStandalone()
  const [loading, setLoading] = useState(false)
  const editItemsViewRef = useRef<EditItemsViewHandle>(null)

  const screenId = viewMode === "split" ? viewMode + selectedItemId : viewMode

  useEffect(() => {
    if (screenId === "display" && scrollPosition[screenId]) {
      window.scrollTo(0, scrollPosition[screenId])
    }
  }, [screenId, scrollPosition])

  useEffect(() => {
    // Once the receipt animation is complete, wait 2 seconds then show nav
    if (isReceiptMounted) {
      const timer = setTimeout(() => {
        setShowNav(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isReceiptMounted])

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        router.push("/")
      }, 500) // Wait for exit animation to complete
      return () => clearTimeout(timer)
    }
  }, [isVisible, router])

  const handleSave = async (
    updatedReceipt: Receipt,
    options?: { navigateAfter?: boolean }
  ) => {
    const navigateAfter = options?.navigateAfter !== false
    try {
      setIsSaving(true)
      await updateLineItemsAction(updatedReceipt.lineItems)
      await updateAdjustmentsAction(updatedReceipt.adjustments)

      await refresh()

      if (navigateAfter) {
        handleViewChange("display", { fromSuccessfulSave: true })
        toast({
          title: "Changes saved successfully",
          description: "Your receipt has been updated.",
          duration: 2000,
        })
      }
    } catch (err) {
      toast({
        title: "Failed to save changes",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    handleViewChange("split")
  }

  const addPerson = async (person: Person): Promise<boolean> => {
    try {
      setLoading(true)
      return await addPersonAction(person)
    } catch (err) {
      toast({
        title: "Failed to add person",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const removePerson = async (personId: string) => {
    try {
      setLoading(true)
      await removePersonAction(personId)
    } catch (err) {
      toast({
        title: "Failed to remove person",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateLineItems = async (lineItems: ReceiptLineItem[]) => {
    try {
      setLoading(true)
      await updateLineItemsAction(lineItems)
      handleViewChange("display")
    } catch (err) {
      toast({
        title: "Failed to update items",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async () => {
    try {
      setLoading(true)
      const deviceId = getDeviceId()
      const response = await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": deviceId,
        },
        body: JSON.stringify({ isSettled: true }),
      })
      if (!response.ok) throw new Error("Failed to settle bill")
      await refresh()
      toast({ title: "Bill settled", description: "This receipt is now read-only." })
    } catch (err) {
      toast({
        title: "Failed to settle bill",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateAdjustments = async (adjustments: ReceiptAdjustment[]) => {
    try {
      setLoading(true)
      await updateAdjustmentsAction(adjustments)
      handleViewChange("display")
    } catch (err) {
      toast({
        title: "Failed to update adjustments",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show error state if there's an error or no receipt
  if (error || (!isLoading && !receipt)) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-gray-400" />}
        title="Receipt not found"
        description={error || "The receipt you're looking for doesn't exist"}
        delay={1}
      />
    )
  }

  const handleViewChange = async (
    newView: ViewMode,
    options?: { fromSuccessfulSave?: boolean }
  ) => {
    // Skip validation if receipt is not loaded yet
    if (!receipt) return

    if (
      viewMode === "edit" &&
      newView === "display" &&
      !options?.fromSuccessfulSave
    ) {
      const ok = (await editItemsViewRef.current?.saveIfNeeded()) ?? true
      if (!ok) return
    }

    if (viewMode === "edit") {
      setHasEditChanges(false)
    }

    // set previous view scroll position
    setScrollPosition((prev) => ({ ...prev, [screenId]: window.scrollY }))

    setViewMode(newView)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4 pt-0">
      <AnimatePresence>
        {isVisible && (
          <motion.div className="flex w-full p-4 pl-0 pr-0" {...backButtonVariants}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="font-mono text-gray-500 hover:text-gray-800 -ml-2 md:-ml-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              BACK
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="receipt-container"
            className={cn("flex-1 w-full ", {
              "pb-32": isStandalone,
              "pb-16": !isStandalone,
            })}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={fromScan}
            onAnimationComplete={() => setIsReceiptMounted(true)}
          >
            {!receipt && isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-gray-500">Loading receipt...</p>
              </div>
            ) : (
              <>
                {viewMode === "display" && (
                  <DisplayView
                    isOwner={true}
                    receipt={receipt!}
                    onItemSelect={handleItemSelect}
                    onAddPerson={addPerson}
                    onRemovePerson={removePerson}
                    onMakeCollaborative={receipt && !receipt.isShared ? moveToCloud : undefined}
                  />
                )}
                {viewMode === "edit" && (
                  <EditItemsView
                    ref={editItemsViewRef}
                    setHasEditChanges={setHasEditChanges}
                    receipt={receipt!}
                    onSave={handleSave}
                    isSaving={isSaving}
                  />
                )}
                {viewMode === "split" && selectedItemId && (
                  <SplittingView
                    receipt={receipt!}
                    itemId={selectedItemId}
                    onUpdateLineItems={updateLineItems}
                    onUpdateAdjustments={updateAdjustments}
                    onBack={() => handleViewChange("display")}
                    onAddPerson={addPerson}
                  />
                )}
                {viewMode === "summary" && (
                  <SummaryView
                    receipt={receipt!}
                    isOwner={true}
                    onMakeCollaborative={receipt && !receipt.isShared ? moveToCloud : undefined}
                    onSettle={receipt?.isShared && !receipt?.isSettled ? handleSettle : undefined}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showNav && receipt && (
        <FloatingNav
          currentView={viewMode}
          onViewChange={handleViewChange}
          onBack={() => setIsVisible(false)}
          scrollToBottomButton={hasEditChanges}
          isCloud={receipt?.isShared === true}
          isRealtimeConnected={isRealtimeConnected}
          onRefresh={refresh}
          loading={loading}
        />
      )}
    </div>
  )
}
