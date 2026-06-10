'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Order } from '@/types'
import toast from 'react-hot-toast'
import io from 'socket.io-client'
import { orderApi } from '@/lib/api/order.api'
import { formatPrice, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils'
import { AppErrorBoundary } from '@/components/ui/error-boundary'


const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'تأیید کن',
  confirmed: 'شروع آماده‌سازی',
  preparing: 'آماده شد',
  ready: 'تحویل داده شد',
}

export default function OrdersPage() {
  const { slug } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<string>('active')

  // WebSocket
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')
    socket.emit('join-tenant', slug)
    socket.on('new-order', () => {
      qc.invalidateQueries({ queryKey: ['orders', slug] })
      toast('سفارش جدید! 🔔', { icon: '🍽️' })
    })
    socket.on('order-updated', () => {
      qc.invalidateQueries({ queryKey: ['orders', slug] })
    })
    return () => { socket.disconnect() }
  }, [slug, qc])

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', slug, filter],
    queryFn: () => orderApi.getAll(slug, {
      status: filter === 'active' ? undefined : filter,
      limit: 50,
    }),
    refetchInterval: 30000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateStatus(slug, id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', slug] })
      toast.success('وضعیت بروز شد')
    },
    onError: () => toast.error('خطا'),
  })

  const activeOrders = orders.filter((o: Order) =>
    !['delivered', 'cancelled'].includes(o.status)
  )
  const displayOrders = filter === 'active' ? activeOrders : orders

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">سفارشات</h1>
          {activeOrders.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {activeOrders.length} فعال
            </span>
          )}
        </div>

        {/* فیلتر */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: 'active', label: 'فعال' },
            { value: 'pending', label: 'در انتظار' },
            { value: 'preparing', label: 'در حال آماده‌سازی' },
            { value: 'delivered', label: 'تحویل شده' },
            { value: 'cancelled', label: 'لغو شده' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* لیست سفارشات */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm">سفارشی وجود ندارد</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayOrders.map((order: Order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        میز {order.tableNumber ?? '-'}
                      </p>
                      {order.isAiOrder && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString('fa-IR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>

                {/* آیتم‌ها */}
                <div className="space-y-1 mb-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <div className="flex gap-2">
                    {STATUS_FLOW[order.status] && (
                      <button
                        onClick={() => statusMutation.mutate({
                          id: order.id,
                          status: STATUS_FLOW[order.status]
                        })}
                        disabled={statusMutation.isPending}
                        className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        {STATUS_LABEL[order.status]}
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: 'cancelled' })}
                        className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        لغو
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppErrorBoundary>
  )
}