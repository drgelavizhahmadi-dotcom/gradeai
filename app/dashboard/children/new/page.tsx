'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, GraduationCap, User, School } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Breadcrumbs from '@/components/Breadcrumbs'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'

export default function NewChildPage() {
  const router = useRouter()
  const { t } = useLanguage()
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
        router.push(`/dashboard/children/${data.child.id}`)
      } else {
        setError(data.error || t.errors.generic)
      }
    } catch (err) {
      setError(t.errors.generic)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = t.child.nameRequired
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t.child.nameMinLength
    }

    const gradeNum = parseInt(formData.grade)
    if (!formData.grade) {
      newErrors.grade = t.child.gradeRequired
    } else if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 13) {
      newErrors.grade = t.child.gradeRange
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
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t.child.addNewTitle}</h1>
        <p className="text-lg text-gray-600 mt-2">
          {t.child.addNewDesc}
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
            label={t.child.fullName}
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
            label={t.child.gradeLevel}
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
            helperText={t.child.gradeHelperText}
          />

          {/* School Type Field */}
          <FormSelect
            label={t.child.schoolType}
            name="schoolType"
            required
            value={formData.schoolType}
            onChange={handleChange}
            icon={<School className="h-5 w-5 text-gray-400" />}
            options={[
              { value: 'Gymnasium', label: t.schoolTypes.gymnasium },
              { value: 'Realschule', label: t.schoolTypes.realschule },
              { value: 'Hauptschule', label: t.schoolTypes.hauptschule },
              { value: 'Gesamtschule', label: t.schoolTypes.gesamtschule },
              { value: 'Grundschule', label: t.schoolTypes.grundschule },
              { value: 'Other', label: t.schoolTypes.other },
            ]}
          />

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {t.common.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.child.adding}
                </>
              ) : (
                t.child.addChildButton
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}