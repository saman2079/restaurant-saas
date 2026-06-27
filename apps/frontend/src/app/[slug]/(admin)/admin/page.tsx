'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { menuApi } from '@/lib/api/menu.api'
import { orderApi } from '@/lib/api/order.api'
import { getOrderStatusColor, getOrderStatusLabel, formatPrice } from '@/lib/utils'
import { AppErrorBoundary } from '@/components/ui/error-boundary'

interface Stats {
  totalMenuItems: number
  totalCategories: number
  pendingOrders: number
  todayOrders: number
}

export default function AdminDashboard() {
  const { slug } = useParams<{ slug: string }>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      menuApi.getItems(slug),
      menuApi.getCategories(slug),
      orderApi.getAll(slug, { limit: 5 }),
    ]).then(([items, cats, orders]) => {
      setStats({
        totalMenuItems: items.length,
        totalCategories: cats.length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        todayOrders: orders.length,
      })
      setRecentOrders(orders.slice(0, 5))
    }).finally(() => setIsLoading(false))
  }, [slug])

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
    </div>
  )

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-6">
        <h1 className="text-lg font-medium text-gray-900">داشبورد</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'آیتم‌های منو', value: stats?.totalMenuItems, icon: '🍽️' },
            { label: 'دسته‌بندی‌ها', value: stats?.totalCategories, icon: '📂' },
            { label: 'سفارش در انتظار', value: stats?.pendingOrders, icon: '⏳' },
            { label: 'سفارشات اخیر', value: stats?.todayOrders, icon: '📋' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-medium text-gray-900">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* سفارشات اخیر */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-medium text-gray-900">سفارشات اخیر</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">سفارشی ثبت نشده</p>
            ) : recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    میز {order.tableNumber ?? '-'}
                  </p>
                  <p className="text-xs text-gray-400">{order.items?.length} آیتم</p>
                </div>
                <div className="text-left">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppErrorBoundary>
  )
}