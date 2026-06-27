'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { AppErrorBoundary } from '@/components/ui/error-boundary'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالک',
  manager: 'مدیر',
  waiter: 'گارسون',
  chef: 'آشپز',
  cashier: 'صندوقدار',
  super_admin: 'سوپر ادمین',
}

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore()
  const [form, setForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, avatar: user.avatar || '' })
    }
  }, [user])

  const profileMutation = useMutation({
    mutationFn: (data: any) => apiClient.patch('/profile', data).then(r => r.data),
    onSuccess: (res) => {
      setAuth({ ...user!, ...res.data }, token!)
      toast.success('پروفایل بروز شد')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'خطا'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: any) => apiClient.patch('/profile', data).then(r => r.data),
    onSuccess: () => {
      toast.success('رمز عبور تغییر کرد')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'خطا'),
  })

  const handleProfileSave = () => {
    if (!form.name.trim()) return toast.error('نام نمیتونه خالی باشه')
    profileMutation.mutate({ name: form.name, avatar: form.avatar })
  }

  const handlePasswordSave = () => {
    if (!passwordForm.currentPassword) return toast.error('رمز فعلی رو وارد کن')
    if (passwordForm.newPassword.length < 6) return toast.error('رمز جدید باید حداقل ۶ کاراکتر باشه')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('رمز جدید با تکرارش فرق داره')

    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
  }

  return (
    <AppErrorBoundary>
      <div className="p-6 max-w-lg space-y-6" dir="rtl">
        <h1 className="text-lg font-medium text-gray-900">پروفایل من</h1>

        {/* اطلاعات اصلی */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-900">اطلاعات شخصی</h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {form.avatar ? (
                <img src={form.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-orange-600">
                  {user?.name?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                {ROLE_LABELS[user?.role || ''] || user?.role}
              </span>
            </div>
          </div>

          <ImageUpload
            label="عکس پروفایل"
            value={form.avatar}
            onChange={(url) => setForm(p => ({ ...p, avatar: url }))}
          />

          <Input
            label="نام"
            value={form.name}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
          />

          <Input
            label="ایمیل"
            value={user?.email || ''}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />

          <Button
            onClick={handleProfileSave}
            isLoading={profileMutation.isPending}
            className="w-full"
          >
            ذخیره تغییرات
          </Button>
        </div>

        {/* تغییر رمز عبور */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-900">تغییر رمز عبور</h2>

          <Input
            label="رمز عبور فعلی"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
            placeholder="••••••••"
          />

          <Input
            label="رمز عبور جدید"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="••••••••"
          />

          <Input
            label="تکرار رمز عبور جدید"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="••••••••"
          />

          <Button
            onClick={handlePasswordSave}
            isLoading={passwordMutation.isPending}
            className="w-full"
            variant="secondary"
          >
            تغییر رمز عبور
          </Button>
        </div>
      </div>
    </AppErrorBoundary>
  )
}