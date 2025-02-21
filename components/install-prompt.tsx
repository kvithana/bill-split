"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Share, Plus, Download } from "lucide-react"

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream: unknown }).MSStream
    )
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)
  }, [])

  if (isStandalone) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
        <Download className="w-4 h-4" />
        <span>Install app</span>
      </div>

      {isIOS ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Tap</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
            <Share className="w-3 h-3" />
            <span>Share</span>
          </div>
          <span>then</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200">
            <Plus className="w-3 h-3" />
            <span>Add to Home</span>
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
