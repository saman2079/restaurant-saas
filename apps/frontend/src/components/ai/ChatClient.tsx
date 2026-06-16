"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { io, Socket } from "socket.io-client";

export interface Message {
  role: "user" | "assistant";
  content: string;
  menuCards?: any[];
}

function ChatClient({ slug }: { slug: string }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // لود session و پیام‌های قبلی از localStorage
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
  }, [slug]);

  // ذخیره پیام‌ها
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`messages-${slug}`, JSON.stringify(messages));
    }
  }, [messages, slug]);

  // Socket - یه بار وصل میشه
  useEffect(() => {
    const orderId = localStorage.getItem(`current-order-${slug}`);

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      { transports: ["websocket", "polling"] }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket متصل شد");
      if (orderId) {
        socket.emit("join-order", orderId);
        console.log("join-order:", orderId);
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
          const updated = [...prev, { role: "assistant" as const, content: aiMsg }];
          localStorage.setItem(`messages-${slug}`, JSON.stringify(updated));
          return updated;
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket قطع شد");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [slug]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || loading) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000"}/api/${slug}/ai/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, sessionId, tableNumber: 1 }),
        }
      );

      const data = await res.json();

      const aiMessage: Message = {
        role: "assistant",
        content: data.data.message || "پاسخی دریافت نشد",
        menuCards: data.data.menuCards || [],
      };

      // اگه سفارش ثبت شد، join-order بزن
      if (data.data.orderSubmitted && data.data.orderId) {
        localStorage.setItem(`current-order-${slug}`, data.data.orderId);
        socketRef.current?.emit("join-order", data.data.orderId);
        console.log("join-order after submit:", data.data.orderId);
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
  }, [message, loading, sessionId, slug]);

  const clearChat = () => {
    localStorage.removeItem(`messages-${slug}`);
    localStorage.removeItem(`sessionId-${slug}`);
    localStorage.removeItem(`current-order-${slug}`);
    setMessages([]);
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(`sessionId-${slug}`, newSessionId);
    setSessionId(newSessionId);
  };

  return (
    <div className="bg-[#E4E4E4] flex flex-col gap-2 text-[16px] text-[#201F20] h-screen overflow-hidden">
      <ChatHeader  />
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