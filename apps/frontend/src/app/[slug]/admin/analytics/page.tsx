'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { AppErrorBoundary } from '@/components/ui/error-boundary'
import { formatPrice } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [days, setDays] = useState(30)
  const [question, setQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', slug, days],
    queryFn: () => apiClient.get(`/${slug}/analytics/summary?days=${days}`).then(r => r.data.data),
  })

  const { data: topItems = [] } = useQuery({
    queryKey: ['analytics-top', slug],
    queryFn: () => apiClient.get(`/${slug}/analytics/top-items?limit=8`).then(r => r.data.data),
  })

  const { data: dailyData = [] } = useQuery({
    queryKey: ['analytics-daily', slug, days],
    queryFn: () => apiClient.get(`/${slug}/analytics/daily?days=${days}`).then(r => r.data.data),
  })

  const { data: hourlyData = [] } = useQuery({
    queryKey: ['analytics-hourly', slug],
    queryFn: () => apiClient.get(`/${slug}/analytics/hourly`).then(r => r.data.data),
  })

  const aiMutation = useMutation({
    mutationFn: (q: string) =>
      apiClient.post(`/${slug}/analytics/ai-insight`, { question: q }).then(r => r.data.data.answer),
    onSuccess: (answer) => setAiAnswer(answer),
  })

  const QUICK_QUESTIONS = [
    'پرفروش‌ترین آیتم این ماه چیه؟',
    'چه روزهایی بیشترین فروش داشتیم؟',
    'پیشنهادت برای افزایش درآمد چیه؟',
    'کدام آیتم‌ها رو باید از منو حذف کنم؟',
  ]

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">آمار و تحلیل</h1>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  days === d
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d} روز
              </button>
            ))}
          </div>
        </div>

        {/* کارت‌های خلاصه */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'درآمد کل', value: formatPrice(summary.totalRevenue), icon: '💰' },
              { label: 'تعداد سفارشات', value: summary.totalOrders, icon: '📋' },
              { label: 'میانگین سفارش', value: formatPrice(summary.avgOrderValue), icon: '📊' },
              { label: 'در انتظار', value: summary.pendingOrders, icon: '⏳' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{card.icon}</span>
                  <span className="text-lg font-medium text-gray-900">{card.value}</span>
                </div>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* نمودار درآمد روزانه */}
        {dailyData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-medium text-gray-900 mb-4">درآمد روزانه</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [
                    Number(value).toLocaleString('fa-IR') + ' تومان',
                    'درآمد'
                  ]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* پرفروش‌ترین آیتم‌ها */}
          {topItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-4">پرفروش‌ترین آیتم‌ها</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topItems} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v: any) => [v + ' عدد', 'تعداد']} />
                  <Bar dataKey="totalQuantity" fill="#FF6B35" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* توزیع ساعتی */}
          {hourlyData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-4">پرترافیک‌ترین ساعات</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => `${h}:00`} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => [v + ' سفارش', 'تعداد']} />
                  <Bar dataKey="orderCount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI تحلیلگر */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">🤖 تحلیلگر هوشمند</h2>

          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q)
                  aiMutation.mutate(q)
                }}
                className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && question && aiMutation.mutate(question)}
              placeholder="سوالت رو بپرس..."
              className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Button
              size="sm"
              onClick={() => question && aiMutation.mutate(question)}
              isLoading={aiMutation.isPending}
            >
              بپرس
            </Button>
          </div>

          {aiAnswer && (
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line leading-7">{aiAnswer}</p>
            </div>
          )}
        </div>
      </div>
    </AppErrorBoundary>
  )
}