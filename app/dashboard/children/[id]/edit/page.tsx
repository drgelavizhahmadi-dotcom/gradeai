'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, GraduationCap, User, School, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Breadcrumbs from '@/components/Breadcrumbs'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'

export default function EditChildPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const childId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    schoolType: 'Gymnasium',
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch child data on mount
  useEffect(() => {
    const fetchChild = async () => {
      try {
        const response = await fetch(`/api/children/${childId}`)
        const data = await response.json()
        
        if (response.ok) {
          setFormData({
            name: data.child.name,
            grade: String(data.child.grade),
            schoolType: data.child.schoolType,
          })
        } else {
          setError(data.error || 'Failed to load child data')
        }
      } catch (err) {
        setError('An error occurred while loading child data')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchChild()
  }, [childId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form before submitting
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'PUT',
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
        router.push(`/dashboard/children/${childId}`)
      } else {
        setError(data.error || 'Failed to update child')
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

  if (fetchLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/children/${childId}`}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common?.back || 'Back to Profile'}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {t.child?.editProfile || 'Edit Child Profile'}
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          {t.child?.profile || 'Update your child\'s information'}
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl bg-white shadow-md border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Name */}
          <FormInput
            label={t.child?.name || 'Child\'s Name'}
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Emma Schmidt"
            icon={<User className="h-5 w-5 text-gray-400" />}
            error={errors.name}
            required
          />

          {/* Grade */}
          <FormInput
            label={t.child?.grade || 'Grade Level'}
            name="grade"
            type="number"
            value={formData.grade}
            onChange={handleChange}
            placeholder="1-13"
            min="1"
            max="13"
            icon={<GraduationCap className="h-5 w-5 text-gray-400" />}
            error={errors.grade}
            required
            helperText="Enter grade 1-13 (German school system)"
          />

          {/* School Type */}
          <FormSelect
            label={t.child?.schoolType || 'School Type'}
            name="schoolType"
            value={formData.schoolType}
            onChange={handleChange}
            icon={<School className="h-5 w-5 text-gray-400" />}
            options={[
              { value: 'Gymnasium', label: 'Gymnasium' },
              { value: 'Realschule', label: 'Realschule' },
              { value: 'Hauptschule', label: 'Hauptschule' },
              { value: 'Gesamtschule', label: 'Gesamtschule' },
              { value: 'Grundschule', label: 'Grundschule' },
            ]}
            required
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.common?.save || 'Saving...'}
                </>
              ) : (
                t.common?.save || 'Save Changes'
              )}
            </button>
            <Link
              href={`/dashboard/children/${childId}`}
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t.common?.cancel || 'Cancel'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
