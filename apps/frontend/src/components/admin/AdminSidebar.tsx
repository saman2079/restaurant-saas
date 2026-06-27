"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plan } from "@/types";

type Props = {
  slug: string;
  pathname: string;
  user: any;
  userPlan?: Plan;
  clearAuth: () => void;
  router: any;
};

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

export default function AdminSidebar({
  slug,
  pathname,
  user,
  userPlan,
  clearAuth,
  router,
}: Props) {
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    const roleAllowed = item.roles.includes(user.role);

    const planAllowed =
      !(item as any).plans || (item as any).plans.includes(userPlan);

    return roleAllowed && planAllowed;
  }).map((item) => ({
    ...item,
    href: `/${slug}/${item.href}`,
  }));

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className="flex h-screen w-56 flex-col border-l border-gray-100 shadow-md
 bg-[#f6f7fb]"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-sm">
          🍽️
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{slug}</p>

          <p className="text-xs text-gray-400">
            {roleLabels[user.role] || user.role}
          </p>

          {userPlan && (
            <p className="text-[10px] text-[#2563eb] mt-1">
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
                ? "bg-orange-50 text-[#2563eb] font-medium"
                : " hover:bg-orange-50",
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
  );
}
