import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Edit, FileText, Scissors } from "lucide-react"
import { useEffect, useState } from "react"
import { useStandalone } from "@/hooks/use-standalone"
import { cn } from "@/lib/utils"

type FloatingNavProps = {
  currentView: "display" | "edit" | "summary" | "split"
  onViewChange: (view: "display" | "edit" | "summary" | "split") => void
  onBack?: () => void
  scrollToBottomButton?: boolean
}

export default function FloatingNav({
  currentView,
  onViewChange,
  onBack,
  scrollToBottomButton,
}: FloatingNavProps) {
  const [showBackButton, setShowBackButton] = useState(true)
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const isStandalone = useStandalone()

  useEffect(() => {
    // Handle scroll position for back/save buttons
    const handleScroll = () => {
      setShowBackButton(window.scrollY < 10)

      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10
      setShowSaveButton(!!scrollToBottomButton && !isAtBottom)
    }

    // Handle input focus/blur events
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setIsInputFocused(true)
      }
    }

    const handleBlur = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setIsInputFocused(false)
      }
    }

    // Initial check
    handleScroll()

    window.addEventListener("scroll", handleScroll)
    document.addEventListener("focusin", handleFocus)
    document.addEventListener("focusout", handleBlur)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("focusin", handleFocus)
      document.removeEventListener("focusout", handleBlur)
    }
  }, [scrollToBottomButton])

  function onScrollToBottomButton() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    })
  }

  return (
    <AnimatePresence>
      {!isInputFocused && onBack && showBackButton && (
        <motion.div
          key="back-button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn({
            "fixed left-4": true,
            "bottom-4": !isStandalone,
            "bottom-8": isStandalone,
          })}
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

      {!isInputFocused && showSaveButton && (
        <motion.div
          key="save-button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn({
            "fixed right-4 md:hidden": true,
            "bottom-4": !isStandalone,
            "bottom-8": isStandalone,
          })}
        >
          <Button
            variant="default"
            size="sm"
            onClick={onScrollToBottomButton}
            className="rounded-full w-11 h-11 bg-black hover:bg-gray-800"
          >
            <Check className="h-5 w-5" />
            <span className="sr-only">Scroll to bottom</span>
          </Button>
        </motion.div>
      )}

      {!isInputFocused && (
        <motion.div
          key="input-focused"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn({
            "fixed transform -translate-x-1/2 bg-[#fffdf8] rounded-full shadow-lg p-2 flex space-x-2 border border-dashed border-gray-300":
              true,
            "bottom-4": !isStandalone,
            "bottom-8": isStandalone,
          })}
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
