import type * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface TutorialTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  step: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onClose: () => void
  title: string
}

export function TutorialTooltip({
  children,
  content,
  open,
  onOpenChange,
  step,
  totalSteps,
  title,
  onNext,
  onPrevious,
  onClose,
}: TutorialTooltipProps) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={5}
            className={cn(
              "z-50 overflow-hidden rounded-md border border-gray-700 bg-black text-white font-mono text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              "w-72 p-4"
            )}
          >
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold text-xs">
                {step}/{totalSteps}: {title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="my-2">{content}</div>
            <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={step === 1}
                className="text-white border-white hover:bg-gray-800 disabled:opacity-50 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {step < totalSteps ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNext}
                  className="text-white border-white hover:bg-gray-800 bg-transparent"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-white border-white hover:bg-gray-800 bg-transparent"
                >
                  Finish
                </Button>
              )}
            </div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
