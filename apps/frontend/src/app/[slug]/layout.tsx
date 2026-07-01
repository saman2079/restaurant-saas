import { notFound } from "next/navigation";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const baseUrl = process.env.INTERNAL_API_URL!;

  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL}/api/super/tenants/public/${slug}`,
      {
        cache: "no-store",
      },
    );
    const data = await res.json();

    if (!data.success || !data.data.isActive) {
      notFound();
    }
  } catch (error) {
    console.log(error);
    notFound();
  }

  return <>{children}</>;
}
