import { EmptyState } from "@/components/empty-state"
import { FileQuestion } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Uh oh",
  description: "The page you're looking for doesn't exist or has been moved.",
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <EmptyState
          icon={<FileQuestion className="w-12 h-12 text-gray-400" />}
          title="Uh oh"
          description="The path you're looking for doesn't exist or has been moved."
          delay={0.2}
        />
      </div>
    </div>
  )
}
