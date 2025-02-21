"use client"

import useStore from "@/hooks/use-store"

import { Receipt } from "@/lib/types"
import { sortWith, descend, values } from "ramda"
import { useMemo } from "react"
import Summary from "./summary"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useReceiptStore } from "@/data/state"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function ReceiptListLoader({ onReceiptClick }: { onReceiptClick: (id: string) => void }) {
  const [receipts, { isLoading }] = useStore((state) => state.receipts)
  const deleteReceipt = useReceiptStore((state) => state.removeReceipt)

  const sorted = useMemo(
    () => sortWith<Receipt>([descend((x) => x.createdAt)])(values(receipts || {})),
    [receipts]
  )

  if (isLoading) {
    return null
  }

  if (sorted.length === 0) {
    return null
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 w-full"
    >
      <AnimatePresence mode="popLayout">
        {sorted.map((receipt) => (
          <Summary
            key={receipt.id}
            receipt={receipt}
            onDelete={() => deleteReceipt(receipt)}
            onClick={() => onReceiptClick(receipt.id!)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
