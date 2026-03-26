"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useStandalone } from "@/hooks/use-standalone"

type RealtimeStatusBadgeProps = {
  isConnected: boolean
  onRefresh: () => Promise<void>
  loading?: boolean
  className?: string
}

/**
 * Shows a live indicator when Supabase Realtime is connected,
 * or a manual refresh button when disconnected.
 */
export function RealtimeStatusBadge({
  isConnected,
  onRefresh,
  loading,
  className,
}: RealtimeStatusBadgeProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isStandalone = useStandalone()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-10", isStandalone && "bottom-8", className)}>
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="live"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 bg-white border border-dashed border-gray-200 rounded-full shadow-md px-3 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-gray-600 font-mono">Live</span>
          </motion.div>
        ) : (
          <motion.div
            key="refresh"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              className={cn(
                "rounded-full shadow-md bg-white border-gray-200 border-dashed px-4 py-6 gap-2",
                (isRefreshing || loading) && "opacity-70"
              )}
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh receipt data"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-gray-600",
                  (isRefreshing || loading) && "animate-spin"
                )}
              />
              <span className="text-xs font-medium sr-only md:not-sr-only">Refresh</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
