'use client'

import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/lib/api/auth.store'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'


const navItems = [
  { href: '/super-admin', label: 'داشبورد', icon: '📊' },
  { href: '/super-admin/tenants', label: 'رستوران‌ها', icon: '🏪' },
  { href: '/super-admin/settings', label: 'تنظیمات', icon: '⚙️' },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { clearAuth, user } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-l border-gray-100 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm">
          🍽️
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">سوپر ادمین</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === item.href
                ? 'bg-orange-50 text-orange-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          خروج
        </button>
      </div>
    </aside>
  )
}