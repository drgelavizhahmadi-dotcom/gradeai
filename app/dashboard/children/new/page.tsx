'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, GraduationCap, User, School } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'

export default function NewChildPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    schoolType: 'Gymnasium',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form before submitting
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          grade: parseInt(formData.grade),
          schoolType: formData.schoolType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/children/${data.child.id}`)
      } else {
        setError(data.error || 'Failed to add child')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    const gradeNum = parseInt(formData.grade)
    if (!formData.grade) {
      newErrors.grade = 'Grade is required'
    } else if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 13) {
      newErrors.grade = 'Grade must be between 1 and 13'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Add New Child</h1>
        <p className="text-lg text-gray-600 mt-2">
          Enter your child's information to start tracking their academic progress
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-white p-6 sm:p-8 shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <FormInput
            label="Child's Full Name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            icon={<User className="h-5 w-5 text-gray-400" />}
            placeholder="e.g., Max Mustermann"
          />

          {/* Grade Field */}
          <FormInput
            label="Grade Level"
            name="grade"
            type="number"
            required
            min={1}
            max={13}
            value={formData.grade}
            onChange={handleChange}
            error={errors.grade}
            icon={<GraduationCap className="h-5 w-5 text-gray-400" />}
            placeholder="e.g., 7"
            helperText="Enter grade level from 1 to 13"
          />

          {/* School Type Field */}
          <FormSelect
            label="School Type"
            name="schoolType"
            required
            value={formData.schoolType}
            onChange={handleChange}
            icon={<School className="h-5 w-5 text-gray-400" />}
            helperText="Select the type of school your child attends"
            options={[
              { value: 'Gymnasium', label: 'Gymnasium' },
              { value: 'Realschule', label: 'Realschule' },
              { value: 'Hauptschule', label: 'Hauptschule' },
              { value: 'Gesamtschule', label: 'Gesamtschule' },
              { value: 'Grundschule', label: 'Grundschule' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Child'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}