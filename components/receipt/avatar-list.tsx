import { getColorForPerson } from "@/lib/colors"
import { Person, PersonPortion } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AvatarList({
  people,
  portions,
}: {
  people: Person[]
  portions: PersonPortion[]
}) {
  if (!portions.length) return null

  const MAX_VISIBLE_AVATARS = portions.length === 3 ? 3 : 2
  const visiblePortions = portions.slice(0, MAX_VISIBLE_AVATARS)
  const remainingCount = portions.length > 3 ? portions.length - 2 : 0
  const showRemainingCount = remainingCount > 0

  return (
    <div className="flex -space-x-1 -ml-1">
      {visiblePortions.map((portion, index) => {
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
      {showRemainingCount && (
        <Avatar className="w-6 h-6 border-2 border-white">
          <AvatarFallback className="text-white bg-black text-xs">+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
