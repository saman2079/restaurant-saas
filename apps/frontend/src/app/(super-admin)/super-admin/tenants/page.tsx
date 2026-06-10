'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/src/components/ui/input'
import { ErrorBoundary } from '@/src/components/ui/error-boundary'
import { Tenant } from '@/src/types'
import toast from 'react-hot-toast'
import { tenantApi } from '@/src/lib/api/tenant.api'
import { Button } from '@/src/components/ui/button'
import { formatDate } from '@/src/lib/utils'

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-600',
    pro: 'bg-blue-100 text-blue-600',
    business: 'bg-purple-100 text-purple-600',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[plan] ?? styles.basic}`}>
      {plan}
    </span>
  )
}

function TenantRow({ tenant, onToggle }: { tenant: Tenant; onToggle: (id: string) => void }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
          <p className="text-xs text-gray-400">{tenant.slug}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <PlanBadge plan={tenant.plan} />
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs ${tenant.isActive ? 'text-green-600' : 'text-red-500'}`}>
          {tenant.isActive ? '● فعال' : '● غیرفعال'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(tenant.createdAt)}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggle(tenant.id)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {tenant.isActive ? 'غیرفعال کن' : 'فعال کن'}
        </button>
      </td>
    </tr>
  )
}

function CreateTenantModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    plan: 'basic' as const,
  })

  const mutation = useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('رستوران با موفقیت ایجاد شد')
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'خطا در ایجاد رستوران')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <div className="fixed text-black inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-medium text-gray-900">رستوران جدید</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="نام رستوران" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="نام مالک" value={form.ownerName}
            onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} required />
          <Input label="ایمیل مالک" type="email" value={form.ownerEmail}
            onChange={(e) => setForm((p) => ({ ...p, ownerEmail: e.target.value }))} required />
          <Input label="رمز عبور مالک" type="password" value={form.ownerPassword}
            onChange={(e) => setForm((p) => ({ ...p, ownerPassword: e.target.value }))} required />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">پلن</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value as any }))}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" isLoading={mutation.isPending} className="flex-1">
              ایجاد
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TenantsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', search],
    queryFn: () => tenantApi.getAll(1, search || undefined),
  })

  const toggleMutation = useMutation({
    mutationFn: tenantApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('وضعیت بروز شد')
    },
  })

  console.log(data)

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">رستوران‌ها</h1>
          <Button onClick={() => setShowCreate(true)}>+ رستوران جدید</Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رستوران</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">پلن</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">وضعیت</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">تاریخ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((tenant) => (
                  <TenantRow
                    key={tenant.id}
                    tenant={tenant}
                    onToggle={(id) => toggleMutation.mutate(id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && <CreateTenantModal onClose={() => setShowCreate(false)} />}
    </ErrorBoundary>
  )
}