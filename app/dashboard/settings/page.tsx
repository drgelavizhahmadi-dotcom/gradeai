'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Globe, 
  Shield, 
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Sign out and redirect to home
        await signOut({ callbackUrl: '/' })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('An error occurred while deleting your account')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {t.settings?.title || 'Settings'}
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          {t.settings?.subtitle || 'Manage your account settings and preferences'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="rounded-xl bg-white p-6 shadow-md border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-blue-100 p-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.settings?.accountInfo || 'Account Information'}
              </h2>
              <p className="text-sm text-gray-600">
                {t.settings?.accountInfoDesc || 'Your personal account details'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  {t.settings?.name || 'Name'}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {session?.user?.name || 'Not set'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  {t.settings?.email || 'Email'}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {session?.user?.email || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="rounded-xl bg-white p-6 shadow-md border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-purple-100 p-3">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.settings?.language || 'Language Preference'}
              </h2>
              <p className="text-sm text-gray-600">
                {t.settings?.languageDesc || 'Language selector is available in the top-right corner of the page'}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="rounded-xl bg-white p-6 shadow-md border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-emerald-100 p-3">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.settings?.privacy || 'Privacy & Data'}
              </h2>
              <p className="text-sm text-gray-600">
                {t.settings?.privacyDesc || 'Your data is encrypted and stored securely. We never share your information with third parties.'}
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl bg-red-50 p-6 shadow-md border-2 border-red-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.settings?.dangerZone || 'Danger Zone'}
              </h2>
              <p className="text-sm text-gray-600">
                {t.settings?.dangerZoneDesc || 'Irreversible and destructive actions'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-red-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t.settings?.deleteAccount || 'Delete Account'}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.settings?.deleteAccountDesc || 'Permanently delete your account, all children profiles, and all test analyses. This action cannot be undone.'}
                </p>
              </div>
              <button
                onClick={() => setDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" />
                {t.settings?.deleteAccount || 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
        title={t.settings?.confirmDeleteAccount || 'Delete Account?'}
        message={t.settings?.deleteAccountWarning || 'Are you absolutely sure? This will permanently delete your account, all children profiles, and all test analyses. This action cannot be undone and all your data will be lost forever.'}
      />
    </div>
  )
}
