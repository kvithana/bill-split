import { CreateCard } from "@/components/create-card"
import { ReceiptListLoader } from "@/components/receipt-list-loader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-6 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-md mx-auto text-center space-y-4 pt-8">
        <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight">
          Split <span className="opacity-40">//</span> it
        </h1>
        <p className="text-sm text-gray-600 font-mono">Split bills with friends. No fuss.</p>
        <p className="text-xs text-gray-400 font-mono">by Kalana Vithana</p>
      </header>
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
