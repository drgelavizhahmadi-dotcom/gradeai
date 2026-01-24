'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname) return []

    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Add home/dashboard
    breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' })

    let currentPath = ''
    for (let i = 0; i < paths.length; i++) {
      const segment = paths[i]
      currentPath += `/${segment}`

      // Skip dashboard since it's the home breadcrumb
      if (segment === 'dashboard') continue

      // Handle special cases and dynamic routes
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)

      // Replace hyphens with spaces
      label = label.replace(/-/g, ' ')

      // Handle specific routes
      if (segment === 'children') {
        label = 'Children'
        // Children list is shown on dashboard, don't make it a link
        currentPath = '/dashboard'
      } else if (segment === 'new') {
        label = 'Add New'
      } else if (segment === 'upload') {
        label = 'Upload Test'
      } else if (segment === 'uploads') {
        label = 'Uploads'
      } else if (segment === 'settings') {
        label = 'Settings'
      } else if (segment === 'edit') {
        label = 'Edit'
      }

      // Check if it's a dynamic route (ID)
      if (segment.match(/^[a-z0-9]{20,}$/i) || segment.match(/^clw[a-z0-9]+$/i)) {
        // This looks like an ID - try to get the entity name from context
        const previousSegment = paths[i - 1]
        if (previousSegment === 'children') {
          label = 'Child Profile'
        } else if (previousSegment === 'uploads') {
          label = 'Upload Details'
        } else {
          label = 'Details'
        }
      }

      breadcrumbs.push({ label, href: currentPath })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs on dashboard home
  if (pathname === '/dashboard') {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>

      {breadcrumbs.slice(1).map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 2

        return (
          <div key={breadcrumb.href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <span className="font-semibold text-gray-900">{breadcrumb.label}</span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-gray-900 transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
