"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Receipt } from "@/lib/types"
import { X } from "lucide-react"

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

  return (
    <Card className="w-full max-w-lg mx-auto bg-[#fffdf8] font-mono text-sm">
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <h2 className="text-lg font-bold uppercase">{metadata.businessName}</h2>
        <p className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleDateString()}</p>
        <p className="text-sm font-handwriting mt-2">{receipt.billName}</p>
      </CardHeader>
      <CardContent className="p-2 md:p-4 space-y-2">
        <div className="space-y-2">
          {lineItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full flex justify-between items-start whitespace-normal h-auto"
              onClick={() => onItemSelect(item.id)}
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
                <div className="flex -space-x-1 -ml-1">
                  {item.splitting?.portions.map((portion) => {
                    const person = people.find((p) => p.id === portion.personId)
                    return (
                      <Avatar key={person?.id} className="w-6 h-6 border-2 border-white">
                        <AvatarFallback>{person?.name[0]}</AvatarFallback>
                      </Avatar>
                    )
                  })}
                </div>
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
              onClick={() => onItemSelect(adjustment.id)}
            >
              <div className="flex-1 text-left">
                <div className="w-full">
                  <span className="font-bold">{adjustment.name}</span>
                  <div className="flex w-full -space-x-1 -ml-1">
                    {adjustment.splitting.portions?.map((portion) => {
                      const person = people.find((p) => p.id === portion.personId)
                      return (
                        <Avatar key={person?.id} className="w-6 h-6 border-2 border-white">
                          <AvatarFallback>{person?.name[0]}</AvatarFallback>
                        </Avatar>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span>${((adjustment.amountInCents || 0) / 100).toFixed(2)}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
      <div className="border-t border-dashed border-gray-300 p-4 md:px-8">
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
        </div>
      </div>
      <div className="flex items-center space-x-2 md:px-8 px-4 pb-4">
        <Input
          placeholder="Add person"
          className="flex-grow text-xs"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newPersonName.trim()) {
              onAddPerson(newPersonName)
              setNewPersonName("")
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => {
            if (newPersonName.trim()) {
              onAddPerson(newPersonName)
              setNewPersonName("")
            }
          }}
        >
          Add
        </Button>
      </div>
      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">${(metadata.totalInCents / 100).toFixed(2)}</span>
      </CardFooter>
    </Card>
  )
}
