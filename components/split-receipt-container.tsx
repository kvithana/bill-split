"use client"

import { useEffect, useState } from "react"
import { Receipt, Person, ReceiptLineItem, ReceiptAdjustment } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Scissors, UserPlus } from "lucide-react"
import DisplayView from "./views/display-view"
import SplittingView from "./views/splitting-view"
import SummaryView from "./views/summary-view"
import { cn } from "@/lib/utils"
import { useStandalone } from "@/hooks/use-standalone"
import FloatingNav from "./floating-nav"
import { useReceipt } from "@/hooks/use-receipt"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { slideVariants } from "@/lib/animations"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/calculations"
import { getColorForPerson } from "@/lib/colors"
import { UNALLOCATED_ID, UNALLOCATED_NAME } from "@/lib/constants"

type ViewMode = "display" | "split" | "summary" | "edit"

interface SplitReceiptContainerProps {
  receipt: Receipt
  /** null = anonymous / not yet identified */
  currentPerson: Person | null
  onRequestIdentity?: () => void
  receiptId: string
  shareKey: string
  initialView?: "display" | "summary"
}

export default function SplitReceiptContainer({
  receipt: initialReceipt,
  currentPerson,
  onRequestIdentity,
  receiptId,
  shareKey,
  initialView,
}: SplitReceiptContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView ?? "display")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [quickViewItemId, setQuickViewItemId] = useState<string | null>(null)
  const isStandalone = useStandalone()
  const [scrollPosition, setScrollPosition] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [isSavingSplit, setIsSavingSplit] = useState(false)
  const [isReceiptMounted, setIsReceiptMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const {
    receipt,
    isLoading,
    error,
    addPerson,
    removePerson,
    updateLineItems,
    updateAdjustments,
    refresh,
    isRealtimeConnected,
  } = useReceipt(receiptId, { shareKey: shareKey, initialReceipt: initialReceipt })

  const [displayReceipt, setDisplayReceipt] = useState<Receipt | null>(null)

  // Move the current person to the beginning of the people array
  useEffect(() => {
    if (receipt) {
      const updatedReceipt = currentPerson
        ? {
            ...receipt,
            people: [currentPerson, ...receipt.people.filter((p: Person) => p.id !== currentPerson.id)],
          }
        : receipt
      setDisplayReceipt(updatedReceipt)
    } else if (initialReceipt && !receipt) {
      const updatedInitialReceipt = currentPerson
        ? {
            ...initialReceipt,
            people: [
              currentPerson,
              ...initialReceipt.people.filter((p: Person) => p.id !== currentPerson.id),
            ],
          }
        : initialReceipt
      setDisplayReceipt(updatedInitialReceipt)
    }
  }, [receipt, currentPerson, initialReceipt])

  const handleAddPerson = async (person: Person): Promise<boolean> => {
    if (!currentPerson) {
      onRequestIdentity?.()
      return false
    }
    try {
      setLoading(true)
      return await addPerson(person)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add person"
      toast({
        title: "Error adding person",
        description: message,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePerson = async (personId: string) => {
    if (!currentPerson) {
      onRequestIdentity?.()
      return
    }
    if (personId === currentPerson.id) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove yourself from the bill.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await removePerson(personId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove person"
      toast({
        title: "Error removing person",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLineItems = async (lineItems: ReceiptLineItem[]) => {
    try {
      setLoading(true)
      setIsSavingSplit(true)
      await updateLineItems(lineItems)
      setViewMode("display")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update items"
      toast({
        title: "Error updating items",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsSavingSplit(false)
    }
  }

  const handleQuickClaim = async (itemId: string) => {
    if (!currentPerson) {
      onRequestIdentity?.()
      return
    }
    if (!displayReceipt) return

    const item = displayReceipt.lineItems.find((i) => i.id === itemId)
    if (!item) return

    const isAlreadyClaimed = item.splitting?.portions?.some(
      (p) => p.personId === currentPerson.id
    )

    const currentPortions = item.splitting?.portions || []
    const updatedPortions = isAlreadyClaimed
      ? currentPortions.filter((p) => p.personId !== currentPerson.id)
      : [...currentPortions, { personId: currentPerson.id, portions: 1 }]

    const updatedItems = displayReceipt.lineItems.map((i) =>
      i.id === itemId ? { ...i, splitting: { ...i.splitting, portions: updatedPortions } } : i
    )

    try {
      setLoading(true)
      await updateLineItems(updatedItems)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update item"
      toast({
        title: "Error updating item",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAdjustments = async (adjustments: ReceiptAdjustment[]) => {
    try {
      setLoading(true)
      setIsSavingSplit(true)
      await updateAdjustments(adjustments)
      setViewMode("display")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update adjustments"
      toast({
        title: "Error updating adjustments",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsSavingSplit(false)
    }
  }

  const handleItemSelect = (itemId: string) => {
    if (!currentPerson) {
      onRequestIdentity?.()
      return
    }
    setSelectedItemId(itemId)
    setViewMode("split")
  }

  const screenId = viewMode === "split" ? viewMode + selectedItemId : viewMode

  useEffect(() => {
    if (screenId === "display" && scrollPosition[screenId]) {
      window.scrollTo(0, scrollPosition[screenId])
    }
    if (screenId === "summary") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }, [screenId, scrollPosition])

  const handleViewChange = (newView: ViewMode) => {
    setScrollPosition((prev) => ({ ...prev, [screenId]: window.scrollY }))
    setViewMode(newView)
  }

  if (isLoading && !displayReceipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-gray-600">Loading receipt...</p>
      </div>
    )
  }

  if (error && !displayReceipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Alert variant="error" className="max-w-md mx-auto">
          <AlertTitle>Error loading receipt</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!displayReceipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-gray-600">Preparing receipt...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4 pt-4">
      {/* Anonymous identity banner */}
      {!currentPerson && !displayReceipt.isSettled && (
        <button
          onClick={() => onRequestIdentity?.()}
          className="w-full max-w-lg mx-auto mb-3 bg-black text-white font-mono text-xs uppercase py-3 px-4 flex items-center justify-between hover:bg-gray-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5 shrink-0" />
            Identify yourself to claim your share
          </span>
          <span className="text-gray-400">→</span>
        </button>
      )}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="split-receipt-container"
            className={cn("flex-1 w-full", {
              "pb-32": isStandalone,
              "pb-16": !isStandalone,
            })}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={true}
            onAnimationComplete={() => setIsReceiptMounted(true)}
          >
            {!displayReceipt ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-gray-500">Loading receipt...</p>
              </div>
            ) : (
              <>
                {viewMode === "display" && (
                  <DisplayView
                    receipt={displayReceipt}
                    onItemSelect={handleItemSelect}
                    onAddPerson={handleAddPerson}
                    onRemovePerson={handleRemovePerson}
                    isOwner={false}
                    onViewSummary={() => handleViewChange("summary")}
                    currentPersonId={currentPerson?.id}
                    onQuickClaim={displayReceipt.isSettled ? undefined : handleQuickClaim}
                    onQuickView={(id) => setQuickViewItemId(id)}
                  />
                )}

                {viewMode === "split" && selectedItemId && (
                  <SplittingView
                    receipt={displayReceipt}
                    itemId={selectedItemId}
                    onUpdateLineItems={handleUpdateLineItems}
                    onUpdateAdjustments={handleUpdateAdjustments}
                    onBack={() => handleViewChange("display")}
                    onAddPerson={handleAddPerson}
                    isSaving={isSavingSplit}
                  />
                )}

                {viewMode === "summary" && (
                  <SummaryView
                    highlightPersonId={currentPerson?.id}
                    receipt={displayReceipt}
                    shareUrl={`${window.location.origin}/split/${receiptId}?key=${shareKey}`}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isReceiptMounted && displayReceipt && (
        <FloatingNav
          hideEdit={true}
          currentView={viewMode === "split" ? "display" : viewMode}
          onViewChange={handleViewChange}
          onBack={() => window.history.back()}
          scrollToBottomButton={false}
          isCloud={receipt?.isShared === true}
          isRealtimeConnected={isRealtimeConnected}
          onRefresh={refresh}
          loading={loading}
        />
      )}

      {/* Item quick view dialog */}
      {displayReceipt && (() => {
        const qItem = quickViewItemId
          ? displayReceipt.lineItems.find((i) => i.id === quickViewItemId) ??
            displayReceipt.adjustments.find((i) => i.id === quickViewItemId)
          : null
        const assignedPortions = (qItem?.splitting?.portions ?? []).filter(
          (p) => p.personId !== UNALLOCATED_ID
        )
        const hasUnallocated = (qItem?.splitting?.portions ?? []).some(
          (p) => p.personId === UNALLOCATED_ID
        )
        const totalCents =
          qItem && "totalPriceInCents" in qItem
            ? qItem.totalPriceInCents
            : qItem && "amountInCents" in qItem
            ? qItem.amountInCents
            : 0

        return (
          <Dialog
            open={!!quickViewItemId}
            onOpenChange={(open) => !open && setQuickViewItemId(null)}
          >
            <DialogContent className="sm:max-w-sm font-mono">
              {qItem && (
                <>
                  <DialogHeader className="text-center border-b border-dashed border-gray-300 pb-4">
                    <DialogTitle className="text-base font-bold uppercase">{qItem.name}</DialogTitle>
                    <p className="text-sm text-gray-500">{formatCurrency(totalCents)}</p>
                  </DialogHeader>

                  <div className="py-2 space-y-1">
                    <p className="text-xs uppercase text-gray-400 mb-2">Claimed by</p>
                    {assignedPortions.length === 0 && !hasUnallocated ? (
                      <p className="text-sm text-gray-400 italic">Nobody yet</p>
                    ) : (
                      <>
                        {assignedPortions.map((portion) => {
                          const person = displayReceipt.people.find(
                            (p) => p.id === portion.personId
                          )
                          const personIndex = displayReceipt.people.findIndex(
                            (p) => p.id === portion.personId
                          )
                          const isMe = currentPerson != null && portion.personId === currentPerson.id
                          return person ? (
                            <div
                              key={portion.personId}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: getColorForPerson(personIndex) }}
                                />
                                <span className={isMe ? "font-bold" : ""}>
                                  {person.name}
                                  {isMe && (
                                    <span className="text-xs text-gray-400 font-normal ml-1">
                                      (you)
                                    </span>
                                  )}
                                </span>
                              </div>
                              {portion.portions > 1 && (
                                <span className="text-xs text-gray-400">×{portion.portions}</span>
                              )}
                            </div>
                          ) : null
                        })}
                        {hasUnallocated && (
                          <div className="flex items-center gap-2 py-1 text-yellow-600">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-yellow-400" />
                            <span className="text-sm">{UNALLOCATED_NAME}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-4">
                    <button
                      onClick={() => {
                        const id = quickViewItemId!
                        setQuickViewItemId(null)
                        handleItemSelect(id)
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 text-xs uppercase hover:bg-gray-50 transition-colors"
                    >
                      <Scissors className="h-3 w-3" />
                      {currentPerson ? "Edit split" : "Claim this item"}
                    </button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}
