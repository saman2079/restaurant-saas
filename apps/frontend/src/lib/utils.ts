import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string | number, currency = 'تومان') {
  return `${Number(price).toLocaleString('fa-IR')} ${currency}`
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'در انتظار',
    confirmed: 'تأیید شده',
    preparing: 'در حال آماده‌سازی',
    ready: 'آماده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
  }
  return labels[status] ?? status
}

export function getOrderStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
    delivered: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}