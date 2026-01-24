'use client'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
  critical?: boolean
}

export default function ProgressBar({ 
  value, 
  max, 
  label, 
  showPercentage = true,
  critical = false 
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  
  const getColor = () => {
    if (critical) return 'bg-red-500'
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-700">{label}</span>
          {showPercentage && (
            <span className="text-slate-600 font-medium">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
