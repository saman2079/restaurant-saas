'use client'

import { useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth.store'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { slug } = useParams<{ slug: string }>()
  const { user, token, clearAuth } = useAuthStore()

  useEffect(() => {
    if (!token || !user) { router.push('/login'); return }
    const allowed = ['owner', 'manager', 'waiter', 'chef', 'super_admin']
    if (!allowed.includes(user.role)) router.push('/login')
  }, [token, user, router])

  if (!user || !token) return null

  const navItems = [
    { href: `/${slug}/admin`, label: 'داشبورد', icon: '📊', exact: true },
    { href: `/${slug}/admin/menu`, label: 'منو', icon: '🍽️' },
    { href: `/${slug}/admin/orders`, label: 'سفارشات', icon: '📋' },
    { href: `/${slug}/admin/staff`, label: 'کارمندان', icon: '👥' },
    { href: `/${slug}/admin/analytics`, label: 'آمار', icon: '📈' },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside className="flex h-screen w-56 flex-col border-l border-gray-100 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm">
            🍽️
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{slug}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-2 space-y-0.5">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <span>👁️</span> مشاهده منو
          </Link>
          <button
            onClick={() => { clearAuth(); router.push('/login') }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span> خروج
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}