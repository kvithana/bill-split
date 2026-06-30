import { Button } from "@/components/ui/button"
import type { Person, ReceiptLineItem } from "@/lib/types"
import { formatCurrency } from "@/lib/calculations"
import { UNALLOCATED_ID } from "@/lib/constants"
import UnallocatedWarning from "./unallocated-warning"
import AvatarList from "./avatar-list"
import { Check, ChevronRight } from "lucide-react"

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
  const allPortions = item.splitting?.portions ?? []
  const realPortions = allPortions.filter((p) => p.personId !== UNALLOCATED_ID)
  const unallocatedEntry = allPortions.find((p) => p.personId === UNALLOCATED_ID)

  const hasRealClaims = realPortions.length > 0
  const allocatedRealPortions = realPortions.reduce((sum, p) => sum + p.portions, 0)
  // Only meaningful when real people are assigned AND genuinely some quantity is still unallocated
  const isPartiallyAllocated =
    hasRealClaims &&
    !!unallocatedEntry &&
    unallocatedEntry.portions > 0 &&
    allocatedRealPortions < item.quantity

  const isClaimedByMe = !!(currentPersonId && realPortions.some((p) => p.personId === currentPersonId))

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
          isClaimedByMe ? "bg-green-50" : isPartiallyAllocated ? "bg-yellow-50" : ""
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
            {hasRealClaims && (
              <span className="text-xs opacity-50">{formatCurrency(item.totalPriceInCents || 0)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {isClaimedByMe && <Check className="h-4 w-4 text-green-600" />}
            {hasRealClaims ? (
              <div className="flex items-center gap-1">
                {isPartiallyAllocated && (
                  <UnallocatedWarning portions={unallocatedEntry!.portions} />
                )}
                <AvatarList people={people} portions={realPortions} quantity={item.quantity} />
              </div>
            ) : (
              <span className="text-sm">{formatCurrency(item.totalPriceInCents || 0)}</span>
            )}
          </div>
        </button>

        {/* Detail button — opens splitting view */}
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
        isPartiallyAllocated ? "bg-yellow-50" : ""
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
        {hasRealClaims && (
          <span className="text-xs opacity-50">{formatCurrency(item.totalPriceInCents || 0)}</span>
        )}
      </div>
      {hasRealClaims ? (
        <div className="flex items-center gap-1">
          {isPartiallyAllocated && (
            <UnallocatedWarning portions={unallocatedEntry!.portions} />
          )}
          <AvatarList people={people} portions={realPortions} quantity={item.quantity} />
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span>{formatCurrency(item.totalPriceInCents || 0)}</span>
        </div>
      )}
    </Button>
  )
}
