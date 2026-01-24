import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  iconColor?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColor = 'text-gray-400'
}: EmptyStateProps) {
  return (
    <div className="rounded-xl bg-white p-12 shadow-md border border-gray-200 text-center">
      <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className={`h-10 w-10 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
