'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import LanguageSelector from '@/components/LanguageSelector'
import { OwlMascot } from '@/components/mascots'
import {
  Upload,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <OwlMascot mood="thinking" size="lg" message="Loading..." />
          <p className="text-[var(--gray-600)] font-medium mt-4">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Children', href: '/dashboard', icon: Users },
    { name: 'Upload Test', href: '/dashboard/upload', icon: Upload },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-[var(--gray-200)] overflow-y-auto shadow-sm">
          {/* Logo with Owl */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--gray-200)]">
            <OwlMascot mood="happy" size="sm" showMessage={false} />
            <div>
              <h1 className="text-xl font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                GradeAI
              </h1>
              <p className="text-xs text-[var(--gray-500)]">Learning Companion</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg'
                      : 'text-[var(--gray-700)] hover:bg-[var(--primary-soft)]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Menu - Desktop */}
          <div className="border-t border-[var(--gray-200)] p-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 hover:bg-[var(--gray-100)] transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--lavender)] text-sm font-bold text-white shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-[var(--gray-800)] truncate">{user?.name}</p>
                  <p className="text-xs text-[var(--gray-500)] truncate">{user?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--gray-400)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-[var(--gray-200)] overflow-hidden">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--coral)] hover:bg-[var(--coral)]/10 transition-colors border-t border-[var(--gray-200)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-[var(--gray-200)] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <OwlMascot mood="happy" size="sm" showMessage={false} />
            <div>
              <h1 className="text-lg font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                GradeAI
              </h1>
            </div>
          </div>

          {/* Language Selector + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-colors"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Info - Mobile */}
          <div className="border-b border-[var(--gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--lavender)] text-base font-bold text-white shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--gray-800)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--gray-500)] truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation - Mobile */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg'
                      : 'text-[var(--gray-700)] hover:bg-[var(--primary-soft)]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign Out - Mobile */}
          <div className="border-t border-[var(--gray-200)] p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--coral)] bg-[var(--coral)]/10 hover:bg-[var(--coral)]/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Desktop Header with Language Selector */}
        <div className="hidden lg:block sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-[var(--gray-200)] shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end">
            <LanguageSelector />
          </div>
        </div>

        <div className="min-h-screen">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-[var(--gray-200)] bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[var(--gray-600)]">
                © 2026 GradeAI. Made with love for parents and children.
              </p>
              <div className="flex gap-6">
                <Link href="/terms" className="text-sm text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="text-sm text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors">
                  Privacy
                </Link>
                <Link href="/support" className="text-sm text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
