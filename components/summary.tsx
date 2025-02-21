"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Receipt } from "@/lib/types"
import { getColorForPerson } from "@/lib/colors"
import { motion, useMotionValue, useTransform, useDragControls, type PanInfo } from "framer-motion"
import { Trash2 } from "lucide-react"
import { differenceInDays, format, formatDistanceToNow } from "date-fns"

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
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)

  function startDrag(event: React.PointerEvent) {
    setStartX(event.clientX)

    // Start the drag immediately, we'll check direction during drag
    dragControls.start(event)
  }

  function handleDrag(event: Event, info: PanInfo) {
    const currentX = (event as PointerEvent).clientX
    const deltaX = currentX - startX
    const isHorizontal = Math.abs(deltaX) > Math.abs(info.offset.y)

    if (!isDragging && isHorizontal && Math.abs(deltaX) > 5) {
      setIsDragging(true)
    }
  }

  function handleDragEnd(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setIsDragging(false)
    if (info.offset.x < -100) {
      onDelete()
    } else {
      // Explicitly reset position for both directions
      x.set(0)
    }
  }

  function dateDistance(date: string) {
    if (differenceInDays(new Date(), new Date(date)) > 4) {
      return format(new Date(date), "MMM d, yyyy")
    } else {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    }
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
              onClick={onDelete}
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
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onTap={onClick}
            className="relative cursor-pointer select-none bg-white z-10"
            whileDrag={{ cursor: "grabbing" }}
            initial={false}
            transition={{
              type: "spring",
              bounce: 0,
              duration: 0.3,
              stiffness: 500,
            }}
          >
            <div
              onPointerDown={startDrag}
              className="absolute inset-0"
              style={{ touchAction: "pan-y" }}
            />
            <CardHeader className="border-b border-dashed border-gray-300 pb-2">
              <div className="flex justify-between items-center">
                <h2 className="text-sm md:text-lg font-bold uppercase">{metadata.businessName}</h2>
                <span className="text-sm md:text-lg font-bold">
                  ${(metadata.totalInCents / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{dateDistance(createdAt)}</p>
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
