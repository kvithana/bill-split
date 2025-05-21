"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import type { Person, PersonPortion, Receipt } from "@/lib/types"
import {
  X,
  UserPlus,
  Percent,
  Equal,
  Sliders,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Cross,
  AlertCircle,
} from "lucide-react"
import { getColorForPerson } from "@/lib/colors"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { calculateReceiptTotal, formatCurrency } from "@/lib/calculations"
import { generateId } from "@/lib/id"
import AddPersonDialog from "./add-person-dialog"
import ConfirmDialog from "./confirm-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { ShareReceiptButton } from "./share-receipt-button"
import { UNALLOCATED_ID } from "@/lib/constants"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

export default function DisplayView({
  receipt,
  onItemSelect,
  onRemovePerson,
  onAddPerson,
  isOwner = true,
  onMakeCollaborative,
}: {
  receipt: Receipt
  onItemSelect: (id: string) => void
  onRemovePerson: (id: string) => void
  onAddPerson: (person: Person) => Promise<void>
  isOwner?: boolean
  onMakeCollaborative?: () => Promise<{ receiptId: string; shareKey: string } | null>
}) {
  const { metadata, lineItems, adjustments, people } = receipt
  const contentRef = useRef<HTMLDivElement>(null)
  const [isAddPersonDialogOpen, setIsAddPersonDialogOpen] = useState(false)
  const [isCustomerSectionExpanded, setIsCustomerSectionExpanded] = useState(false)

  // Add state for confirm dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [personToRemove, setPersonToRemove] = useState<Person | null>(null)

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("scrollPosition")
    if (savedScrollPosition && contentRef.current) {
      contentRef.current.scrollTop = Number.parseInt(savedScrollPosition)
    }
  }, [])

  const handleAddPerson = (name: string) => {
    if (name.trim()) {
      const person: Person = {
        id: generateId(),
        name: name.trim(),
      }

      onAddPerson(person)
    }
  }

  // Updated remove person handler
  const handleRemovePersonClick = (person: Person) => {
    setPersonToRemove(person)
    setIsConfirmDialogOpen(true)
  }

  // New method to confirm removal
  const confirmRemovePerson = () => {
    if (personToRemove) {
      onRemovePerson(personToRemove.id)
      setPersonToRemove(null)
      setIsConfirmDialogOpen(false)
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

  // Helper function to check if an item has unallocated portions
  const hasUnallocatedPortions = (portions: PersonPortion[] = []) => {
    return portions.some((p) => p.personId === UNALLOCATED_ID)
  }

  // Helper function to check if an item is completely unallocated (no portions assigned)
  const isCompletelyUnallocated = (portions: PersonPortion[] = []) => {
    return !portions || portions.length === 0
  }

  // Helper function to get remaining unallocated amount
  const getUnallocatedPortion = (portions: PersonPortion[] = []) => {
    return portions.find((p) => p.personId === UNALLOCATED_ID)
  }

  return (
    <Card className={"receipt w-full max-w-lg mx-auto font-mono text-sm"}>
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <div className="flex items-center justify-center relative">
          <h2 className="text-lg font-bold uppercase">{metadata.businessName}</h2>

          {/* Share button or indicator */}
          <ShareReceiptButton
            receipt={receipt}
            isOwner={isOwner}
            onMakeCollaborative={onMakeCollaborative}
          />
        </div>
        <p className="text-xs text-gray-500">
          {new Date(receipt.metadata.dateAsISOString ?? receipt.createdAt).toLocaleDateString()}
        </p>
        <p className="text-sm font-handwriting mt-2">{receipt.billName}</p>
        {receipt.imageUrl && (
          <p>
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-2 border-b border-dotted border-gray-400 hover:border-gray-600 text-xs uppercase text-gray-500">
                  original receipt
                </button>
              </DialogTrigger>
              <DialogContent className="border-none p-2">
                <DialogTitle className="flex items-center justify-center font-mono font-normal text-xs mt-2">
                  Uploaded on {format(new Date(receipt.createdAt), "MMM d, yyyy HH:mm a")}
                </DialogTitle>{" "}
                <div className="relative w-full h-[80dvh] flex items-center justify-center">
                  <img
                    src={receipt.imageUrl}
                    alt="Receipt"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </p>
        )}
      </CardHeader>

      {/* Customer section moved to the top, after header */}
      <div className="border-b border-dashed border-gray-300">
        <Button
          variant="ghost"
          onClick={() => setIsCustomerSectionExpanded(!isCustomerSectionExpanded)}
          className="w-full py-2 px-1 md:px-4 flex items-center justify-between hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
        >
          <div className="flex items-center gap-1.5 px-4">
            <Users className="h-4 w-4" />
            <span className="text-sm font-bold uppercase">Customers ({receipt.people.length})</span>
          </div>

          {/* Minimized preview of avatars when collapsed */}
          {!isCustomerSectionExpanded && receipt.people.length > 0 && (
            <div className="flex items-center px-4">
              <div className="flex -space-x-2 mr-2">
                {receipt.people.slice(0, 3).map((person, index) => (
                  <Avatar key={person.id} className="w-5 h-5 border border-white">
                    <AvatarFallback
                      className="text-white text-[10px]"
                      style={{ backgroundColor: getColorForPerson(index) }}
                    >
                      {person.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {receipt.people.length > 3 && (
                  <div className="z-10 w-5 h-5 rounded-full bg-gray-200 text-[10px] flex items-center justify-center border border-white text-gray-600">
                    +{receipt.people.length - 3}
                  </div>
                )}
              </div>
              <motion.div initial={{ rotate: 0 }} animate={{ rotate: 0 }} className="h-4 w-4">
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          )}

          {/* Just show the chevron when expanded */}
          {(isCustomerSectionExpanded || receipt.people.length === 0) && (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="h-4 w-4 mr-4"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          )}
        </Button>

        {/* Expandable content with animation */}
        <AnimatePresence>
          {isCustomerSectionExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-3 px-4 md:px-6 border-t border-dotted border-gray-200">
                {receipt.people.length === 0 ? (
                  <div className="text-center py-2 text-gray-500 text-sm italic">
                    No customers added yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-1 pt-1">
                    {receipt.people.map((person, index) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex justify-between items-center py-1.5 px-2 text-sm border-b border-dotted border-gray-100"
                      >
                        <div className="flex items-center">
                          <Avatar className="w-5 h-5 mr-2">
                            <AvatarFallback
                              className="text-white text-[10px]"
                              style={{ backgroundColor: getColorForPerson(index) }}
                            >
                              {person.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{person.name}</span>
                        </div>

                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent"
                            onClick={() => handleRemovePersonClick(person)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-center mt-3"
                >
                  <AddPersonDialog
                    open={isAddPersonDialogOpen}
                    onOpenChange={setIsAddPersonDialogOpen}
                    onAddPerson={handleAddPerson}
                    triggerButton={
                      <Button
                        variant="ghost"
                        className="text-xs border border-dashed border-gray-200 py-1.5 px-3 rounded-sm hover:bg-gray-50"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        ADD CUSTOMER
                      </Button>
                    }
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CardContent className="p-2 md:p-4 space-y-2" ref={contentRef}>
        <div className="space-y-2">
          {lineItems.map((item) => {
            const hasUnallocated = hasUnallocatedPortions(item.splitting?.portions)
            const fullyUnallocated = isCompletelyUnallocated(item.splitting?.portions)
            const unallocatedPortion = getUnallocatedPortion(item.splitting?.portions)

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full flex justify-between items-start whitespace-normal h-auto md:px-4 px-3 hover:none md:hover:bg-accent md:hover:text-accent-foreground ${
                  hasUnallocated ? "bg-yellow-50" : ""
                }`}
                onClick={() => {
                  if (contentRef.current) {
                    sessionStorage.setItem(
                      "scrollPosition",
                      contentRef.current.scrollTop.toString()
                    )
                  }
                  onItemSelect(item.id)
                }}
              >
                <div className="flex-1 text-left">
                  <div className="w-full flex items-center">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>

                    {/* Only show indicator for partially unallocated items */}
                    {hasUnallocated && (
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <span className="ml-2">
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs p-2">
                            {unallocatedPortion?.portions || 0} unallocated{" "}
                            {unallocatedPortion?.portions === 1 ? "portion" : "portions"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {!!item.splitting?.portions.length && (
                    <div className="">
                      <span className="text-xs opacity-50">
                        {formatCurrency(item.totalPriceInCents || 0)}
                      </span>
                    </div>
                  )}
                </div>
                {!!item.splitting?.portions.length ? (
                  <div className="flex items-center">
                    {hasUnallocated && (
                      <Badge
                        variant="outline"
                        className="mr-1 h-5 px-1 text-xs bg-yellow-100 border-yellow-200 text-yellow-800"
                      >
                        {unallocatedPortion?.portions || 0}
                      </Badge>
                    )}
                    <AvatarList
                      people={people}
                      portions={item.splitting.portions.filter(
                        (p) => p.personId !== UNALLOCATED_ID
                      )}
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{formatCurrency(item.totalPriceInCents || 0)}</span>
                  </div>
                )}
              </Button>
            )
          })}
        </div>
        {!!adjustments.length && (
          <div className="pt-2 border-t border-dashed border-gray-300">
            {adjustments.map((adjustment) => {
              const hasUnallocated =
                adjustment.splitting.method === "manual" &&
                hasUnallocatedPortions(adjustment.splitting.portions)
              const fullyUnallocated =
                adjustment.splitting.method === "manual" &&
                isCompletelyUnallocated(adjustment.splitting.portions)
              const unallocatedPortion = getUnallocatedPortion(adjustment.splitting.portions || [])

              return (
                <Button
                  key={adjustment.id}
                  variant="ghost"
                  className={`w-full flex justify-between items-start whitespace-normal h-auto hover:none md:hover:bg-accent md:hover:text-accent-foreground ${
                    hasUnallocated ? "bg-yellow-50" : ""
                  }`}
                  onClick={() => {
                    if (contentRef.current) {
                      sessionStorage.setItem(
                        "scrollPosition",
                        contentRef.current.scrollTop.toString()
                      )
                    }
                    onItemSelect(adjustment.id)
                  }}
                >
                  <div className="flex-1 text-left">
                    <div className="w-full flex items-center">
                      <span className="font-bold">{adjustment.name}</span>

                      {/* Only show indicator for partially unallocated adjustments */}
                      {hasUnallocated && (
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <span className="ml-2">
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs p-2">
                              {unallocatedPortion?.portions || 0} unallocated{" "}
                              {unallocatedPortion?.portions === 1 ? "portion" : "portions"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {adjustment.splitting.method && (
                      <div className="flex items-center space-x-2 text-xs opacity-50 mt-1">
                        <span>{formatCurrency(adjustment.amountInCents || 0)}</span>
                      </div>
                    )}
                  </div>

                  {adjustment.splitting.method === "manual" && (
                    <div className="flex items-center">
                      {hasUnallocated && (
                        <Badge
                          variant="outline"
                          className="mr-1 h-5 px-1 text-xs bg-yellow-100 border-yellow-200 text-yellow-800"
                        >
                          {unallocatedPortion?.portions || 0}
                        </Badge>
                      )}
                      {!fullyUnallocated && (
                        <AvatarList
                          people={people}
                          portions={(adjustment.splitting.portions || []).filter(
                            (p) => p.personId !== UNALLOCATED_ID
                          )}
                        />
                      )}
                    </div>
                  )}
                  {adjustment.splitting.method !== "manual" && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full flex items-center">
                      {getSplittingMethodIcon(adjustment.splitting.method)}
                      <span className="ml-1">{adjustment.splitting.method}</span>
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4 px-6">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">{formatCurrency(calculateReceiptTotal(receipt))}</span>
      </CardFooter>

      {/* Add confirmation dialog */}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={confirmRemovePerson}
        onCancel={() => {
          setPersonToRemove(null)
          setIsConfirmDialogOpen(false)
        }}
        title="Remove Customer"
        description={`Are you sure you want to remove ${personToRemove?.name || ""} from this bill? Any items assigned to them will become unallocated.`}
        confirmText="REMOVE"
        cancelText="CANCEL"
      />
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
