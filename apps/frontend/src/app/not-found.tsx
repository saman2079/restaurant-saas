import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-6xl">🍽️</p>
      <h1 className="text-xl font-medium text-gray-800">رستوران پیدا نشد</h1>
      <p className="text-gray-500 text-sm">این آدرس وجود نداره یا غیرفعاله</p>
      <Link href="/login" className="text-orange-500 text-sm underline">
        برگشت به صفحه اصلی
      </Link>
    </div>
  )
}