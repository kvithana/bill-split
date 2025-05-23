import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Edit, FileText, Scissors, Cloud, Share2, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { useStandalone } from "@/hooks/use-standalone"
import { cn } from "@/lib/utils"
import { TutorialTooltip } from "./tutorial-tooltips"
import { RefreshButton } from "./refresh-button"

type FloatingNavProps = {
  hideEdit?: boolean
  currentView: string
  onViewChange: (view: "summary" | "edit" | "display" | "split") => void
  onBack?: () => void
  scrollToBottomButton?: boolean
  isCloud?: boolean
  onRefresh?: () => Promise<void>
  loading?: boolean
}

export default function FloatingNav({
  hideEdit = false,
  currentView,
  onViewChange,
  scrollToBottomButton,
  isCloud,
  onRefresh,
  loading,
}: FloatingNavProps) {
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const isStandalone = useStandalone()

  const [tutorialStep, setTutorialStep] = useState(hideEdit ? 1 : 0)
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => {
    return localStorage.getItem("tutorial-completed") !== "true"
  })

  const tutorialContent = [
    {
      title: "Split View",
      content:
        "This is where you assign splits to each person. Tap on an item to split it among the group.",
    },
    {
      title: "Edit View",
      content:
        "Add, update, or delete items in the edit view. You can also add a label to this receipt.",
    },
    {
      title: "Summary View",
      content:
        "Once all items have been split, you can view the breakdown of who owes what in the summary.",
    },
  ]

  const handleNext = () => {
    if (tutorialStep < tutorialContent.length - 1) {
      setTutorialStep(tutorialStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1)
    }
  }

  const handleClose = () => {
    setIsTutorialOpen(false)
    setTutorialStep(0)
    localStorage.setItem("tutorial-completed", "true")
  }

  useEffect(() => {
    // Handle scroll position for back/save buttons
    const handleScroll = () => {
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
    <>
      <AnimatePresence>
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
            {!hideEdit && (
              <TutorialTooltip
                content={tutorialContent[1].content}
                title={tutorialContent[1].title}
                open={isTutorialOpen && tutorialStep === 1}
                onOpenChange={() => {}}
                step={tutorialStep + 1}
                totalSteps={tutorialContent.length}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onClose={handleClose}
              >
                <Button
                  variant={currentView === "edit" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => !isTutorialOpen && onViewChange("edit")}
                  className={cn("rounded-full", {
                    "animate-pulse bg-gray-200": isTutorialOpen && tutorialStep === 1,
                  })}
                >
                  <Edit className="h-4 w-4 md:mr-1" />
                  <span className="sr-only md:not-sr-only">Edit</span>
                </Button>
              </TutorialTooltip>
            )}
            <TutorialTooltip
              content={tutorialContent[0].content}
              open={isTutorialOpen && tutorialStep === 0}
              title={tutorialContent[0].title}
              onOpenChange={() => {}}
              step={tutorialStep + 1}
              totalSteps={tutorialContent.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onClose={handleClose}
            >
              <Button
                variant={currentView === "display" ? "default" : "ghost"}
                size="sm"
                onClick={() => !isTutorialOpen && onViewChange("display")}
                className={cn("rounded-full", {
                  "animate-pulse": isTutorialOpen && tutorialStep === 0,
                })}
              >
                <Scissors className="h-4 w-4 md:mr-1" />
                <span className="sr-only md:not-sr-only">Split</span>
              </Button>
            </TutorialTooltip>
            <TutorialTooltip
              content={tutorialContent[2].content}
              title={tutorialContent[2].title}
              open={isTutorialOpen && tutorialStep === 2}
              onOpenChange={() => {}}
              step={tutorialStep + 1}
              totalSteps={tutorialContent.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onClose={handleClose}
            >
              <Button
                variant={currentView === "summary" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("summary")}
                className={cn("rounded-full", {
                  "animate-pulse bg-gray-200": isTutorialOpen && tutorialStep === 2,
                })}
              >
                <FileText className="h-4 w-4 md:mr-1" />
                <span className="sr-only md:not-sr-only">Summary</span>
              </Button>
            </TutorialTooltip>
          </motion.div>
        )}
      </AnimatePresence>
      {isCloud && onRefresh && (
        <RefreshButton isCloud={true} onRefresh={onRefresh} loading={loading} />
      )}
    </>
  )
}
