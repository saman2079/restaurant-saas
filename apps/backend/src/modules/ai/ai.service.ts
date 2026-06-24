import OpenAI from "openai";
import { env } from "../../config/env";
import { db } from "../../config/database";
import {
  menuItems, categories, orders, orderItems, aiConversations, tenants,
} from "../../db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { tablesService } from "../tables/tables.service";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL,
});

function normalizeText(text: string) {
  return (text || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function getRelevantMenuCards(userText: string, items: any[], categoriesList: any[]) {
  const text = normalizeText(userText);
  const showAllKeywords = ["منو", "menu", "همه", "کل منو", "لیست", "غذاها", "چی دارید", "چی دارین"];
  if (showAllKeywords.some((k) => text.includes(normalizeText(k)))) return items;

  const matchedCat = categoriesList.find((cat: any) => {
    const catName = normalizeText(cat.name);
    return text.includes(catName) || (catName.length > 1 && catName.includes(text));
  });
  if (matchedCat) return items.filter((item: any) => item.categoryId === matchedCat.id);

  return items.filter((item: any) => {
    const name = normalizeText(item.name);
    if (text.includes(name) || name.includes(text)) return true;
    return name.split(" ").filter((w: string) => w.length > 1).some((word: string) => text.includes(word));
  });
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
}

// وضعیت‌هایی که بعدشون فقط اضافه کردن مجازه
const CONFIRMED_STATUSES = ['confirmed', 'preparing', 'ready'];

export const aiService = {
  async chat(
    tenantId: string,
    sessionId: string,
    userMessage: string,
    tableNumber?: number,
    sessionToken?: string,
  ) {
    // ─── ۱. امنیت: بدون میز فقط منو نشون میده ───
    if (tableNumber) {
      if (!sessionToken) {
        return {
          message: "❌ برای سفارش دادن باید QR کد میز را اسکن کنید.",
          menuCards: [], cart: [], cartTotal: 0,
          orderSubmitted: false, orderId: null, conversationId: null,
        };
      }
      const isValid = await tablesService.validateSession(tenantId, tableNumber, sessionToken);
      if (!isValid) {
        return {
          message: "⏰ جلسه شما منقضی شده. لطفاً QR کد میز را دوباره اسکن کنید.",
          menuCards: [], cart: [], cartTotal: 0,
          orderSubmitted: false, orderId: null, conversationId: null,
        };
      }
    }

    // ─── ۲. گرفتن conversation ───
    let conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.tenantId, tenantId),
        eq(aiConversations.sessionId, sessionId),
      ),
    });

    const history: any[] = (conversation?.messages as any[]) || [];
    let cart: CartItem[] = (conversation as any)?.cart || [];

    // ─── ۳. گرفتن سفارش فعال میز (دستی یا AI) ───
    let activeOrderId: string | null = (conversation as any)?.orderId || null;
    let activeOrderStatus: string | null = null;
    let existingOrderItems: any[] = [];

    if (tableNumber) {
      // همیشه از دیتابیس چک کن - هم دستی هم AI
      const activeOrder = await db.query.orders.findFirst({
        where: and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          sql`${orders.status} NOT IN ('cancelled', 'delivered')`,
          isNull(orders.paidAt),
        ),
        with: { items: true },
      });

      if (activeOrder) {
        activeOrderId = activeOrder.id;
        activeOrderStatus = activeOrder.status;
        existingOrderItems = (activeOrder as any).items || [];
      } else {
        // سفارش قبلی تموم شده، cart رو پاک کن
        if (activeOrderId) {
          activeOrderId = null;
          cart = [];
          if (conversation) {
            await db.update(aiConversations)
              .set({ cart: [] as any, orderId: null } as any)
              .where(eq(aiConversations.id, conversation.id));
          }
        }
      }
    }

    const [menuItemsList, categoriesList, tenant] = await Promise.all([
      db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId)),
      db.select().from(categories).where(eq(categories.tenantId, tenantId)),
      db.select().from(tenants).where(eq(tenants.id, tenantId)).then((r) => r[0]),
    ]);

    const availableItems = menuItemsList.filter((i) => i.status === "available");
    const relevantItems = getRelevantMenuCards(userMessage, availableItems, categoriesList);
    const menuCards = relevantItems.map((item) => ({
      id: item.id, name: item.name, description: item.description || "",
      price: item.price, image: item.image || null,
      isPopular: item.isPopular, preparationTime: item.preparationTime, status: item.status,
    }));

    const menuContext = availableItems.map((item) => {
      const cat = categoriesList.find((c) => c.id === item.categoryId);
      return `- ${item.name} | ${Number(item.price).toLocaleString("fa-IR")} تومان | ID: ${item.id}` +
        `${cat ? ` | دسته: ${cat.name}` : ""}` +
        `${item.description ? ` | توضیح: ${item.description}` : ""}` +
        `${item.preparationTime ? ` | زمان: ${item.preparationTime} دقیقه` : ""}`;
    }).join("\n");

    const popularItems = availableItems.filter((i) => i.isPopular)
      .map((i) => `- ${i.name}`).join("\n") || "موردی ثبت نشده";

    // ─── وضعیت سفارش برای prompt ───
    const isConfirmed = activeOrderStatus && CONFIRMED_STATUSES.includes(activeOrderStatus);
    const existingItemsText = existingOrderItems.length > 0
      ? existingOrderItems.map((i: any) =>
          `- ${i.name} × ${i.quantity} = ${(Number(i.price) * i.quantity).toLocaleString("fa-IR")} تومان [ID: ${i.menuItemId}]`
        ).join("\n")
      : "ندارد";

    const cartText = cart.length > 0
      ? cart.map((c) => `- ${c.name} × ${c.quantity} = ${(Number(c.price) * c.quantity).toLocaleString("fa-IR")} تومان`).join("\n") +
        `\nجمع کل: ${cart.reduce((s, c) => s + Number(c.price) * c.quantity, 0).toLocaleString("fa-IR")} تومان`
      : "سبد خرید خالی است";

    const tableInfo = tableNumber
      ? `✅ شماره میز: ${tableNumber}\n` +
        (activeOrderId
          ? `📋 سفارش فعال موجود است (ID: ${activeOrderId}) - وضعیت: ${activeOrderStatus}\n` +
            `آیتم‌های ثبت شده:\n${existingItemsText}\n` +
            (isConfirmed
              ? `⚠️ سفارش تایید شده - فقط آیتم‌های جدید اضافه کن، حذف یا ویرایش تعداد مجاز نیست`
              : `✏️ سفارش pending است - میتوان ویرایش کرد`)
          : `📭 سفارش فعال ندارد`)
      : `⚠️ مشتری شماره میز ندارد - فقط منو نشون بده. سفارش ثبت نکن.`;

    const SYSTEM_PROMPT = `تو یک AI Restaurant Agent حرفه‌ای هستی برای رستوران "${tenant?.name || 'رستوران'}".

========================
وضعیت مشتری
===========
${tableInfo}

========================
قوانین امنیتی مهم
==================
1. ${!tableNumber ? '❌ این مشتری میز ندارد - اصلاً سفارش ثبت نکن، فقط منو نشون بده' : '✅ مشتری میز دارد'}
2. هرگز menuItemId جعلی نساز
3. فقط از آیتم‌های موجود در منو استفاده کن
4. ${isConfirmed ? '🔒 سفارش تایید شده - فقط action مجاز "add_items" است. از remove_items و update_quantity استفاده نکن' : '✏️ سفارش pending - همه actionها مجازند'}
5. قبل از checkout، خلاصه سفارش رو نشون بده و تاییدیه بگیر

========================
مدیریت سفارش
=============
افزودن آیتم:
\`\`\`order
{"action":"add_items","items":[{"menuItemId":"EXACT_ID","name":"نام دقیق","quantity":1}]}
\`\`\`

${!isConfirmed ? `حذف آیتم:
\`\`\`order
{"action":"remove_items","items":[{"menuItemId":"ID","name":"نام"}]}
\`\`\`

تغییر تعداد:
\`\`\`order
{"action":"update_quantity","items":[{"menuItemId":"ID","name":"نام","quantity":2}]}
\`\`\`
` : ''}
ثبت نهایی (فقط وقتی مشتری تایید کرد و سبد خالی نیست):
\`\`\`order
{"action":"checkout"}
\`\`\`

========================
منوی رستوران
============
${menuContext}

محبوب‌ترین: ${popularItems}

سبد AI فعلی: ${cartText}`;

    history.push({ role: "user", content: userMessage });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });

    const aiMessage = response.choices[0]?.message?.content || "";
    history.push({ role: "assistant", content: aiMessage });

    const orderMatch = aiMessage.match(/```order\n([\s\S]*?)\n```/);
    let orderAction: any = null;
    if (orderMatch) {
      try { orderAction = JSON.parse(orderMatch[1]); } catch {}
    }

    let newCart = [...cart];
    let orderSubmitted = false;
    let orderId: string | null = activeOrderId;

    if (orderAction && tableNumber) {
      // اگه سفارش تایید شده، فقط add_items مجازه
      if (isConfirmed && orderAction.action !== 'add_items' && orderAction.action !== 'checkout') {
        console.warn(`⚠️ AI tried ${orderAction.action} on confirmed order - blocked`);
        orderAction = null;
      }

      if (orderAction) {
        switch (orderAction.action) {
          case "add_items": {
            for (const item of orderAction.items || []) {
              const menuItem = availableItems.find((m) => m.id === item.menuItemId);
              if (!menuItem) continue;

              // اگه سفارش confirm شده، آیتم‌های تکراری رو نمیتونیم اضافه کنیم
              if (isConfirmed) {
                const alreadyInOrder = existingOrderItems.some((i: any) => i.menuItemId === item.menuItemId);
                if (alreadyInOrder) continue; // skip - نمیشه تعداد تغییر داد
              }

              const existing = newCart.find((c) => c.menuItemId === item.menuItemId);
              if (existing) {
                existing.quantity += item.quantity || 1;
              } else {
                newCart.push({
                  menuItemId: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: item.quantity || 1,
                });
              }
            }
            break;
          }
          case "remove_items": {
            const removeIds = (orderAction.items || []).map((i: any) => i.menuItemId);
            newCart = newCart.filter((c) => !removeIds.includes(c.menuItemId));
            break;
          }
          case "update_quantity": {
            for (const item of orderAction.items || []) {
              const existing = newCart.find((c) => c.menuItemId === item.menuItemId);
              if (existing) existing.quantity = item.quantity;
            }
            newCart = newCart.filter((c) => c.quantity > 0);
            break;
          }
          case "checkout": {
            if (newCart.length === 0) break;

            try {
              if (activeOrderId) {
                // ─── آپدیت سفارش موجود ───
                if (isConfirmed) {
                  // فقط آیتم‌های جدید اضافه کن
                  const existingIds = new Set(existingOrderItems.map((i: any) => i.menuItemId));
                  const newOnlyItems = newCart.filter(c => !existingIds.has(c.menuItemId));

                  if (newOnlyItems.length > 0) {
                    let extraTotal = 0;
                    const newItemsData = newOnlyItems.map(c => {
                      const sub = Number(c.price) * c.quantity;
                      extraTotal += sub;
                      return {
                        orderId: activeOrderId!,
                        menuItemId: c.menuItemId,
                        name: c.name,
                        price: c.price,
                        quantity: c.quantity,
                        subtotal: sub.toString(),
                      };
                    });
                    await db.insert(orderItems).values(newItemsData);

                    const currentOrder = await db.query.orders.findFirst({
                      where: eq(orders.id, activeOrderId),
                    });
                    const newTotal = Number(currentOrder?.totalAmount || 0) + extraTotal;
                    await db.update(orders)
                      .set({ totalAmount: newTotal.toString(), updatedAt: new Date() })
                      .where(eq(orders.id, activeOrderId));
                  }
                } else {
                  // pending - همه چیز replace میشه
                  await db.delete(orderItems).where(eq(orderItems.orderId, activeOrderId));
                  const totalAmount = newCart.reduce((s, c) => s + Number(c.price) * c.quantity, 0);
                  await db.insert(orderItems).values(
                    newCart.map(c => ({
                      orderId: activeOrderId!,
                      menuItemId: c.menuItemId,
                      name: c.name,
                      price: c.price,
                      quantity: c.quantity,
                      subtotal: (Number(c.price) * c.quantity).toString(),
                    }))
                  );
                  await db.update(orders)
                    .set({ totalAmount: totalAmount.toString(), updatedAt: new Date() })
                    .where(eq(orders.id, activeOrderId));
                }
                orderId = activeOrderId;
              } else {
                // ─── سفارش جدید ───
                const totalAmount = newCart.reduce((s, c) => s + Number(c.price) * c.quantity, 0);
                const [order] = await db.insert(orders).values({
                  tenantId,
                  tableNumber,
                  totalAmount: totalAmount.toString(),
                  status: "pending",
                  isAiOrder: true,
                }).returning();

                await db.insert(orderItems).values(
                  newCart.map(c => ({
                    orderId: order.id,
                    menuItemId: c.menuItemId,
                    name: c.name,
                    price: c.price,
                    quantity: c.quantity,
                    subtotal: (Number(c.price) * c.quantity).toString(),
                  }))
                );
                orderId = order.id;
              }

              orderSubmitted = true;
              newCart = [];
            } catch (e) {
              console.error('Checkout error:', e);
              orderSubmitted = false;
            }
            break;
          }
        }
      }
    }

    // ذخیره conversation
    if (conversation) {
      await db.update(aiConversations)
        .set({ messages: history, updatedAt: new Date(), cart: newCart as any, orderId } as any)
        .where(eq(aiConversations.id, conversation.id));
    } else {
      conversation = (await db.insert(aiConversations).values({
        tenantId, sessionId, messages: history, cart: newCart as any, orderId,
      } as any).returning())[0];
    }

    const displayMessage = aiMessage.replace(/```order\n[\s\S]*?\n```/g, "").trim();

    return {
      message: displayMessage,
      menuCards,
      cart: newCart,
      cartTotal: newCart.reduce((s, c) => s + Number(c.price) * c.quantity, 0),
      orderSubmitted,
      orderId,
      conversationId: conversation?.id,
      // ─── اطلاعات سفارش فعال برای نمایش به مشتری ───
      activeOrder: activeOrderId ? {
        id: activeOrderId,
        status: activeOrderStatus,
        items: existingOrderItems,
        isConfirmed,
      } : null,
    };
  },

  async analyzeForAdmin(tenantId: string, question: string) {
    const [items, recentOrders] = await Promise.all([
      db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId)),
      db.select().from(orders).where(eq(orders.tenantId, tenantId)).limit(50),
    ]);

    const topItems = [...items].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)).slice(0, 5);
    const totalRevenue = recentOrders.filter((o) => o.status === "delivered")
      .reduce((s, o) => s + Number(o.totalAmount), 0);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `تو مشاور کسب‌وکار رستوران هستی.
پرفروش‌ترین: ${topItems.map(i => `${i.name}: ${i.totalOrders} سفارش`).join(', ')}
کل سفارشات: ${recentOrders.length}
درآمد: ${totalRevenue.toLocaleString("fa-IR")} تومان
تحلیل دقیق و عملی بده. فارسی پاسخ بده.`,
        },
        { role: "user", content: question },
      ],
    });

    return response.choices[0]?.message?.content || "";
  },
};