import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CloudIcon, Share2, UsersIcon, RefreshCwIcon } from "lucide-react"
import { motion } from "framer-motion"

interface ShareReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShare: () => Promise<void>
  isSharing: boolean
  triggerButton?: React.ReactNode
}

export function ShareReceiptDialog({
  open,
  onOpenChange,
  onShare,
  isSharing,
  triggerButton,
}: ShareReceiptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}

      <DialogContent className="sm:max-w-md font-mono">
        <DialogHeader className="text-center border-b border-dashed border-gray-300 pb-4">
          <DialogTitle className="sr-only">Make Receipt Collaborative</DialogTitle>
          <div className="uppercase text-lg font-bold">SPLIT // IT</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          <div className="mt-4 text-sm">MAKE COLLABORATIVE</div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="py-2 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <Share2 className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-xs">Share with others</p>
                <p className="text-xs text-gray-600">
                  Generate a unique link that you can send to other customers to access this receipt
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <UsersIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-xs">Collaborative editing</p>
                <p className="text-xs text-gray-600">
                  Others can view the receipt and select which items they're responsible for
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <RefreshCwIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-xs">Real-time updates</p>
                <p className="text-xs text-gray-600">
                  Changes made by others will be available when you refresh or resync the receipt
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-500"
            >
              CANCEL
            </Button>
            <Button
              variant="default"
              onClick={onShare}
              disabled={isSharing}
              className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
            >
              {isSharing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5" />
                  </motion.div>
                  PROCESSING...
                </>
              ) : (
                <>
                  <CloudIcon className="h-3.5 w-3.5" />
                  CONFIRM
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center text-[0.6rem] text-gray-400 mt-4">
          <p>*** THIS ACTION CANNOT BE UNDONE ***</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
