"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Plan = "basic" | "pro" | "business" ;

const allowedRoles = [
  "owner",
  "manager",
  "waiter",
  "chef",
  "cashier",
  "super_admin",
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { slug } = useParams<{ slug: string }>();

  const { user, token, clearAuth, _hasHydrated } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!token || !user) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(user.role as any)) {
      router.push("/login");
    }
  }, [_hasHydrated, token, user, router]);

  const userPlan = user?.plan as Plan | undefined;

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || !token) return null;

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* موبایل overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static z-50 h-full transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
      >
        <AdminSidebar
          slug={slug}
          pathname={pathname}
          user={user}
          userPlan={userPlan}
          clearAuth={clearAuth}
          router={router}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* topbar فقط موبایل */}
        <div className="lg:hidden flex items-center justify-between p-3 bg-[#f6f7fb] border-b">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl">
            ☰
          </button>

          <div className="text-sm font-medium">{slug}</div>
        </div>

        <main className="flex-1 overflow-auto bg-[#f6f7fb]">{children}</main>
      </div>
    </div>
  );
}
