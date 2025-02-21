import { motion } from "framer-motion"
import { Receipt } from "lucide-react"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  delay?: number
}

export function EmptyState({
  icon = <Receipt className="w-12 h-12 text-gray-400" />,
  title,
  description,
  delay = 0,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay }}
      className="flex flex-col items-center justify-center p-8 text-center w-full h-full min-h-screen"
    >
      <div className="rounded-full bg-gray-100 p-4 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1 font-mono">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm font-mono">{description}</p>}
    </motion.div>
  )
}
