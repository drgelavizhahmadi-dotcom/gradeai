import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { AlertCircle, Check } from 'lucide-react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: ReactNode
  helperText?: string
  success?: boolean
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, helperText, success, required, className, ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            required={required}
            className={`
              block w-full pr-4 py-3 border-2 rounded-xl
              focus:ring-2 focus:ring-blue-500 transition-colors
              ${icon ? 'pl-12' : 'pl-4'}
              ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}
              ${success ? 'border-green-300 focus:border-green-500' : ''}
              ${className || ''}
            `}
            {...props}
          />

          {error && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}

          {success && !error && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Check className="h-5 w-5 text-green-500" />
            </div>
          )}
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
)

FormInput.displayName = 'FormInput'

export default FormInput
