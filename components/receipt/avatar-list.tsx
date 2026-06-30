import { getColorForPerson } from "@/lib/colors"
import { Person, PersonPortion } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AvatarList({
  people,
  portions,
  quantity,
}: {
  people: Person[]
  portions: PersonPortion[]
  quantity?: number
}) {
  if (!portions.length) return null

  const MAX_VISIBLE_AVATARS = 3
  const uniquePortions = portions.filter(
    (p, i, arr) => arr.findIndex((x) => x.personId === p.personId) === i
  )
  const visiblePortions = uniquePortions.slice(0, MAX_VISIBLE_AVATARS)
  const hiddenCount = Math.max(0, uniquePortions.length - MAX_VISIBLE_AVATARS)

  const allocatedPortions = portions.reduce((sum, p) => sum + p.portions, 0)

  return (
    <div className="flex items-center gap-1">
      {quantity !== undefined && allocatedPortions < quantity && (
        <span className="text-xs text-gray-400 font-mono tabular-nums">
          {allocatedPortions}/{quantity}
        </span>
      )}
      <div className="flex -space-x-1">
        {visiblePortions.map((portion) => {
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
        {hiddenCount > 0 && (
          <Avatar className="w-6 h-6 border-2 border-white">
            <AvatarFallback className="text-white bg-gray-400 text-xs">
              +{hiddenCount}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}
