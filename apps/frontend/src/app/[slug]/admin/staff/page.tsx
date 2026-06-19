'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppErrorBoundary } from '@/components/ui/error-boundary'
import toast from 'react-hot-toast'

interface Staff {
  id: string
  name: string
  email: string
  role: 'manager' | 'waiter' | 'chef'
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'مدیر',
  waiter: 'گارسون',
  chef: 'آشپز',
}

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  waiter: 'bg-blue-100 text-blue-700',
  chef: 'bg-orange-100 text-orange-700',
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  manager: ['مشاهده و مدیریت سفارشات', 'مدیریت منو', 'مشاهده آمار', 'مدیریت کارمندان'],
  waiter: ['مشاهده سفارشات', 'تغییر وضعیت سفارش'],
  chef: ['مشاهده سفارشات آشپزخانه', 'تغییر وضعیت آماده‌سازی'],
}

function StaffModal({
  staff,
  slug,
  onClose,
}: {
  staff?: Staff
  slug: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: staff?.name ?? '',
    email: staff?.email ?? '',
    password: '',
    role: staff?.role ?? 'waiter' as 'manager' | 'waiter' | 'chef',
  })

  const mutation = useMutation({
    mutationFn: (data: any) =>
      staff
        ? apiClient.patch(`/${slug}/staff/${staff.id}`, data).then(r => r.data)
        : apiClient.post(`/${slug}/staff`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', slug] })
      toast.success(staff ? 'کارمند بروز شد' : 'کارمند اضافه شد')
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'خطا'),
  })

  const handleSubmit = () => {
    const data: any = { name: form.name, role: form.role }
    if (!staff) {
      data.email = form.email
      data.password = form.password
    } else if (form.password) {
      data.password = form.password
    }
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-base font-medium text-gray-900">
          {staff ? 'ویرایش کارمند' : 'کارمند جدید'}
        </h2>

        <div className="space-y-3">
          <Input
            label="نام"
            value={form.name}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />

          {!staff && (
            <Input
              label="ایمیل"
              type="email"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          )}

          <Input
            label={staff ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}
            type="password"
            value={form.password}
            onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">نقش</label>
            <div className="grid grid-cols-3 gap-2">
              {(['manager', 'waiter', 'chef'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setForm(p => ({ ...p, role }))}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    form.role === role
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{ROLE_LABELS[role]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* دسترسی‌های نقش انتخابی */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">دسترسی‌های این نقش:</p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[form.role].map((perm) => (
                <li key={perm} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-green-500">✓</span>
                  {perm}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} isLoading={mutation.isPending} className="flex-1">
              {staff ? 'ذخیره' : 'اضافه کردن'}
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const { slug } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editStaff, setEditStaff] = useState<Staff | undefined>()

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff', slug],
    queryFn: () => apiClient.get(`/${slug}/staff`).then(r => r.data.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (staff: Staff) =>
      apiClient.patch(`/${slug}/staff/${staff.id}`, { isActive: !staff.isActive }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', slug] })
      toast.success('وضعیت بروز شد')
    },
    onError: () => toast.error('خطا'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/${slug}/staff/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', slug] })
      toast.success('کارمند حذف شد')
    },
    onError: () => toast.error('خطا در حذف'),
  })

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">مدیریت کارمندان</h1>
          <Button size="sm" onClick={() => { setEditStaff(undefined); setShowModal(true) }}>
            + کارمند جدید
          </Button>
        </div>

        {/* توضیح نقش‌ها */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="bg-white rounded-xl border border-gray-100 p-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role]}`}>
                {label}
              </span>
              <ul className="mt-2 space-y-1">
                {ROLE_PERMISSIONS[role].map((perm) => (
                  <li key={perm} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-green-500">✓</span>
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* لیست کارمندان */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">👥</p>
            <p className="text-sm">هنوز کارمندی اضافه نشده</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {staffList.map((staff: Staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-medium text-sm">
                      {staff.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[staff.role]}`}>
                        {ROLE_LABELS[staff.role]}
                      </span>
                      {!staff.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          غیرفعال
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{staff.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMutation.mutate(staff)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      staff.isActive
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {staff.isActive ? 'غیرفعال' : 'فعال'}
                  </button>
                  <button
                    onClick={() => { setEditStaff(staff); setShowModal(true) }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(staff.id) }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <StaffModal
          staff={editStaff}
          slug={slug}
          onClose={() => { setShowModal(false); setEditStaff(undefined) }}
        />
      )}
    </AppErrorBoundary>
  )
}