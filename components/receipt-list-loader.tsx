"use client"

import useStore from "@/hooks/use-store"
import { ReceiptList } from "./receipt-list"
import { Receipt } from "@/lib/types"
import { sortWith, descend, values } from "ramda"
import { useMemo } from "react"

export function ReceiptListLoader() {
  const receipts = useStore((state) => state.receipts)

  const sorted = useMemo(
    () => sortWith<Receipt>([descend((x) => x.createdAt)])(values(receipts || {})),
    [receipts]
  )

  return <ReceiptList receipts={sorted} />
}
