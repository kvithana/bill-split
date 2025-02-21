import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Edit, FileText, Scissors } from "lucide-react"
import { useEffect, useState } from "react"

type FloatingNavProps = {
  currentView: "display" | "edit" | "summary" | "split"
  onViewChange: (view: "display" | "edit" | "summary" | "split") => void
  onBack?: () => void
}

export default function FloatingNav({ currentView, onViewChange, onBack }: FloatingNavProps) {
  const [showBackButton, setShowBackButton] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackButton(window.scrollY < 10)
    }

    // Initial check
    handleScroll()

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <AnimatePresence>
        {onBack && showBackButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-4"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="rounded-full w-11 h-11 bg-[#fffdf8] border-dashed border-gray-300 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#fffdf8] rounded-full shadow-lg p-2 flex space-x-2 border border-dashed border-gray-300">
        <Button
          variant={currentView === "edit" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("edit")}
          className="rounded-full"
        >
          <Edit className="h-4 w-4 mr-1" />
          <span className="sr-only md:not-sr-only">Edit</span>
        </Button>
        <Button
          variant={currentView === "display" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("display")}
          className="rounded-full"
        >
          <Scissors className="h-4 w-4 mr-1" />
          <span className="sr-only md:not-sr-only">Split</span>
        </Button>
        <Button
          variant={currentView === "summary" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("summary")}
          className="rounded-full"
        >
          <FileText className="h-4 w-4 mr-1" />
          <span className="sr-only md:not-sr-only">Summary</span>
        </Button>
      </div>
    </>
  )
}
