"use client"

import { useEffect, useRef, useState } from "react"
import DisplayView from "./display-view"
import EditItemsView from "./edit-items-view"
import SplittingView from "./splitting-view"
import SummaryView from "./summary-view"
import { Receipt, ReceiptAdjustment, ReceiptLineItem, ReceiptSchema } from "@/lib/types"
import { useReceiptStore } from "@/data/state"
import useStore from "@/hooks/use-store"
import { generateId } from "@/lib/id"
import FloatingNav from "./floating-nav"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import { useStandalone } from "@/hooks/use-standalone"

type ViewMode = "display" | "edit" | "split" | "summary"

const slideVariants = {
  initial: {
    y: "100%",
  },
  animate: (fromScan: boolean) => ({
    y: 0,
    transition: {
      duration: fromScan ? 5 : 1,
      ease: "easeOut",
    },
  }),
  exit: {
    y: "100%",
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export default function ReceiptContainer({ id, fromScan }: { id: string; fromScan: boolean }) {
  const [receipt] = useStore((state) => state.receipts[id])
  const addPersonAction = useReceiptStore((state) => state.addPerson)
  const removePersonAction = useReceiptStore((state) => state.removePerson)
  const updateLineItemsAction = useReceiptStore((state) => state.updateLineItems)
  const updateAdjustmentsAction = useReceiptStore((state) => state.updateAdjustments)
  const setReceipt = useReceiptStore((state) => state.updateReceipt)
  const [viewMode, setViewMode] = useState<ViewMode>("display")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [scrollPosition, setScrollPosition] = useState<{ [key: string]: number }>({})
  const [hasEditChanges, setHasEditChanges] = useState(false)
  const router = useRouter()
  const [showNav, setShowNav] = useState(false)
  const [isReceiptMounted, setIsReceiptMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const isStandalone = useStandalone()

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

  const handleSave = (updatedReceipt: Receipt) => {
    setReceipt(id, ReceiptSchema.parse(updatedReceipt))
    handleViewChange("display")
  }

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    handleViewChange("split")
  }

  const addPerson = (name: string) => {
    addPersonAction(id, { id: generateId(), name })
  }

  const removePerson = (personId: string) => {
    removePersonAction(id, personId)
  }

  const updateLineItems = (lineItems: ReceiptLineItem[]) => {
    updateLineItemsAction(id, lineItems)
    handleViewChange("display")
  }

  const updateAdjustments = (adjustments: ReceiptAdjustment[]) => {
    updateAdjustmentsAction(id, adjustments)
    handleViewChange("display")
  }

  if (!receipt) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-gray-400" />}
        title="Receipt not found"
        description="The receipt you're looking for doesn't exist"
        delay={1}
      />
    )
  }

  const handleViewChange = (newView: ViewMode) => {
    if (newView === "summary") {
      const isFullySplit =
        receipt.lineItems.every((item) => (item.splitting?.portions || []).length > 0) &&
        receipt.adjustments.every((adj) =>
          adj.splitting.method === "manual" ? (adj.splitting.portions || []).length > 0 : true
        )
      if (!isFullySplit) {
        toast({
          title: "Some items are not split",
          description: "Please split all items before viewing the summary.",
          variant: "destructive",
        })
        return
      }
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
          <motion.div
            className="flex w-full p-4 pl-0"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ delay: 0.2 }}
          >
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
            {viewMode === "display" && (
              <DisplayView
                receipt={receipt}
                onItemSelect={handleItemSelect}
                onAddPerson={addPerson}
                onRemovePerson={removePerson}
              />
            )}
            {viewMode === "edit" && (
              <EditItemsView
                setHasEditChanges={setHasEditChanges}
                receipt={receipt}
                onSave={handleSave}
              />
            )}
            {viewMode === "split" && selectedItemId && (
              <SplittingView
                receipt={receipt}
                itemId={selectedItemId}
                onUpdateLineItems={updateLineItems}
                onUpdateAdjustments={updateAdjustments}
                onBack={() => handleViewChange("display")}
                onAddPerson={addPerson}
              />
            )}
            {viewMode === "summary" && <SummaryView receipt={receipt} />}
          </motion.div>
        )}
      </AnimatePresence>
      {showNav && (
        <FloatingNav
          currentView={viewMode}
          onViewChange={handleViewChange}
          onBack={() => setIsVisible(false)}
          scrollToBottomButton={hasEditChanges}
        />
      )}
    </div>
  )
}
