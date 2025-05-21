"use client"

import { useEffect, useState } from "react"
import DisplayView from "./views/display-view"
import EditItemsView from "./views/edit-items-view"
import SplittingView from "./views/splitting-view"
import SummaryView from "./views/summary-view"
import { Person, Receipt, ReceiptAdjustment, ReceiptLineItem } from "@/lib/types"
import FloatingNav from "./floating-nav"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
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

  const handleSave = async (updatedReceipt: Receipt) => {
    try {
      setIsSaving(true)
      await updateLineItemsAction(updatedReceipt.lineItems)
      await updateAdjustmentsAction(updatedReceipt.adjustments)

      handleViewChange("display")
      await refresh()

      toast({
        title: "Changes saved successfully",
        description: "Your receipt has been updated.",
        duration: 2000,
      })
    } catch (err) {
      toast({
        title: "Failed to save changes",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    handleViewChange("split")
  }

  const addPerson = async (person: Person) => {
    try {
      setLoading(true)
      await addPersonAction(person)
    } catch (err) {
      toast({
        title: "Failed to add person",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
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

  const handleViewChange = (newView: ViewMode) => {
    // Skip validation if receipt is not loaded yet
    if (!receipt) return

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
          onRefresh={refresh}
          loading={loading}
        />
      )}
    </div>
  )
}
