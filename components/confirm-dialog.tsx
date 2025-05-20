"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-mono">
        <DialogHeader className="text-center border-b border-dashed border-gray-300 pb-4">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="uppercase text-lg font-bold">SPLIT // IT</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          <div className="mt-4 text-sm">CONFIRMATION REQUIRED</div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-center">
            <AlertTriangle className="text-black h-8 w-8" />
          </div>

          <div className="text-center">
            <div className="font-bold uppercase text-sm">{title}</div>
            <p className="text-sm mt-2">{description}</p>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between">
            <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-500">
              {cancelText}
            </Button>
            <Button onClick={onConfirm} className="bg-black text-white hover:bg-gray-800">
              {confirmText}
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
