"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { AppErrorBoundary } from "@/components/ui/error-boundary";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface TableSummary {
  tableNumber: number;
  orderCount: number;
  totalAmount: number;
  status: string;
  orders: any[];
}

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "bg-red-100 text-red-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "در انتظار پرداخت",
  confirmed: "پرداخت شده",
  pending: "در انتظار تایید",
  preparing: "در حال آماده سازی",
  ready: "آماده تحویل",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

function ReceiptModal({
  tableNumber,
  slug,
  onClose,
  onConfirmClose,
}: {
  tableNumber: number;
  slug: string;
  onClose: () => void;
  onConfirmClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["table-detail", slug, tableNumber],
    queryFn: () =>
      apiClient
        .get(`/${slug}/cashier/tables/${tableNumber}`)
        .then((r) => r.data.data),
  });
  const qc = useQueryClient();

  const handlePrint = () => window.print();

  const payMutation = useMutation({
    mutationFn: (tableNumber: number) =>
      apiClient
        .post(`/${slug}/cashier/tables/${tableNumber}/pay`)
        .then((r) => r.data),

    onSuccess: (_, tableNumber) => {
      qc.invalidateQueries({ queryKey: ["cashier-tables", slug] });
      qc.invalidateQueries({ queryKey: ["table-detail", slug, tableNumber] });

      toast.success("پرداخت انجام شد");
    },

    onError: () => toast.error("خطا در پرداخت"),
  });

  if (isLoading)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* فاکتور */}
        <div className="p-5 print:p-0" id="receipt">
          <div className="text-center mb-4">
            <h2 className="text-base font-bold">فاکتور رستوران</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              میز {tableNumber} | {new Date().toLocaleString("fa-IR")}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-200 py-3 space-y-1.5">
            {data?.itemsSummary?.map((item: any) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 mt-1">
            <div className="flex justify-between font-bold">
              <span>جمع کل</span>
              <span className="text-orange-500">
                {formatPrice(data?.totalAmount)}
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            ممنون از حضور شما 🙏
          </p>
        </div>

        <div className="border-t border-gray-100 p-4 flex gap-2 print:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="flex-1"
          >
            🖨️ پرینت
          </Button>
          {data?.orders?.some((o: any) => o.paymentStatus === "pending") ? (
            <Button
              size="sm"
              onClick={() => payMutation.mutate(tableNumber)}
              className="flex-1"
            >
              💳 دریافت وجه
            </Button>
          ) : (
            <Button size="sm" onClick={onConfirmClose} className="flex-1">
              ✅ بستن میز
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CashierPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["cashier-tables", slug],
    queryFn: () =>
      apiClient.get(`/${slug}/cashier/tables`).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const closeMutation = useMutation({
    mutationFn: (tableNumber: number) =>
      apiClient
        .post(`/${slug}/cashier/tables/${tableNumber}/close`)
        .then((r) => r.data),
    onSuccess: (_, tableNumber) => {
      qc.invalidateQueries({ queryKey: ["cashier-tables", slug] });
      setSelectedTable(null);
      toast.success(`میز ${tableNumber} بسته شد ✅`);
    },
    onError: () => toast.error("خطا در بستن میز"),
  });

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">صندوق</h1>
          <span className="text-sm text-gray-500">
            {tables.length} میز فعال
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💳</p>
            <p className="text-sm">هیچ میز فعالی وجود ندارد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tables.map((table: TableSummary) => (
              <div
                key={table.tableNumber}
                className="bg-white rounded-xl border border-gray-100 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-900">
                    میز {table.tableNumber}
                  </h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[table.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_LABELS[table.status] || table.status}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500">
                    {table.orderCount} سفارش
                  </p>
                  <p className="text-base font-bold text-orange-500">
                    {formatPrice(table.totalAmount)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTable(table.tableNumber)}
                  className="w-full text-xs bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {table.orders.some((o) => o.paymentStatus === "pending")
                    ? "💳 دریافت وجه"
                    : "🧾 مشاهده"}{" "}
                  {table.status === "awaiting_payment"
                    ? "💳 دریافت وجه"
                    : table.status === "confirmed"
                      ? "🧾 صدور فاکتور"
                      : "مشاهده فاکتور"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTable !== null && (
        <ReceiptModal
          tableNumber={selectedTable}
          slug={slug}
          onClose={() => setSelectedTable(null)}
          onConfirmClose={() => closeMutation.mutate(selectedTable)}
        />
      )}
    </AppErrorBoundary>
  );
}
