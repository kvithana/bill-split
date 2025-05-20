"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, UserPlus } from "lucide-react"

interface AddPersonDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAddPerson: (name: string) => void
  triggerButton?: React.ReactNode
}

export default function AddPersonDialog({
  open,
  onOpenChange,
  onAddPerson,
  triggerButton,
}: AddPersonDialogProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (name.trim()) {
      onAddPerson(name.trim())
      setName("")
      if (onOpenChange) {
        onOpenChange(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-md font-mono">
      <DialogHeader className="text-center border-b border-dashed border-gray-300 pb-4">
        <DialogTitle className="sr-only">Add a new person</DialogTitle>
        <div className="uppercase text-lg font-bold">SPLIT // IT</div>
        <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
        <div className="mt-4 text-sm">ADD NEW CUSTOMER</div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="flex flex-col space-y-2">
          <label className="text-xs uppercase text-gray-500">Name</label>
          <Input
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="font-mono border-gray-300"
          />
        </div>
        <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange && onOpenChange(false)}
            className="text-gray-500"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            disabled={!name.trim()}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Check className="h-4 w-4 mr-2" />
            ADD PERSON
          </Button>
        </div>
      </form>

      <div className="text-center text-[0.6rem] text-gray-400 mt-4">
        <p>*** CUSTOMER WILL BE ADDED TO BILL ***</p>
      </div>
    </DialogContent>
  )

  // If a trigger button is provided, use it with DialogTrigger
  if (triggerButton) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  // Otherwise, just return the dialog content (for controlled usage)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  )
}
