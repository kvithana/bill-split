"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import type { Person, PersonPortion, Receipt } from "@/lib/types"
import { X, UserPlus, Percent, Equal, Sliders } from "lucide-react"
import { getColorForPerson } from "@/lib/colors"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function DisplayView({
  receipt,
  onItemSelect,
  onRemovePerson,
  onAddPerson,
}: {
  receipt: Receipt
  onItemSelect: (id: string) => void
  onRemovePerson: (id: string) => void
  onAddPerson: (name: string) => void
}) {
  const { metadata, lineItems, adjustments, people } = receipt
  const [newPersonName, setNewPersonName] = useState("")
  const [isAddPersonDialogOpen, setIsAddPersonDialogOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("scrollPosition")
    if (savedScrollPosition && contentRef.current) {
      contentRef.current.scrollTop = Number.parseInt(savedScrollPosition)
    }
  }, [])

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      onAddPerson(newPersonName)
      setNewPersonName("")
      setIsAddPersonDialogOpen(false)
    }
  }

  const getSplittingMethodIcon = (method: string) => {
    switch (method) {
      case "proportional":
        return <Percent className="h-4 w-4" />
      case "equal":
        return <Equal className="h-4 w-4" />
      case "manual":
        return <Sliders className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-[#fffdf8] font-mono text-sm">
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <h2 className="text-lg font-bold uppercase">{metadata.businessName}</h2>
        <p className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleDateString()}</p>
        <p className="text-sm font-handwriting mt-2">{receipt.billName}</p>
      </CardHeader>
      <CardContent className="p-2 md:p-4 space-y-2" ref={contentRef}>
        <div className="space-y-2">
          {lineItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full flex justify-between items-start whitespace-normal h-auto md:px-4 px-3"
              onClick={() => {
                if (contentRef.current) {
                  sessionStorage.setItem("scrollPosition", contentRef.current.scrollTop.toString())
                }
                onItemSelect(item.id)
              }}
            >
              <div className="flex-1 text-left">
                <div className="w-full">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                {!!item.splitting?.portions.length && (
                  <div className="">
                    <span className="text-xs opacity-50">
                      ${((item.totalPriceInCents || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {!!item.splitting?.portions.length ? (
                <AvatarList people={people} portions={item.splitting.portions} />
              ) : (
                <div className="flex items-center space-x-2">
                  <span>${((item.totalPriceInCents || 0) / 100).toFixed(2)}</span>
                </div>
              )}
            </Button>
          ))}
        </div>
        <div className="pt-2 border-t border-dashed border-gray-300">
          {adjustments.map((adjustment) => (
            <Button
              key={adjustment.id}
              variant="ghost"
              className="w-full flex justify-between items-start whitespace-normal h-auto"
              onClick={() => {
                if (contentRef.current) {
                  sessionStorage.setItem("scrollPosition", contentRef.current.scrollTop.toString())
                }
                onItemSelect(adjustment.id)
              }}
            >
              <div className="flex-1 text-left">
                <div className="w-full">
                  <span className="font-bold">{adjustment.name}</span>
                </div>
                {adjustment.splitting.method && (
                  <div className="flex items-center space-x-2 text-xs opacity-50 mt-1">
                    <span>${((adjustment.amountInCents || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {adjustment.splitting.method === "manual" && (
                <AvatarList people={people} portions={adjustment.splitting.portions || []} />
              )}
              {adjustment.splitting.method !== "manual" && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full flex items-center">
                  {getSplittingMethodIcon(adjustment.splitting.method)}
                  <span className="ml-1">{adjustment.splitting.method}</span>
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
      <div className="border-t border-dashed border-gray-300 p-4 px-5 md:px-8">
        <h3 className="font-bold mb-2">People</h3>
        <div className="flex flex-wrap gap-2">
          {receipt.people.map((person) => (
            <Button
              key={person.id}
              variant="ghost"
              className="text-xs bg-gray-100 px-1 py-1 h-auto rounded"
              onClick={() => onRemovePerson(person.id)}
            >
              {person.name} <X className="w-2 h-2" />
            </Button>
          ))}
          <Dialog open={isAddPersonDialogOpen} onOpenChange={setIsAddPersonDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new person</DialogTitle>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddPerson()
                    }
                  }}
                />
                <Button onClick={handleAddPerson}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4 px-6">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">${(metadata.totalInCents / 100).toFixed(2)}</span>
      </CardFooter>
    </Card>
  )
}

function AvatarList({ people, portions }: { people: Person[]; portions: PersonPortion[] }) {
  if (!portions.length) return null

  const MAX_VISIBLE_AVATARS = portions.length === 3 ? 3 : 2
  const visiblePortions = portions.slice(0, MAX_VISIBLE_AVATARS)
  const remainingCount = portions.length > 3 ? portions.length - 2 : 0
  const showRemainingCount = remainingCount > 0

  return (
    <div className="flex -space-x-1 -ml-1">
      {visiblePortions.map((portion, index) => {
        const personIndex = people.findIndex((p) => p.id === portion.personId)
        const person = people.find((p) => p.id === portion.personId)
        if (!person) return null

        return (
          <Avatar key={person.id} className="w-6 h-6 border-2 border-white">
            <AvatarFallback
              className="text-white text-xs"
              style={{ backgroundColor: getColorForPerson(personIndex) }}
            >
              {person.name[0]}
            </AvatarFallback>
          </Avatar>
        )
      })}
      {showRemainingCount && (
        <Avatar className="w-6 h-6 border-2 border-white">
          <AvatarFallback className="text-white bg-black text-xs">+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
