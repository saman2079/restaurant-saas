"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";

export interface Message {
  role: "user" | "assistant";
  content: string;
  menuCards?: any[];
}

function ChatClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("table")
    ? parseInt(searchParams.get("table")!)
    : null;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);

  // لود همه چیز از localStorage یه بار
  useEffect(() => {
    const storedSessionId = localStorage.getItem(`sessionId-${slug}`);
    const storedMessages = localStorage.getItem(`messages-${slug}`);

    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(`sessionId-${slug}`, newSessionId);
      setSessionId(newSessionId);
    }

    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch {}
    }

    // شماره میز رو ذخیره کن
    if (tableNumber) {
      localStorage.setItem(`tableNumber-${slug}`, String(tableNumber));
    }

    setMounted(true);
  }, [slug]);

  // جایگزین قسمت session useEffect کن
  useEffect(() => {
    // اول از cookie چک کن
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const setCookie = (name: string, value: string, days = 30) => {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    };

    // sessionId از cookie - ماندگار میمونه
    let storedSessionId = getCookie(`sessionId-${slug}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setCookie(`sessionId-${slug}`, newSessionId);
      localStorage.setItem(`sessionId-${slug}`, newSessionId);
      setSessionId(newSessionId);
    }

    // پیام‌ها از localStorage
    const storedMessages = localStorage.getItem(`messages-${slug}`);
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch {}
    }

    if (tableNumber) {
      localStorage.setItem(`tableNumber-${slug}`, String(tableNumber));
    }

    setMounted(true);
  }, [slug]);

  // ذخیره پیام‌ها
  useEffect(() => {
    if (!mounted) return;
    if (messages.length > 0) {
      localStorage.setItem(`messages-${slug}`, JSON.stringify(messages));
    }
  }, [messages, slug, mounted]);

  // Socket
  useEffect(() => {
    if (!mounted) return;
    const orderId = localStorage.getItem(`current-order-${slug}`);

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      { transports: ["websocket", "polling"] },
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      if (orderId) {
        socket.emit("join-order", orderId);
      }
    });

    socket.on("order-status-changed", (data: any) => {
      const currentOrderId = localStorage.getItem(`current-order-${slug}`);
      if (data.orderId !== currentOrderId) return;

      let aiMsg = "";

      if (data.status === "cancelled") {
        aiMsg = `متأسفانه سفارش شما لغو شد 😔${data.rejectionReason ? `\nدلیل: ${data.rejectionReason}` : ""}\nاگر مایل هستید سفارش جدیدی ثبت کنید خوشحال میشم کمک کنم.`;
      } else if (data.status === "confirmed") {
        aiMsg = "سفارش شما تایید شد و در حال آماده‌سازی است 🎉";
      } else if (data.status === "preparing") {
        aiMsg = "سفارش شما در حال آماده شدن است 👨‍🍳";
      } else if (data.status === "ready") {
        aiMsg = "سفارش شما آماده است، لطفاً دریافت کنید 🍽️";
      } else if (data.status === "delivered") {
        aiMsg = "نوش جان! امیدوارم از سفارشتون لذت ببرید 😊";
        localStorage.removeItem(`current-order-${slug}`);
      }

      if (aiMsg) {
        setMessages((prev) => {
          const updated = [
            ...prev,
            { role: "assistant" as const, content: aiMsg },
          ];
          localStorage.setItem(`messages-${slug}`, JSON.stringify(updated));
          return updated;
        });
      }
    });

    socket.on("disconnect", () => {});

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [slug, mounted]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || loading) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    setMessage("");
    setLoading(true);

    // شماره میز از URL یا localStorage
    const currentTableNumber =
      tableNumber ||
      parseInt(localStorage.getItem(`tableNumber-${slug}`) || "0") ||
      undefined;
    const sessionToken =
      localStorage.getItem(`tableSession-${slug}`) || undefined;

    try {
      const res = await fetch(
        `http://${window.location.hostname}:4000/api/${slug}/ai/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            sessionId,
            tableNumber: currentTableNumber,
            sessionToken,
          }),
        },
      );

      const data = await res.json();

      const aiMessage: Message = {
        role: "assistant",
        content: data.data.message || "پاسخی دریافت نشد",
        menuCards: data.data.menuCards || [],
      };

      if (data.data.activeOrder) {
        setActiveOrder(data.data.activeOrder);
      }

      if (data.data.orderSubmitted && data.data.orderId) {
        localStorage.setItem(`current-order-${slug}`, data.data.orderId);
        socketRef.current?.emit("join-order", data.data.orderId);
        setActiveOrder({ id: data.data.orderId, status: "pending" });
      }

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "خطا در ارتباط با سرور" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [message, loading, sessionId, slug, tableNumber]);

  const clearChat = () => {
    localStorage.removeItem(`messages-${slug}`);
    localStorage.removeItem(`sessionId-${slug}`);
    localStorage.removeItem(`current-order-${slug}`);
    setMessages([]);
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(`sessionId-${slug}`, newSessionId);
    setSessionId(newSessionId);
  };

  // تا localStorage لود نشده، چیزی نشون نده
  if (!mounted)
    return (
      <div className="bg-[#E4E4E4] flex items-center justify-center h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </div>
    );

  return (
    <div className="bg-[#E4E4E4] flex flex-col gap-2 text-[16px] text-[#201F20] h-screen overflow-hidden">
      <ChatHeader />
      <ChatMessages messages={messages} loading={loading} />
      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        loading={loading}
      />
    </div>
  );
}

export default ChatClient;
