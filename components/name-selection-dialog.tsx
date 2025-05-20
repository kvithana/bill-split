"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Person } from "@/lib/types"
import { Check, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface NameSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (name: string, isExistingPerson: boolean) => void
  existingPeople: Person[]
}

export default function NameSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  existingPeople,
}: NameSelectionDialogProps) {
  const [newName, setNewName] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)

  const handleSubmitNewName = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim()) {
      onSelect(newName.trim(), false)
      setNewName("")
      setIsAddingNew(false)
    }
  }

  const handleSelectExisting = (person: Person) => {
    onSelect(person.name, true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md font-mono">
        <DialogHeader className="text-center border-b border-dashed border-gray-300 pb-4">
          <DialogTitle className="sr-only">Select or add your name</DialogTitle>
          <div className="uppercase text-lg font-bold">SPLIT // IT</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          <div className="mt-4 text-sm">CUSTOMER IDENTIFICATION</div>
        </DialogHeader>

        {isAddingNew ? (
          <form onSubmit={handleSubmitNewName} className="space-y-4 mt-4">
            <div className="flex flex-col space-y-2">
              <label className="text-xs uppercase text-gray-500">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="font-mono border-gray-300"
              />
            </div>
            <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddingNew(false)}
                className="text-gray-500"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={!newName.trim()}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Check className="h-4 w-4 mr-2" />
                CONFIRM
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            {existingPeople.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-gray-500">Select your name:</div>
                <div className="space-y-1 border-b border-dashed border-gray-300 pb-4">
                  {existingPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleSelectExisting(person)}
                      className="w-full flex items-center justify-between py-2 px-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{person.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">TAP TO SELECT</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={cn("pt-2", existingPeople.length === 0 && "text-center")}>
              {existingPeople.length === 0 && (
                <div className="text-gray-500 mb-4 text-sm">No other people on this bill yet.</div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-gray-300 py-6 hover:bg-gray-50"
                onClick={() => setIsAddingNew(true)}
              >
                <div className="flex flex-col items-center">
                  <div className="text-sm mb-1">ADD MYSELF TO THIS BILL</div>
                  <div className="text-xs text-gray-500">* New Customer *</div>
                </div>
              </Button>
            </div>

            <div className="text-center text-[0.6rem] text-gray-400 mt-4">
              <p>*** THANK YOU FOR USING SPLIT // IT ***</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
