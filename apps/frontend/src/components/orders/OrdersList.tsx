"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import OrderedCard from "./OrderedCard";
import { useCartStore } from "@/store/cart-store";
import { useParams } from "next/navigation";
import { orderApi } from "@/lib/api/order.api";

interface Props {
  onSubmitted: (order: any) => void;
}

export default function OrdersList({ onSubmitted }: Props) {
  const { slug } = useParams();
  console.log(slug);

  const { items, increase, decrease } = useCartStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptOrder = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);

    try {
      const tableId = localStorage.getItem("tableId");
      const sessionId = localStorage.getItem("sessionId");

      // const res = await fetch(`/api/orders`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     customerName: "Guest",
      //     customerPhone: "0000000000",
      //     tableId: tableId ? parseInt(tableId) : null,
      //     sessionId,
      //     items: items.map((item) => ({
      //       menuItem: item._id,
      //       quantity: item.quantity,
      //     })),
      //   }),
      // });

      const payload = {
        
      }

      const res = orderApi.create(slug,pa)

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "خطا در ثبت سفارش");

      onSubmitted(result.order);
    } catch (error) {
      console.error(error);
      alert("ثبت سفارش انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }

  };

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const serviceFee = items.length > 0 ? 70000 : 0;
  const total = itemsTotal + serviceFee;

  return (
    <div className="w-full">
      <h1 className="text-center text-[22px] font-bold text-[#1E1E1E] mb-6">
        سفارش من
      </h1>

      <div className="bg-[#1E1E1E] text-white rounded-[12px] py-3 text-center mb-4">
        <p className="text-[13px]">میز شما</p>
        <p className="text-[18px] font-bold">
          {typeof window !== "undefined"
            ? localStorage.getItem("tableId") || "12"
            : "12"}
        </p>
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
          <p className="text-center text-[#666] mt-10">
            سبد سفارش شما خالی است.
          </p>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-6 text-[14px] text-[#555] space-y-3 px-1">
            <div className="flex justify-between">
              <span>جمع سفارشات</span>
              <span>{itemsTotal.toLocaleString()} تومان</span>
            </div>

            <div className="flex justify-between">
              <span>هزینه سرویس</span>
              <span>{serviceFee.toLocaleString()} تومان</span>
            </div>

            <div className="flex justify-between font-bold text-[16px] text-[#1E1E1E] pt-2">
              <span>مجموع کل</span>
              <span>{total.toLocaleString()} تومان</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleAcceptOrder}
              disabled={isSubmitting}
              className="w-full h-[52px] rounded-[14px] bg-[#1E1E1E] text-white font-bold text-[16px] disabled:opacity-50"
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت سفارش"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
