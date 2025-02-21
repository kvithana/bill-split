"use client"

import ReceiptImport from "@/components/receipt-upload"
import { StyledErrorBoundary } from "@/components/styled-error-boundary"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreatePage() {
  const router = useRouter()
  return (
    <StyledErrorBoundary>
      <div className="flex flex-col items-center justify-between h-screen w-full">
        <motion.div
          className="flex w-full p-4"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="font-mono text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </motion.div>
        <ReceiptImport onDone={(id) => router.push("/view?id=" + id + "&s=1")} />
        <div />
      </div>
    </StyledErrorBoundary>
  )
}
