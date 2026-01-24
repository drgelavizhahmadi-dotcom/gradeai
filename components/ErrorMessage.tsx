import { AlertCircle, XCircle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  variant?: 'inline' | 'card'
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  variant = 'card'
}: ErrorMessageProps) {
  if (variant === 'inline') {
    return (
      <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">{title}</p>
            <p className="text-sm text-red-700 mt-1">{message}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-shrink-0 text-red-700 hover:text-red-900 transition-colors"
              aria-label="Retry"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-12 shadow-md border-2 border-red-200 text-center">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  )
}
