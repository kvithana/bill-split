"use client"

import ReceiptImport from "@/components/receipt-upload"
import { StyledErrorBoundary } from "@/components/styled-error-boundary"
import { useRouter } from "next/navigation"

export default function CreatePage() {
  const router = useRouter()
  return (
    <StyledErrorBoundary>
      <div className="flex flex-col items-center justify-center h-screen">
        <ReceiptImport onDone={(id) => router.push("/view?id=" + id)} />
      </div>
    </StyledErrorBoundary>
  )
}
