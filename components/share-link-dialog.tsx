import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share2 } from "lucide-react"
import { motion } from "framer-motion"

interface ShareLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptId: string
  shareKey: string
  triggerButton?: React.ReactNode
}

export function ShareLinkDialog({
  open,
  onOpenChange,
  receiptId,
  shareKey,
  triggerButton,
}: ShareLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/split/${receiptId}?key=${shareKey}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && triggerButton}

      <DialogContent className="sm:max-w-md font-mono">
        <DialogHeader className="text-center border-b border-dashed border-gray-300 pb-4">
          <DialogTitle className="sr-only">Share Receipt</DialogTitle>
          <div className="uppercase text-lg font-bold">SPLIT // IT</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          <div className="mt-4 text-sm">RECEIPT SHARED</div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="text-center">
            <div className="font-bold uppercase text-sm">Share With Others</div>
            <p className="text-sm mt-2">Copy this link to allow others to split this receipt</p>
          </div>

          <div className="border border-dashed border-gray-300 rounded-sm p-3 bg-gray-50">
            <p className="font-mono text-xs break-all text-center">{shareUrl}</p>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between">
            <Button
              onClick={handleCopy}
              variant="ghost"
              className="text-gray-500 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>COPY LINK</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={() => onOpenChange(false)}
              className="bg-black text-white hover:bg-gray-800"
            >
              CLOSE
            </Button>
          </div>
        </div>

        <div className="text-center text-[0.6rem] text-gray-400 mt-4">
          <p>*** ANYONE WITH THIS LINK CAN VIEW THIS RECEIPT ***</p>
          <p className="mt-1">RECEIPT ID: {receiptId}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
