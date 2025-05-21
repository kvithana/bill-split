import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, UserPlus, X, ChevronDown } from "lucide-react"
import { getColorForPerson } from "@/lib/colors"
import type { Person } from "@/lib/types"
import AddPersonDialog from "@/components/add-person-dialog"

// Component for managing the customer list section
export default function CustomerSection({
  people,
  isExpanded,
  onToggle,
  onRemove,
  onAdd,
  isOwner,
}: {
  people: Person[]
  isExpanded: boolean
  onToggle: () => void
  onRemove: (person: Person) => void
  onAdd: (name: string) => void
  isOwner: boolean
}) {
  const [isAddPersonDialogOpen, setIsAddPersonDialogOpen] = useState(false)

  return (
    <div className="border-b border-dashed border-gray-300">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full px-1 md:px-4 flex items-center justify-between hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
      >
        <div className="flex items-center gap-1.5 px-4">
          <Users className="h-4 w-4" />
          <span className="text-sm font-bold uppercase">Customers ({people.length})</span>
        </div>

        {/* Minimized preview of avatars when collapsed */}
        {!isExpanded && people.length > 0 && (
          <div className="flex items-center px-4">
            <div className="flex -space-x-2 mr-2">
              {people.slice(0, 3).map((person, index) => (
                <Avatar key={person.id} className="w-5 h-5 border border-white">
                  <AvatarFallback
                    className="text-white text-[10px]"
                    style={{ backgroundColor: getColorForPerson(index) }}
                  >
                    {person.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              {people.length > 3 && (
                <div className="z-10 w-5 h-5 rounded-full bg-gray-200 text-[10px] flex items-center justify-center border border-white text-gray-600">
                  +{people.length - 3}
                </div>
              )}
            </div>
            <motion.div initial={{ rotate: 0 }} animate={{ rotate: 0 }} className="h-4 w-4">
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        )}

        {/* Just show the chevron when expanded */}
        {(isExpanded || people.length === 0) && (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="h-4 w-4 mr-4"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        )}
      </Button>

      {/* Expandable content with animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-3 px-4 md:px-6 border-t border-dotted border-gray-200">
              {people.length === 0 ? (
                <div className="text-center py-2 text-gray-500 text-sm italic">
                  No customers added yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-1 pt-1">
                  {people.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex justify-between items-center py-1.5 px-2 text-sm border-b border-dotted border-gray-100"
                    >
                      <div className="flex items-center">
                        <Avatar className="w-5 h-5 mr-2">
                          <AvatarFallback
                            className="text-white text-[10px]"
                            style={{ backgroundColor: getColorForPerson(index) }}
                          >
                            {person.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{person.name}</span>
                      </div>

                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent"
                          onClick={() => onRemove(person)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mt-3"
              >
                <AddPersonDialog
                  open={isAddPersonDialogOpen}
                  onOpenChange={setIsAddPersonDialogOpen}
                  onAddPerson={onAdd}
                  triggerButton={
                    <Button
                      variant="ghost"
                      className="text-xs border border-dashed border-gray-200 py-1.5 px-3 rounded-sm hover:bg-gray-50"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      ADD CUSTOMER
                    </Button>
                  }
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
