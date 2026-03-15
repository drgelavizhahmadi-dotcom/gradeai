import { AlertCircle, XCircle, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface ErrorMessageProps {
  title?: string
  message: string
  errorCode?: string
  onRetry?: () => void
  variant?: 'inline' | 'card'
}

export default function ErrorMessage({
  title,
  message,
  errorCode,
  onRetry,
  variant = 'card'
}: ErrorMessageProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (errorCode) {
      navigator.clipboard.writeText(errorCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const retryText = t?.upload?.retryBtn || t?.child?.tryAgain || 'Try Again'
  const displayTitle = title || t?.common?.error || 'Something went wrong'

  const ErrorIdBadge = () => errorCode ? (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-mono text-gray-500 transition-colors mt-2"
      title="Copy Error ID for support"
    >
      {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      ID: {errorCode}
    </button>
  ) : null

  if (variant === 'inline') {
    return (
      <div role="alert" className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">{displayTitle}</p>
            <p className="text-sm text-red-700 mt-1">{message}</p>
            <ErrorIdBadge />
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-shrink-0 text-red-700 hover:text-red-900 transition-colors p-1"
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
    <div role="alert" className="rounded-xl bg-white p-12 shadow-md border-2 border-red-200 text-center">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{displayTitle}</h3>
      <p className="text-gray-600 mb-2 max-w-md mx-auto">{message}</p>
      <div className="mb-6">
        <ErrorIdBadge />
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </button>
      )}
    </div>
  )
}
