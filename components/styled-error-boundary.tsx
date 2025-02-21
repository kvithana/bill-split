import { AlertCircle } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"
import { EmptyState } from "./empty-state"

export function StyledErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary fallbackRender={errorFallback}>{children}</ErrorBoundary>
}

export function HiddenErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary fallbackRender={() => null}>{children}</ErrorBoundary>
}

function errorFallback({ error }: { error: Error }) {
  return <ErrorFallback error={error} />
}

function ErrorFallback({ error }: { error: { message?: string } }) {
  return (
    <EmptyState
      icon={<AlertCircle className="w-12 h-12 text-gray-400" />}
      title="Something went wrong"
      description={error.message}
    />
  )
}
