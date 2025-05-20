"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type RefreshButtonProps = {
  isCloud: boolean
  onRefresh: () => Promise<void>
  className?: string
  loading?: boolean
}

export function RefreshButton({ isCloud, onRefresh, className, loading }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!isCloud) return null

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      // Add a small delay to make the animation visible
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    }
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "fixed bottom-6 right-6 rounded-full shadow-md bg-white border-gray-200 z-10 px-4 py-2 gap-2",
        isRefreshing && "opacity-70",
        loading && "opacity-70",
        className
      )}
      onClick={handleRefresh}
      disabled={isRefreshing}
      aria-label="Refresh receipt data"
    >
      <RefreshCw
        className={cn(
          "h-4 w-4 text-gray-600",
          isRefreshing && "animate-spin",
          loading && "animate-spin"
        )}
      />
      <span className="text-xs font-medium">Refresh</span>
    </Button>
  )
}
