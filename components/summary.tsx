"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Receipt } from "@/lib/types"
import { getColorForPerson } from "@/lib/colors"
import { motion, useMotionValue, useTransform, useDragControls, type PanInfo } from "framer-motion"
import { Trash2 } from "lucide-react"

interface SummaryProps {
  receipt: Receipt
  onDelete: () => void
  onClick: () => void
}

export default function Summary({ receipt, onDelete, onClick }: SummaryProps) {
  const { metadata, billName, createdAt, people } = receipt
  const dragControls = useDragControls()
  const x = useMotionValue(0)
  const background = useTransform(x, [-100, 0], ["rgb(239, 68, 68)", "rgb(255, 255, 248)"])
  const color = useTransform(x, [-100, 0], ["rgb(255, 255, 248)", "rgb(0, 0, 0)"])
  const [isDeleting, setIsDeleting] = useState(false)

  function startDrag(event: React.PointerEvent) {
    dragControls.start(event)
  }

  function handleDelete() {
    setIsDeleting(true)
    onDelete()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 1, height: "auto" }}
      exit={{
        opacity: 0,
        height: 0,
        transition: { duration: 0.2 },
      }}
      className="w-full"
    >
      <Card className="receipt w-full max-w-md mx-auto font-mono text-sm relative">
        <div className="overflow-hidden relative">
          <div className="absolute inset-y-0 right-0 flex items-center justify-end w-full bg-red-500">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-red-600 mr-4"
              onClick={handleDelete}
            >
              <Trash2 className="h-6 w-6" />
              <span className="sr-only">Delete receipt</span>
            </Button>
          </div>

          <motion.div
            style={{ x, background, color }}
            drag="x"
            dragControls={dragControls}
            dragListener={false}
            dragDirectionLock
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.2}
            onTap={onClick}
            className="relative cursor-pointer active:cursor-grabbing touch-pan-x select-none bg-white z-10"
            whileDrag={{ cursor: "grabbing" }}
            initial={false}
          >
            <div onPointerDown={startDrag} className="absolute inset-0 touch-none" />
            <CardHeader className="border-b border-dashed border-gray-300 pb-2">
              <div className="flex justify-between items-center">
                <h2 className="text-sm md:text-lg font-bold uppercase">{metadata.businessName}</h2>
                <span className="text-sm md:text-lg font-bold">
                  ${(metadata.totalInCents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{new Date(createdAt).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-xs font-handwriting mb-2">{billName}</p>
              <div className="flex -space-x-0.5 overflow-hidden">
                {people.map((person, index) => (
                  <Avatar
                    key={person.id}
                    className="inline-block h-5 w-5 md:h-6 md:w-6 rounded-full ring-2 ring-white"
                  >
                    <AvatarFallback
                      className="text-xs text-white"
                      style={{ backgroundColor: getColorForPerson(index) }}
                    >
                      {person.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}
