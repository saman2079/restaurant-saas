'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth.api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth.store'


export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { user, token } = await authApi.login(form.email, form.password)
      setAuth(user, token)

      if (user.role === 'super_admin') {
        router.push('/super-admin/tenants')
      } else {
        // tenant id از user میگیریم - slug رو باید از جای دیگه بگیریم
        router.push(`/${user.tenantSlug}/admin`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'خطا در ورود')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
            <span className="text-2xl">🍽️</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">ورود به سیستم</h1>
          <p className="mt-1 text-sm text-gray-500">پنل مدیریت رستوران</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="ایمیل"
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            id="password"
            label="رمز عبور"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            ورود
          </Button>
        </form>
      </div>
    </div>
  )
}