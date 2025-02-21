import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { Plus } from "lucide-react"

export function CreateCard({ onCreate }: { onCreate: () => void }) {
  return (
    <Link
      href="/create"
      onClick={(e) => {
        e.preventDefault()
        onCreate()
      }}
    >
      <Card className={"receipt w-full max-w-md mx-auto font-mono text-sm group"}>
        <CardHeader className="border-b border-dashed border-gray-300 pb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-sm md:text-lg font-bold uppercase text-gray-600">New Receipt</h2>
            <Plus className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs text-gray-500">Import a new receipt to start splitting</p>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-xs font-handwriting mb-2">
            Upload a photo of your receipt to automatically extract line items and totals.
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
