"use client";

import { useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth.store";
import { cn } from "@/lib/utils";

type Plan = "basic" | "pro" | "business";

const ALL_NAV_ITEMS = [
  {
    href: `admin`,
    label: "داشبورد",
    icon: "📊",
    exact: true,
    roles: ["owner", "manager", "waiter", "chef", "cashier", "super_admin"],
  },
  {
    href: `admin/cashier`,
    label: "صندوق",
    icon: "💳",
    roles: ["owner", "cashier"],
    plans: ["pro", "business"],
  },
  {
    href: `admin/orders`,
    label: "سفارشات",
    icon: "📋",
    roles: ["owner", "manager", "waiter", "chef"],
  },
  {
    href: `admin/menu`,
    label: "منو",
    icon: "🍽️",
    roles: ["owner", "manager"],
  },
  {
    href: `admin/staff`,
    label: "کارمندان",
    icon: "👥",
    roles: ["owner"],
  },
  {
    href: `admin/tables`,
    label: "QR Code میزها",
    icon: "📱",
    roles: ["owner", "manager"],
  },
  {
    href: `admin/analytics`,
    label: "آمار",
    icon: "📈",
    roles: ["owner", "manager"],
    plans: ["pro", "business"],
  },
  {
    href: `admin/profile`,
    label: "پروفایل من",
    icon: "👤",
    roles: ["owner", "manager", "waiter", "chef", "cashier"],
  },
];

const roleLabels: Record<string, string> = {
  owner: "مالک",
  manager: "مدیر",
  waiter: "گارسون",
  chef: "آشپز",
  cashier: "صندوقدار",
  super_admin: "سوپر ادمین",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { slug } = useParams<{ slug: string }>();

  const { user, token, clearAuth, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!token || !user) {
      router.push("/login");
      return;
    }

    const allowed = [
      "owner",
      "manager",
      "waiter",
      "chef",
      "cashier",
      "super_admin",
    ];

    if (!allowed.includes(user.role)) {
      router.push("/login");
    }
  }, [_hasHydrated, token, user, router]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || !token) return null;

  const userPlan = (user as any).plan as Plan | undefined;

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    const roleAllowed = item.roles.includes(user.role);

    const planAllowed =
      !(item as any).plans ||
      (item as any).plans.includes(userPlan);

    return roleAllowed && planAllowed;
  }).map((item) => ({
    ...item,
    href: `/${slug}/${item.href}`,
  }));

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      <aside className="flex h-screen w-56 flex-col border-l border-gray-100 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm">
            🍽️
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {slug}
            </p>

            <p className="text-xs text-gray-400">
              {roleLabels[user.role] || user.role}
            </p>

            {userPlan && (
              <p className="text-[10px] text-orange-500 mt-1">
                {userPlan.toUpperCase()}
              </p>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-orange-50 text-orange-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-2 space-y-0.5">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <span>👁️</span>
            مشاهده منو
          </Link>

          <button
            onClick={() => {
              clearAuth();
              router.push("/login");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span>
            خروج
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}