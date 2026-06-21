"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { orderApi } from "@/lib/api/order.api";

interface Props {
  orderId: string;
  slug: string;
  onDone: () => void;
}

const STATUS_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pending:   { label: "در انتظار تایید",   icon: "⏳", color: "#B45309", bg: "#FEF3C7" },
  confirmed: { label: "تایید شد",          icon: "✅", color: "#1D4ED8", bg: "#DBEAFE" },
  preparing: { label: "در حال آماده‌سازی", icon: "👨‍🍳", color: "#C2410C", bg: "#FFEDD5" },
  ready:     { label: "آماده تحویل",       icon: "🍽️", color: "#15803D", bg: "#DCFCE7" },
  delivered: { label: "تحویل داده شد",     icon: "🎉", color: "#166534", bg: "#DCFCE7" },
  cancelled: { label: "لغو شد",            icon: "❌", color: "#B91C1C", bg: "#FEE2E2" },
};

export default function Invoice({ orderId, slug, onDone }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // گرفتن سفارش از API
  useEffect(() => {
    orderApi.getByIdPublic(slug, orderId)
      .then((data) => {
        setOrder(data);
        setStatus(data.status);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [orderId, slug]);

  // Socket
  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      { transports: ["websocket", "polling"] }
    );
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join-order", orderId));

    socket.on("order-status-changed", (data: any) => {
      if (data.orderId !== orderId) return;
      setStatus(data.status);
      if (data.rejectionReason) setRejectionReason(data.rejectionReason);

      // وقتی تموم شد یا لغو شد - orderId پاک میشه
      // ولی روی صفحه هنوز نشون میده - صفحه عوض کردن باعث میشه برگرده به cart
      if (data.status === "delivered" || data.status === "cancelled") {
        localStorage.removeItem(`current-order-${slug}`);
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [orderId, slug]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
    </div>
  );

  if (!order) return (
    <div className="text-center mt-10 text-[#666]">سفارش پیدا نشد</div>
  );

  const info = STATUS_INFO[status] || STATUS_INFO.pending;
  const total = order.items?.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal || 0), 0
  ) || Number(order.totalAmount) || 0;

  const isDone = status === "delivered" || status === "cancelled";

  return (
    <div className="w-full flex flex-col items-center pt-2" dir="rtl">
      <h1 className="text-[22px] font-bold text-[#1E1E1E] mb-5 text-center">
        سفارش شما ثبت شد!
      </h1>

      {/* وضعیت */}
      <div
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 text-[14px] font-medium"
        style={{ backgroundColor: info.bg, color: info.color }}
      >
        <span className="text-lg">{info.icon}</span>
        <span>{info.label}</span>
      </div>

      {/* دلیل لغو */}
      {status === "cancelled" && rejectionReason && (
        <div className="w-full bg-red-50 border border-red-200 rounded-[12px] p-3 mb-4 text-center">
          <p className="text-sm text-red-600">{rejectionReason}</p>
        </div>
      )}

      {/* تصویر */}
      <div className="w-[200px] h-[200px] rounded-full border-2 border-[#A3A3A3] flex items-center justify-center mb-6">
        <div className="w-[160px] h-[160px] rounded-full border border-[#BDBDBD] flex items-center justify-center">
          <Image src="/imge/order.png" width={70} height={70} alt="order" className="opacity-70" />
        </div>
      </div>

      {/* آیتم‌ها */}
      {order.items?.length > 0 && (
        <div className="w-full bg-white rounded-[16px] border border-[#E0E0E0] px-4 py-4 mb-4 space-y-2">
          <p className="text-[13px] text-[#888] mb-2 text-center">جزئیات سفارش</p>
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-[14px]">
              <span className="text-[#3C3C3C]">{item.quantity}× {item.name}</span>
              <span className="text-[#1E1E1E] font-medium">
                {Number(item.subtotal || 0).toLocaleString()} تومان
              </span>
            </div>
          ))}
          <div className="border-t border-[#E0E0E0] pt-2 flex justify-between font-bold text-[15px]">
            <span>جمع کل</span>
            <span style={{ color: "#8B6B4A" }}>{total.toLocaleString()} تومان</span>
          </div>
        </div>
      )}

      {/* زمان آماده‌سازی */}
      {!isDone && (
        <div className="w-full bg-[#FDFBF7] border border-[#D5D1C8] rounded-[16px] px-6 py-5 text-center mb-6">
          <p className="text-[14px] text-[#3C3C3C] mb-1">زمان تقریبی آماده‌سازی</p>
          <p className="text-[28px] font-bold" style={{ color: "#8B6B4A" }}>15-20 دقیقه</p>
        </div>
      )}

      {/* دکمه سفارش جدید - فقط وقتی تموم شده نشون بده */}
      {isDone && (
        <button
          onClick={onDone}
          className="w-full h-[52px] rounded-[14px] bg-[#1E1E1E] text-white font-bold text-[16px] active:scale-95 transition-transform"
        >
          {status === "cancelled" ? "سفارش مجدد" : "سفارش جدید"}
        </button>
      )}
    </div>
  );
}