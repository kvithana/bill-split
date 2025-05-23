"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Share, Plus, Download, X } from "lucide-react"
import { useStandalone } from "../hooks/use-standalone"

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const isStandalone = useStandalone()
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden until we check localStorage

  useEffect(() => {
    // Check localStorage first
    const dismissed = localStorage.getItem("installPromptDismissed")
    setIsDismissed(!!dismissed)

    // Improved iOS detection
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream

    setIsIOS(iOS)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("installPromptDismissed", "true")
    setIsDismissed(true)
  }

  // Only show when not standalone and not dismissed
  if (isStandalone || isDismissed) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="relative flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50 backdrop-blur-sm"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 text-sm font-mono text-gray-600 mt-1">
        <Download className="w-4 h-4" />
        <span>Install app</span>
      </div>

      <p className="text-xs text-gray-500">Store receipts locally & access them offline</p>

      {isIOS ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Tap</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
            <Share className="w-3 h-3" />
          </div>
          <span>then</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
            <Plus className="w-3 h-3" />
            <span className="whitespace-nowrap">Add to Home Screen</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Click</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
            <Download className="w-3 h-3" />
            <span>Install</span>
          </div>
          <span>in browser menu</span>
        </div>
      )}
    </motion.div>
  )
}
