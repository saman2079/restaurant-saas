import { notFound } from 'next/navigation'

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

  try {

    const res = await fetch(
      `${baseUrl}/api/super/tenants/public/${slug}`,
      { cache: "no-store" }
    )
    const data = await res.json()


    if (!data.success || !data.data.isActive) {
      notFound()
    }
  } catch {
    notFound()
  }

  return <>{children}</>
}