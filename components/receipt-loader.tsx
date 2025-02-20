"use client"

import useStore from "@/hooks/use-store"
import { useSearchParams } from "next/navigation"
import ReceiptContainer from "./receipt-container"
import { Suspense } from "react"

export function ReceiptLoader() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuspensedLoader />
    </Suspense>
  )
}

function SuspensedLoader() {
  const searchParams = useSearchParams()

  const id = searchParams.get("id")

  const [receipt, { isLoading }] = useStore((state) => state.receipts[id ?? ""])

  if (!id) {
    return <div>No id</div>
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!receipt) {
    return <div>Receipt not found</div>
  }

  return <ReceiptContainer id={id} />
}
