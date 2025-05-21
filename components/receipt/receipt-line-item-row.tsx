import { Button } from "@/components/ui/button"
import type { Person, PersonPortion, ReceiptLineItem } from "@/lib/types"
import { formatCurrency } from "@/lib/calculations"
import { UNALLOCATED_ID } from "@/lib/constants"
import PersonDots from "./person-dots"
import UnallocatedWarning from "./unallocated-warning"
import { Badge } from "../ui/badge"
import AvatarList from "./avatar-list"

// Component for displaying a line item in the receipt
export default function ReceiptLineItemRow({
  item,
  people,
  onItemSelect,
  contentRef,
}: {
  item: ReceiptLineItem
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

  const hasUnallocated = hasUnallocatedPortions(item.splitting?.portions)
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
          sessionStorage.setItem("scrollPosition", contentRef.current.scrollTop.toString())
        }
        onItemSelect(item.id)
      }}
    >
      <div className="flex-1 text-left">
        <div className="w-full flex items-center">
          <span className="font-bold">{item.name}</span>
          <span className="text-gray-500 ml-2">x{item.quantity}</span>
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
