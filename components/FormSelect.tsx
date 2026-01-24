import { SelectHTMLAttributes, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  icon?: ReactNode
  helperText?: string
  options: { value: string; label: string }[]
}

export default function FormSelect({
  label,
  error,
  icon,
  helperText,
  options,
  required,
  className,
  ...props
}: FormSelectProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            {icon}
          </div>
        )}

        <select
          required={required}
          className={`
            block w-full pr-10 py-3 border-2 rounded-xl
            focus:ring-2 focus:ring-blue-500 transition-colors
            appearance-none bg-white cursor-pointer
            ${icon ? 'pl-12' : 'pl-4'}
            ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}
            ${className || ''}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
