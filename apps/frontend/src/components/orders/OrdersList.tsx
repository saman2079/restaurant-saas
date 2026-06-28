"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import OrderedCard from "./OrderedCard";
import { useCartStore } from "@/store/cart-store";
import { useParams, useSearchParams } from "next/navigation";
import { orderApi } from "@/lib/api/order.api";

interface Props {
  onOrderPlaced: (orderId: string) => void;
}

export default function OrdersList({ onOrderPlaced }: Props) {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();

  const [tableNumber, setTableNumber] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("table");
    if (fromUrl) {
      const num = parseInt(fromUrl);
      setTableNumber(num);
      localStorage.setItem(`tableNumber-${slug}`, String(num));

      // ✅ اینجا session بگیر
      fetch(`/api/${slug}/tables/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: num }),
      })
        .then((r) => r.json())
        .then(({ data }) => {
          console.log(data.sessionToken);
          if (data.sessionToken) {
            localStorage.setItem(`tableSession-${slug}`, data.sessionToken);
          }
        });
    } else {
      const fromStorage = localStorage.getItem(`tableNumber-${slug}`);
      if (fromStorage) setTableNumber(parseInt(fromStorage));
    }
  }, [slug, searchParams]);

  const { items, increase, decrease, removeFromCart, clearCart } =
    useCartStore();

  const handleSubmit = async () => {
    if (items.length === 0) return;

    const sessionToken = localStorage.getItem(`tableSession-${slug}`);

    // اگه tableNumber داره ولی session نداره
    // if (tableNumber && !sessionToken) {
    //   alert("لطفاً QR کد میز را دوباره اسکن کنید");
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const order = await orderApi.create(slug, {
        tableNumber,
        sessionToken: sessionToken || undefined,
        items: items.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      onOrderPlaced(order.id);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "";

      if (msg.startsWith("TABLE_HAS_ACTIVE_ORDER:")) {
        const existingOrderId = msg.replace("TABLE_HAS_ACTIVE_ORDER:", "");
        clearCart();
        onOrderPlaced(existingOrderId);
      } else if (
        msg.startsWith("SESSION_INVALID") ||
        msg.startsWith("sessionToken")
      ) {
        localStorage.removeItem(`tableSession-${slug}`);
        alert("جلسه منقضی شده. QR کد میز را دوباره اسکن کنید");
      } else {
        alert(msg || "ثبت سفارش انجام نشد");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const serviceFee = items.length > 0 ? 70000 : 0;
  const total = itemsTotal;

  return (
    <div className="w-full" dir="rtl">
      <h1 className="text-center text-[22px] font-bold text-[#1E1E1E] mb-6">
        سفارش من
      </h1>

      <div className="bg-[#1E1E1E] text-white rounded-[12px] py-3 text-center mb-4">
        <p className="text-[13px]">میز شما</p>
        <p className="text-[18px] font-bold">{tableNumber || "-"}</p>
      </div>

      <div className="flex flex-col gap-3">
        {items.length > 0 ? (
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <OrderedCard
                  item={item}
                  onIncrease={() => increase(item._id)}
                  onDecrease={() => {
                    if (item.quantity <= 1) removeFromCart(item._id);
                    else decrease(item._id);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center mt-16">
            <p className="text-[40px] mb-3">🛒</p>
            <p className="text-[#666] text-[15px]">سبد سفارش شما خالی است</p>
            <p className="text-[#999] text-[13px] mt-1">
              از منو آیتم اضافه کنید
            </p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-6 bg-white rounded-[16px] border border-[#E8E8E8] px-4 py-4 space-y-3 text-[14px] text-[#555]">
            <div className="flex justify-between">
              <span>جمع سفارشات</span>
              <span>{itemsTotal.toLocaleString()} تومان</span>
            </div>
            <div className="flex justify-between">
              <span>هزینه سرویس</span>
              <span>{serviceFee.toLocaleString()} تومان</span>
            </div>
            <div className="flex justify-between font-bold text-[16px] text-[#1E1E1E] pt-2 border-t border-[#E8E8E8]">
              <span>مجموع کل</span>
              <span>{total.toLocaleString()} تومان</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-[52px] rounded-[14px] bg-[#1E1E1E] text-white font-bold text-[16px] disabled:opacity-50 active:scale-95 transition-transform"
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت سفارش"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
