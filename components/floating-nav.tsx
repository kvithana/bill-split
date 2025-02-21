import { Button } from "@/components/ui/button"
import { Edit, FileText, Scissors } from "lucide-react"

type FloatingNavProps = {
  currentView: "display" | "edit" | "summary" | "split"
  onViewChange: (view: "display" | "edit" | "summary" | "split") => void
}

export default function FloatingNav({ currentView, onViewChange }: FloatingNavProps) {
  return (
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
  )
}
