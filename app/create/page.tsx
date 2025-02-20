"use client"

import ReceiptImport from "@/components/receipt-upload"

export default function CreatePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <ReceiptImport onDone={() => {}} />
    </div>
  )
}
