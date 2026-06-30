import { Button } from "@/components/ui/button"
import type { Person, PersonPortion, ReceiptLineItem } from "@/lib/types"
import { formatCurrency } from "@/lib/calculations"
import { UNALLOCATED_ID } from "@/lib/constants"
import PersonDots from "./person-dots"
import UnallocatedWarning from "./unallocated-warning"
import { Badge } from "../ui/badge"
import AvatarList from "./avatar-list"
import { Check, ChevronRight } from "lucide-react"

// Component for displaying a line item in the receipt
export default function ReceiptLineItemRow({
  item,
  people,
  onItemSelect,
  contentRef,
  onQuickClaim,
  onQuickView,
  currentPersonId,
}: {
  item: ReceiptLineItem
  people: Person[]
  onItemSelect: (id: string) => void
  contentRef: React.RefObject<HTMLDivElement | null>
  onQuickClaim?: (id: string) => void
  onQuickView?: (id: string) => void
  currentPersonId?: string
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

  const hasUnallocated = hasUnallocatedPortions(item.splitting?.portions)
  const unallocatedPortion = getUnallocatedPortion(item.splitting?.portions)
  const isClaimedByMe = !!(
    currentPersonId && item.splitting?.portions?.some((p) => p.personId === currentPersonId)
  )

  const saveScrollPosition = () => {
    if (contentRef.current) {
      sessionStorage.setItem("scrollPosition", contentRef.current.scrollTop.toString())
    }
  }

  // Visitor quick-claim mode: two-zone row
  if (onQuickClaim && currentPersonId) {
    return (
      <div
        className={`w-full flex items-stretch rounded-sm transition-colors ${
          isClaimedByMe ? "bg-green-50" : hasUnallocated ? "bg-yellow-50" : ""
        }`}
      >
        {/* Main tap area — quick claim / unclaim */}
        <button
          className="flex-1 flex justify-between items-start text-left px-3 py-2 hover:bg-black/5 transition-colors"
          onClick={() => onQuickClaim(item.id)}
        >
          <div className="flex-1">
            <div className="w-full text-wrap font-bold">
              <span className="text-gray-500 mr-1 text-xs font-normal">{item.quantity}x</span>
              {item.name}
            </div>
            {!!item.splitting?.portions.length && (
              <span className="text-xs opacity-50">
                {formatCurrency(item.totalPriceInCents || 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {isClaimedByMe && <Check className="h-4 w-4 text-green-600" />}
            {!!item.splitting?.portions.length ? (
              <div className="flex items-center">
                {hasUnallocated && (
                  <UnallocatedWarning portions={unallocatedPortion?.portions || 0} />
                )}
                <AvatarList
                  people={people}
                  portions={item.splitting.portions.filter((p) => p.personId !== UNALLOCATED_ID)}
                  quantity={item.quantity}
                />
              </div>
            ) : (
              <span className="text-sm">{formatCurrency(item.totalPriceInCents || 0)}</span>
            )}
          </div>
        </button>

        {/* Detail button — opens quick view */}
        <button
          className="px-3 flex items-center border-l border-gray-100 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          onClick={() => {
            saveScrollPosition()
            onQuickView ? onQuickView(item.id) : onItemSelect(item.id)
          }}
          aria-label="View item details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Owner mode: full-row tap opens splitting view
  return (
    <Button
      key={item.id}
      variant="ghost"
      className={`w-full flex justify-between items-start whitespace-normal h-auto md:px-4 px-3 hover:none md:hover:bg-accent md:hover:text-accent-foreground ${
        hasUnallocated ? "bg-yellow-50" : ""
      }`}
      onClick={() => {
        saveScrollPosition()
        onItemSelect(item.id)
      }}
    >
      <div className="flex-1 text-left">
        <div className="w-full text-wrap font-bold">
          <span className="text-gray-500 mr-1 mb-1 text-xs font-normal">{item.quantity}x</span>
          {item.name}
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
          {hasUnallocated && <UnallocatedWarning portions={unallocatedPortion?.portions || 0} />}
          <AvatarList
            people={people}
            portions={item.splitting.portions.filter((p) => p.personId !== UNALLOCATED_ID)}
          />
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span>{formatCurrency(item.totalPriceInCents || 0)}</span>
        </div>
      )}
    </Button>
  )
}
