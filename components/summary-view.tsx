"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Receipt, Person } from "@/lib/types"
import { getColorForPerson } from "@/lib/colors"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  calculateAdjustmentAmount,
  calculatePersonTotal,
  calculateReceiptTotal,
  formatCurrency,
  getPersonPortion,
  calculatePortionAmount,
} from "@/lib/calculations"

type Props = {
  receipt: Receipt
}

type ItemSummary = {
  name: string
  amount: number
}

export default function SummaryView({ receipt }: Props) {
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)

  const getPersonItems = (personId: string): ItemSummary[] => {
    const lineItems = receipt.lineItems
      .map((item) => {
        const personPortion = getPersonPortion(personId)(item.splitting?.portions || [])
        if (!personPortion) return null

        const totalPortions = item.splitting?.portions.reduce((sum, p) => sum + p.portions, 0) || 0
        const amount = calculatePortionAmount(
          item.totalPriceInCents,
          personPortion.portions,
          totalPortions
        )
        return { name: item.name, amount }
      })
      .filter((item): item is ItemSummary => item !== null)

    const adjustmentItems = receipt.adjustments
      .map((adjustment) => {
        const amount = calculateAdjustmentAmount(receipt, adjustment, personId)
        return amount !== 0 ? { name: adjustment.name, amount } : null
      })
      .filter((item): item is ItemSummary => item !== null)

    return [...lineItems, ...adjustmentItems]
  }

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <h2 className="text-lg font-bold uppercase">{receipt.metadata.businessName}</h2>
        <p className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleDateString()}</p>
        <p className="text-sm font-handwriting mt-2">{receipt.billName}</p>
      </CardHeader>
      <CardContent className="p-2 space-y-4">
        {receipt.people.map((person: Person, index) => (
          <div key={person.id} className="border-b border-dashed border-gray-300 pb-2">
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center"
              onClick={() => setExpandedPerson(expandedPerson === person.id ? null : person.id)}
            >
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback
                    className="text-white"
                    style={{ backgroundColor: getColorForPerson(index) }}
                  >
                    {person.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span>{person.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{formatCurrency(calculatePersonTotal(receipt, person.id))}</span>
                {expandedPerson === person.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </Button>
            {expandedPerson === person.id && (
              <div className="mt-2 space-y-1 px-4">
                {getPersonItems(person.id).map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-dashed border-gray-300 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(calculatePersonTotal(receipt, person.id))}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-between font-bold text-lg px-4 p-4">
          <span>Total</span>
          <span>{formatCurrency(calculateReceiptTotal(receipt))}</span>
        </div>
      </CardContent>
    </Card>
  )
}
