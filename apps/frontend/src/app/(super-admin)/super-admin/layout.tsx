import { SuperAdminGuard } from "@/src/components/layout/super-admin-guard";
import { SuperAdminSidebar } from "@/src/components/layout/super-admin-sidebar";


export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminGuard>
      <div className="flex h-screen bg-gray-50" dir="rtl">
        <SuperAdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SuperAdminGuard>
  )
}