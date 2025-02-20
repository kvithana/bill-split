"use client"

import useStore from "@/hooks/use-store"
import { Receipt } from "@/lib/types"
import { sortWith, descend, values } from "ramda"
import { useMemo } from "react"
import Summary from "./summary"

export function ReceiptListLoader() {
  const [receipts, { isLoading }] = useStore((state) => state.receipts)

  const sorted = useMemo(
    () => sortWith<Receipt>([descend((x) => x.createdAt)])(values(receipts || {})),
    [receipts]
  )

  if (isLoading) {
    return <div className="flex flex-col gap-4 w-full items-center justify-center">Loading...</div>
  }

  if (sorted.length === 0) {
    return <div className="flex flex-col gap-4 w-full items-center justify-center">No receipts</div>
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {sorted.map((receipt) => (
        <Summary key={receipt.id} receipt={receipt} />
      ))}
    </div>
  )
}
