"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Receipt, Person } from "@/lib/types"
import { getColorForPerson } from "@/lib/colors"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertTriangle, ChevronDown, ChevronUp, InfoIcon, Share2, CloudIcon } from "lucide-react"
import {
  calculateAdjustmentAmount,
  calculatePersonTotal,
  calculateReceiptTotal,
  formatCurrency,
  getPersonPortion,
  calculatePortionAmount,
} from "@/lib/calculations"
import { motion } from "framer-motion"
import { ShareReceiptButton } from "./share-receipt-button"

type Props = {
  receipt: Receipt
  highlightPersonId?: string
  shareUrl?: string
  isOwner?: boolean
  onMakeCollaborative?: () => Promise<{ receiptId: string; shareKey: string } | null>
}

type ItemSummary = {
  name: string
  amount: number
}

export default function SummaryView({
  receipt,
  highlightPersonId,
  shareUrl,
  isOwner = false,
  onMakeCollaborative,
}: Props) {
  const [expandedPerson, setExpandedPerson] = useState<string | null>(highlightPersonId || null)

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

  const unaccountedItems = [
    ...receipt.lineItems.filter(
      (item) => !item.splitting?.portions.some((p) => p.personId === highlightPersonId)
    ),
    ...receipt.adjustments.filter(
      (adjustment) =>
        adjustment.splitting.method === "manual" && adjustment.splitting.portions?.length === 0
    ),
  ]

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <div className="flex items-center justify-center relative">
          <h2 className="text-lg font-bold uppercase">{receipt.metadata.businessName}</h2>

          {/* Share button or indicator */}
          <ShareReceiptButton
            receipt={receipt}
            isOwner={isOwner}
            onMakeCollaborative={onMakeCollaborative}
          />
        </div>
        <p className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleDateString()}</p>
        <p className="text-sm font-handwriting mt-2">{receipt.billName}</p>
      </CardHeader>
      <CardContent className="p-2 space-y-4">
        {receipt.people.map((person: Person, index) => (
          <div key={person.id} className={`border-b border-dashed border-gray-300 pb-2`}>
            <Button
              variant="ghost"
              className={`w-full flex justify-between items-center ${
                highlightPersonId === person.id ? "font-bold" : ""
              }`}
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

        {unaccountedItems.length > 0 && (
          <div className="mt-2 -mb-4 bg-black text-white p-4 rounded-sm">
            <h3 className="text-md font-bold mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Unallocated Items
            </h3>
            <div className="space-y-1">
              {unaccountedItems.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{item.name}</span>
                  <span>
                    {formatCurrency(
                      "totalPriceInCents" in item ? item.totalPriceInCents : item.amountInCents
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-700 mt-2">
              <span>Unallocated Total</span>
              <span>
                {formatCurrency(
                  unaccountedItems.reduce(
                    (sum, item) =>
                      sum +
                      ("totalPriceInCents" in item ? item.totalPriceInCents : item.amountInCents),
                    0
                  )
                )}
              </span>
            </div>
          </div>
        )}
        {unaccountedItems.length > 0 && (
          <div className="border-b border-dashed border-gray-300 pb-2" />
        )}
        <div className="flex justify-between font-bold text-lg px-4 p-4">
          <span>Total</span>
          <span>{formatCurrency(calculateReceiptTotal(receipt))}</span>
        </div>

        {shareUrl && (
          <div className="mt-6 pt-2 text-center">
            <div className="border-t border-b border-dashed border-gray-300 py-3">
              <p className="text-xs uppercase font-bold mb-1">Share This Receipt</p>
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  className="text-xs px-6 py-2 border border-gray-300 border-dashed hover:bg-gray-50"
                  onClick={(e) => {
                    const button = e.currentTarget
                    const originalText = button.innerText
                    navigator.clipboard.writeText(shareUrl)
                    button.innerText = "✓ COPIED"
                    button.disabled = true
                    setTimeout(() => {
                      button.innerText = originalText
                      button.disabled = false
                    }, 2000)
                  }}
                >
                  [ PRESS HERE TO COPY LINK ]
                </Button>
              </div>
            </div>
            <div className="mt-3 text-[0.6rem] text-gray-500">
              <p>*** THANK YOU FOR USING SPLIT // IT ***</p>
              <p className="mt-1">
                RECEIPT ID: {shareUrl.split("/").pop()?.slice(0, 8) || "XXXXXXXX"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
