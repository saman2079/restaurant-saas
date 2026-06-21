"use client";

import { useState, useEffect } from "react";
import Invoice from "./Invoice";
import OrdersList from "./OrdersList";
import { useParams } from "next/navigation";

export default function OrdersClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedOrderId = localStorage.getItem(`current-order-${slug}`);
    if (savedOrderId) setOrderId(savedOrderId);
    setMounted(true);
  }, [slug]);

  const handleOrderPlaced = (id: string) => {
    localStorage.setItem(`current-order-${slug}`, id);
    setOrderId(id);
  };

  // وقتی سفارش تموم شد یا لغو شد - فقط orderId رو پاک کن
  // صفحه بعدی که اومدن اینجا، cart خالی میبینن
  const handleOrderDone = () => {
    localStorage.removeItem(`current-order-${slug}`);
    setOrderId(null);
  };

  if (!mounted) return (
    <div className="flex items-center justify-center h-40">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
    </div>
  );

  if (orderId) {
    return <Invoice orderId={orderId} slug={slug} onDone={handleOrderDone} />;
  }

  return <OrdersList onOrderPlaced={handleOrderPlaced} />;
}