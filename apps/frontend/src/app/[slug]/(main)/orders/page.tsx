'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/lib/api/order.api'
import { useCartStore } from '@/store/cart-store'
import { formatPrice, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import io from 'socket.io-client'
import toast from 'react-hot-toast'

export default function CustomerOrdersPage() {
  const { slug } = useParams<{ slug: string }>()
  const [orderId, setOrderId] = useState<string | null>(null)
  console.log(slug)

  // orderId از localStorage بخون
  useEffect(() => {
    const stored = localStorage.getItem(`current-order-${slug}`)
    if (stored) setOrderId(stored)
  }, [slug])

  const { data: order, refetch } = useQuery({
    queryKey: ['my-order', slug, orderId],
    queryFn: () => orderApi.getByIdPublic(slug, orderId!),
    enabled: !!orderId,
    refetchInterval: 15000,
  })

  // Socket - گوش دادن به تغییر وضعیت
  useEffect(() => {
    if (!orderId) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')
    socket.emit('join-order', orderId)

    socket.on('order-status-changed', (data: any) => {
      if (data.orderId !== orderId) return

      refetch()

      if (data.status === 'cancelled') {
        toast.error(data.rejectionReason || 'سفارش شما تایید نشد', { duration: 6000 })
      } else if (data.status === 'confirmed') {
        toast.success('سفارش شما تایید شد! 🎉')
      } else if (data.status === 'ready') {
        toast.success('سفارش شما آماده شد 🍽️')
      }
    })

    return () => { socket.disconnect() }
  }, [orderId, refetch])

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-center px-4">
        <p className="text-4xl mb-2">📋</p>
        <p className="text-sm text-gray-500">هنوز سفارشی ثبت نکرده‌اید</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  const canEdit = order.status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 pb-24" dir="rtl">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">سفارش شما</h1>
          <span className={`text-xs px-3 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {order.status === 'cancelled' && order.rejectionReason && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-700">{order.rejectionReason}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}× {item.name}</span>
              <span className="text-gray-500">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-medium text-sm">
            <span>جمع کل</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {canEdit && (
          <p className="text-xs text-gray-400 text-center">
            سفارش شما هنوز در حال بررسی است و قابل ویرایش می‌باشد
          </p>
        )}

        {order.status === 'cancelled' && (
          <button
            onClick={() => {
              localStorage.removeItem(`current-order-${slug}`)
              window.location.href = `/${slug}/ai`
            }}
            className="w-full rounded-xl bg-orange-500 text-white py-3 text-sm font-medium"
          >
            سفارش جدید
          </button>
        )}
      </div>
    </div>
  )
}