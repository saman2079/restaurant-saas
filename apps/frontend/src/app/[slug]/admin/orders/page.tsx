'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/lib/api/order.api'
import { AppErrorBoundary } from '@/components/ui/error-boundary'
import { getOrderStatusColor, getOrderStatusLabel, formatPrice } from '@/lib/utils'
import { Order } from '@/types'
import { Button } from '@/components/ui/button'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/auth.store'

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
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('active')
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  // Socket
  useEffect(() => {
    if (!user?.tenantId) return

    const socket: Socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
      { transports: ['websocket', 'polling'] }
    )

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-tenant', user.tenantId)
      console.log('✅ Socket متصل - join-tenant:', user.tenantId)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('new-order', (order: Order) => {
      console.log('📢 سفارش جدید:', order)
      qc.invalidateQueries({ queryKey: ['orders', slug] })
      toast('🔔 سفارش جدید از میز ' + (order.tableNumber ?? '-'), {
        duration: 5000,
        style: { background: '#FF6B35', color: 'white' },
      })
    })

    socket.on('order-updated', () => {
      qc.invalidateQueries({ queryKey: ['orders', slug] })
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.tenantId, slug, qc])

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', slug, filter],
    queryFn: () => orderApi.getAll(slug, { limit: 100 }),
    refetchInterval: 60000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: {
      id: string; status: string; rejectionReason?: string
    }) => orderApi.updateStatus(slug, id, status, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', slug] })
      toast.success('وضعیت بروز شد')
    },
    onError: () => toast.error('خطا'),
  })

  const activeOrders = (orders as Order[]).filter(
    o => !['delivered', 'cancelled'].includes(o.status)
  )

  const displayOrders = filter === 'active'
    ? activeOrders
    : filter === 'all'
    ? orders as Order[]
    : (orders as Order[]).filter(o => o.status === filter)

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-gray-900">سفارشات</h1>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`} />
          </div>
          {activeOrders.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {activeOrders.length} فعال
            </span>
          )}
        </div>

        {/* فیلتر */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'active', label: 'فعال' },
            { value: 'all', label: 'همه' },
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

        {/* لیست */}
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

                <div className="space-y-1 mb-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}× {item.name}</span>
                      <span className="text-gray-500 text-xs">{formatPrice(item.subtotal)}</span>
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
                    {!['cancelled', 'delivered'].includes(order.status) && (
                      <button
                        onClick={() => setCancelOrderId(order.id)}
                        className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
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

      {/* مودال لغو */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="mb-1 text-base font-medium text-gray-900">دلیل لغو سفارش</h2>
            <p className="text-xs text-gray-400 mb-3">این پیام به مشتری نمایش داده می‌شود</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثلاً: متأسفانه این آیتم موجود نیست"
              className="w-full h-24 rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="danger"
                onClick={() => {
                  statusMutation.mutate({
                    id: cancelOrderId,
                    status: 'cancelled',
                    rejectionReason: rejectionReason || 'متأسفانه سفارش شما تایید نشد',
                  })
                  setCancelOrderId(null)
                  setRejectionReason('')
                }}
                className="flex-1"
              >
                تایید لغو
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setCancelOrderId(null); setRejectionReason('') }}
                className="flex-1"
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppErrorBoundary>
  )
}