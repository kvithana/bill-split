import { AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Component to show unallocated portions warning
export default function UnallocatedWarning({ portions }: { portions: number }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center mr-2 bg-yellow-100 rounded-full py-0.5 px-2">
            <AlertCircle className="h-3 w-3 text-yellow-600 mr-1" />
            <span className="text-xs text-yellow-800">{portions}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2">
          {portions} unallocated {portions === 1 ? "portion" : "portions"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
