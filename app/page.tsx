import { CreateCard } from "@/components/create-card"
import { ReceiptListLoader } from "@/components/receipt-list-loader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-6 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 w-full">
          <CreateCard />
          <ReceiptListLoader />
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  )
}
