import { ErrorBoundary } from "react-error-boundary"

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
    <div className="w-full h-full flex items-center justify-center max-h-96">
      <div className="text-center text-red-500">
        <h1 className="font-semibold">Something went wrong</h1>
        <p className="text-gray-500 text-sm">Please try again later</p>
        <div className="group cursor-help mt-2">
          <p className="text-gray-400 text-xs group-hover:hidden block">
            Hover here to see error message
          </p>
          <p className="text-gray-500 text-xs group-hover:block hidden">
            {error.message || "Unknown error"}
          </p>
        </div>
      </div>
    </div>
  )
}
