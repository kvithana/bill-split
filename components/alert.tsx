import { cn } from "@/lib/utils"

// Simple alert component since the UI one might not exist
export const Alert = ({
  variant,
  className,
  children,
}: {
  variant: "warning" | "error"
  className?: string
  children: React.ReactNode
}) => (
  <div
    className={cn(
      "p-4 rounded-md border",
      {
        "bg-amber-50 border-amber-200 text-amber-800": variant === "warning",
        "bg-red-50 border-red-200 text-red-800": variant === "error",
      },
      className
    )}
  >
    {children}
  </div>
)

export const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-medium mb-1">{children}</h3>
)

export const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm">{children}</p>
)
