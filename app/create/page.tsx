"use client"

import ReceiptImport from "@/components/receipt-upload"
import { useRouter } from "next/navigation"

export default function CreatePage() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <ReceiptImport onDone={(id) => router.push("/view?id=" + id)} />
    </div>
  )
}
