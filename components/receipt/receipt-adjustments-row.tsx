import { Button } from "@/components/ui/button"
import type { Person, PersonPortion, ReceiptAdjustment } from "@/lib/types"
import { formatCurrency } from "@/lib/calculations"
import { UNALLOCATED_ID } from "@/lib/constants"
import { Percent, Equal, Sliders } from "lucide-react"
import PersonDots from "./person-dots"
import UnallocatedWarning from "./unallocated-warning"
import AvatarList from "./avatar-list"
import { Badge } from "../ui/badge"

// Component for displaying adjustment items in the receipt
export default function ReceiptAdjustmentRow({
  adjustment,
  people,
  onItemSelect,
  contentRef,
}: {
  adjustment: ReceiptAdjustment
  people: Person[]
  onItemSelect: (id: string) => void
  contentRef: React.RefObject<HTMLDivElement | null>
}) {
  // Helper functions to check if an item has unallocated portions
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

  // Helper function to get splitting method icon
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
          sessionStorage.setItem("scrollPosition", contentRef.current.scrollTop.toString())
        }
        onItemSelect(adjustment.id)
      }}
    >
      <div className="flex-1 text-left">
        <div className="w-full flex items-center">
          <span className="font-bold">{adjustment.name}</span>
        </div>
        {adjustment.splitting.method && (
          <div className="flex items-center space-x-2 text-xs opacity-50 mt-1">
            <span>{formatCurrency(adjustment.amountInCents || 0)}</span>
          </div>
        )}
      </div>

      {adjustment.splitting.method === "manual" && (
        <div className="flex items-center">
          {hasUnallocated && <UnallocatedWarning portions={unallocatedPortion?.portions || 0} />}
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
}
