import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Person, PersonPortion } from "@/lib/types"
import { getColorForPerson } from "@/lib/colors"

// Component for displaying color dots representing people assigned to an item
export default function PersonDots({
  people,
  portions,
}: {
  people: Person[]
  portions: PersonPortion[]
}) {
  if (!portions.length) return null

  const uniquePersonIds = [...new Set(portions.map((p: PersonPortion) => p.personId))]
  const MAX_VISIBLE = 4
  const visiblePersonIds = uniquePersonIds.slice(0, MAX_VISIBLE)
  const remainingCount =
    uniquePersonIds.length > MAX_VISIBLE ? uniquePersonIds.length - MAX_VISIBLE : 0

  return (
    <div className="flex items-center space-x-1">
      {visiblePersonIds.map((personId) => {
        const personIndex = people.findIndex((p) => p.id === personId)
        const person = people.find((p) => p.id === personId)
        if (!person) return null

        return (
          <TooltipProvider key={personId}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: getColorForPerson(personIndex) }}
                ></div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs p-2">
                {person.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}

      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center bg-gray-200 rounded-full px-1.5 py-0.5">
                <span className="text-[10px] text-gray-700">+{remainingCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs p-2">
              {remainingCount} more customers
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
