"use client"

import useStore from "@/hooks/use-store"
import { useSearchParams } from "next/navigation"
import ReceiptContainer from "./receipt-container"
import { Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { EmptyState } from "./empty-state"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { StyledErrorBoundary } from "./styled-error-boundary"

export function ReceiptLoader() {
  return (
    <Suspense
      fallback={
        <EmptyState
          icon={<Loader2 className="w-12 h-12 text-gray-400 animate-spin" />}
          title="Loading receipt..."
          delay={1}
        />
      }
    >
      <SuspensedLoader />
    </Suspense>
  )
}

function SuspensedLoader() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const fromScan = !!searchParams.get("s")
  const [receipt, { isLoading }] = useStore((state) => state.receipts[id ?? ""])

  if (!id) {
    return (
      <EmptyState
        icon={<Search className="w-12 h-12 text-gray-400" />}
        title="No Receipt ID"
        description="Please provide a receipt ID to view"
        delay={1}
      />
    )
  }

  if (isLoading) {
    return (
      <EmptyState
        icon={<Loader2 className="w-12 h-12 text-gray-400 animate-spin" />}
        title="Loading receipt..."
        delay={1}
      />
    )
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

  return (
    <StyledErrorBoundary>
      <ReceiptContainer id={id} fromScan={fromScan} />
    </StyledErrorBoundary>
  )
}
