import OpenAI from "openai";
import { env } from "../../config/env";
import { db } from "../../config/database";
import {
  menuItems,
  categories,
  orders,
  orderItems,
  aiConversations,
  tenants,
} from "../../db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { tablesService } from "../tables/tables.service";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL,
});

const PAYMENT_THRESHOLD = 500000;

function normalizeText(text: string) {
  return (text || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function getRelevantMenuCards(
  userText: string,
  items: any[],
  categoriesList: any[],
) {
  const text = normalizeText(userText);
  const showAllKeywords = [
    "منو",
    "menu",
    "همه",
    "کل منو",
    "لیست",
    "غذاها",
    "چی دارید",
    "چی دارین",
  ];
  if (showAllKeywords.some((k) => text.includes(normalizeText(k))))
    return items;

  const matchedCat = categoriesList.find((cat: any) => {
    const catName = normalizeText(cat.name);
    return (
      text.includes(catName) || (catName.length > 1 && catName.includes(text))
    );
  });
  if (matchedCat)
    return items.filter((i: any) => i.categoryId === matchedCat.id);

  return items.filter((item: any) => {
    const name = normalizeText(item.name);
    if (text.includes(name) || name.includes(text)) return true;
    return name
      .split(" ")
      .filter((w: string) => w.length > 1)
      .some((w: string) => text.includes(w));
  });
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
}

/**
 * منطق قفل بودن سفارش:
 *
 * سفارش زیر ۵۰۰:
 *   - pending / delivered بدون paidAt → ویرایش آزاد (هنوز حساب نشده)
 *   - confirmed / preparing / ready → قفل (وارد آشپزخونه شده)
 *   - delivered با paidAt → قفل (تحویل و پرداخت شده)
 *
 * سفارش بالای ۵۰۰:
 *   - بدون paidAt → ویرایش آزاد (صندوق هنوز حساب نگرفته)
 *   - با paidAt → قفل (پرداخت شده، در آشپزخونه)
 */
function getOrderLockState(order: any): {
  isLocked: boolean;
  lockReason: string | null;
} {
  const total = Number(order.totalAmount);
  const isAboveThreshold = total >= PAYMENT_THRESHOLD;

  // اگه پرداخت شده، همیشه قفله
  if (order.paidAt) {
    return {
      isLocked: true,
      lockReason: "پرداخت انجام شده - در حال آماده‌سازی",
    };
  }

  if (isAboveThreshold) {
    // بالای ۵۰۰ و پرداخت نشده → آزاد
    return { isLocked: false, lockReason: null };
  } else {
    // زیر ۵۰۰: وقتی وارد آشپزخونه شد قفل میشه
    // pending و delivered (بدون paidAt) → آزاد
    // confirmed / preparing / ready → قفل
    const lockedStatuses = ["confirmed", "preparing", "ready"];
    if (lockedStatuses.includes(order.status)) {
      return { isLocked: true, lockReason: "سفارش در حال آماده‌سازی" };
    }
    return { isLocked: false, lockReason: null };
  }
}

export const aiService = {
  async chat(
    tenantId: string,
    sessionId: string,
    userMessage: string,
    tableNumber?: number,
    sessionToken?: string,
  ) {
    // ─── ۱. Session validation ───
    if (tableNumber) {
      if (!sessionToken) {
        return {
          message: "❌ برای سفارش دادن باید QR کد میز را اسکن کنید.",
          menuCards: [],
          cart: [],
          cartTotal: 0,
          orderSubmitted: false,
          orderId: null,
          conversationId: null,
          activeOrder: null,
        };
      }
      const isValid = await tablesService.validateSession(
        tenantId,
        tableNumber,
        sessionToken,
      );
      if (!isValid) {
        return {
          message:
            "⏰ جلسه شما منقضی شده. لطفاً QR کد میز را دوباره اسکن کنید.",
          menuCards: [],
          cart: [],
          cartTotal: 0,
          orderSubmitted: false,
          orderId: null,
          conversationId: null,
          activeOrder: null,
        };
      }
    }

    // ─── ۲. Conversation ───
    let conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.tenantId, tenantId),
        eq(aiConversations.sessionId, sessionId),
      ),
    });

    const history: any[] = (conversation?.messages as any[]) || [];
    let cart: CartItem[] = (conversation as any)?.cart || [];

    // ─── ۳. سفارش فعال میز از DB ───
    let activeOrderId: string | null = null;
    let activeOrderStatus: string | null = null;
    let activeOrderTotal: number = 0;
    let existingOrderItems: any[] = [];
    let isLocked = false;
    let lockReason: string | null = null;
    let isAboveThreshold = false;

    if (tableNumber) {
      const activeOrder = await db.query.orders.findFirst({
        where: and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          // سفارش active = بسته نشده (completedAt نداره) و cancel نشده
          isNull(orders.completedAt),
          sql`${orders.status} != 'cancelled'`,
        ),
        with: { items: true },
      });

      if (activeOrder) {
        activeOrderId = activeOrder.id;
        activeOrderStatus = activeOrder.status;
        activeOrderTotal = Number(activeOrder.totalAmount);
        existingOrderItems = (activeOrder as any).items || [];
        isAboveThreshold = activeOrderTotal >= PAYMENT_THRESHOLD;

        const lockState = getOrderLockState(activeOrder);
        isLocked = lockState.isLocked;
        lockReason = lockState.lockReason;

        if (conversation && (conversation as any).orderId !== activeOrderId) {
          cart = [];
          await db
            .update(aiConversations)
            .set({ cart: [] as any, orderId: activeOrderId } as any)
            .where(eq(aiConversations.id, conversation.id));
        }
      } else {
        if ((conversation as any)?.orderId) {
          cart = [];
          if (conversation) {
            await db
              .update(aiConversations)
              .set({ cart: [] as any, orderId: null } as any)
              .where(eq(aiConversations.id, conversation.id));
          }
        }
      }
    }

    // ─── ۴. منو ───
    const [menuItemsList, categoriesList, tenant] = await Promise.all([
      db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId)),
      db.select().from(categories).where(eq(categories.tenantId, tenantId)),
      db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .then((r) => r[0]),
    ]);

    const availableItems = menuItemsList.filter(
      (i) => i.status === "available",
    );
    const relevantItems = getRelevantMenuCards(
      userMessage,
      availableItems,
      categoriesList,
    );
    const menuCards = relevantItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      image: item.image || null,
      isPopular: item.isPopular,
      preparationTime: item.preparationTime,
      status: item.status,
    }));

    // ─── ۵. Context برای prompt ───
    const menuContext = availableItems
      .map((item) => {
        const cat = categoriesList.find((c) => c.id === item.categoryId);
        return (
          `- ${item.name} | ${Number(item.price).toLocaleString("fa-IR")} تومان | ID: ${item.id}` +
          `${cat ? ` | دسته: ${cat.name}` : ""}` +
          `${item.description ? ` | ${item.description}` : ""}` +
          `${item.preparationTime ? ` | ${item.preparationTime} دقیقه` : ""}`
        );
      })
      .join("\n");

    const cartText =
      cart.length > 0
        ? cart
            .map(
              (c) =>
                `- ${c.name} × ${c.quantity} = ${(Number(c.price) * c.quantity).toLocaleString("fa-IR")} تومان`,
            )
            .join("\n") +
          `\nجمع: ${cart.reduce((s, c) => s + Number(c.price) * c.quantity, 0).toLocaleString("fa-IR")} تومان`
        : "خالی";

    const orderContext = activeOrderId
      ? `سفارش فعال (ID: ${activeOrderId}) | وضعیت: ${activeOrderStatus} | مبلغ کل: ${activeOrderTotal.toLocaleString("fa-IR")} تومان\nآیتم‌ها:\n` +
        existingOrderItems
          .map(
            (i: any) =>
              `  - ${i.name} × ${i.quantity} = ${(Number(i.price) * i.quantity).toLocaleString("fa-IR")} تومان [menuItemId: ${i.menuItemId}]`,
          )
          .join("\n")
      : "بدون سفارش فعال";

    // وضعیت ویرایش‌پذیری برای prompt
    let editabilityNote: string;
    if (!tableNumber) {
      editabilityNote = "⚠️ بدون میز - فقط نمایش منو";
    } else if (!activeOrderId) {
      editabilityNote = "✏️ هنوز سفارشی ثبت نشده - سبد خالیه";
    } else if (!isLocked) {
      editabilityNote = isAboveThreshold
        ? `✏️ سفارش بالای ۵۰۰ هزار تومان - قابل ویرایش تا قبل از پرداخت در صندوق`
        : `✏️ سفارش زیر ۵۰۰ هزار تومان - قابل ویرایش تا قبل از تایید صندوق`;
    } else {
      editabilityNote = `🔒 ${lockReason} - فقط آیتم جدید می‌توان اضافه کرد`;
    }

    // پیام راهنما برای مشتری بعد از checkout بالای ۵۰۰
    const postCheckoutNote = isAboveThreshold
      ? `
پیام مهم بعد از checkout موفق (بالای ۵۰۰ هزار):
حتماً به مشتری بگو: "سفارش شما ثبت شد. لطفاً برای پرداخت به صندوق مراجعه کنید، بعد از پرداخت سفارشتون وارد آشپزخونه میشه."
این رو با لحن گرم و صمیمی بگو.`
      : `
پیام بعد از checkout موفق (زیر ۵۰۰ هزار):
به مشتری بگو: "سفارش شما با موفقیت ثبت شد! به زودی آماده می‌شه."`;

    const SYSTEM_PROMPT = `تو گارسون هوشمند رستوران "${tenant?.name || "رستوران"}" هستی. کوتاه، صمیمی و مستقیم جواب بده.

════════════════════════════════
وضعیت لحظه‌ای (این اطلاعات از DB میاد و کاملاً به‌روزه، هر چیزی که قبلاً گفتی نادیده بگیر):
- میز: ${tableNumber ?? "ندارد"}
- سفارش فعال: ${activeOrderId ? `ID=${activeOrderId} | status=${activeOrderStatus} | مبلغ=${activeOrderTotal.toLocaleString("fa-IR")} تومان` : "ندارد"}
- قفل بودن: ${isLocked ? `🔒 قفل (${lockReason})` : "🔓 آزاد - ویرایش مجاز است"}
- آیتم‌های سفارش فعال:
${existingOrderItems.length > 0 ? existingOrderItems.map((i: any) => `  • ${i.name} × ${i.quantity} [menuItemId: ${i.menuItemId}]`).join("\n") : "  (خالی)"}
- سبد AI (هنوز ثبت نشده): ${cartText}
════════════════════════════════

${
  !isLocked
    ? `✅ سفارش فعلی قابل ویرایش است:
- add_items: اضافه کردن آیتم جدید
- remove_items: حذف آیتم
- update_quantity: تغییر تعداد آیتم موجود در سبد یا سفارش
اگه مشتری میگه "X تا بکنش"، یعنی update_quantity روی اون آیتم - انجام بده.`
    : `🔒 سفارش قفل است (${lockReason}):
- فقط add_items برای آیتم‌های کاملاً جدید مجاز است
- هرگز نگو "سفارش نهایی شده" - بگو "سفارشت در حال آماده‌سازیه"`
}

قوانین رفتاری:
1. ${!tableNumber ? "هیچ سفارشی ثبت نکن - فقط منو نشون بده" : "برای این میز سفارش ثبت کن"}
2. فقط از IDهای موجود در منو استفاده کن
3. وقتی آیتمی اضافه/حذف/ویرایش شد، خلاصه سبد رو بگو و بپرس "ثبت کنم؟"
4. وقتی مشتری تایید کرد (بله/آره/بزن/ثبت کن/...)، بلافاصله checkout کن - هیچ پیام میانی ند
5. هرگز نگو "الان ثبت میکنم" یا "صبر کن" - یا بپرس یا checkout کن
6. وقتی مشتری "منو بده" میگه بگو "منو رو می‌بینید"

لحن:
- بعد از ویرایش سبد: "خب، [خلاصه]. ثبت کنم؟"
- بعد از checkout زیر ۵۰۰: "ثبت شد! 🎉 به زودی آماده میشه."
- بعد از checkout بالای ۵۰۰: "ثبت شد! برای پرداخت به صندوق مراجعه کن. 🍽️"

فرمت action:
افزودن: \`\`\`order
{"action":"add_items","items":[{"menuItemId":"EXACT_ID","name":"نام","quantity":1}]}
\`\`\`
${
  !isLocked
    ? `حذف: \`\`\`order
{"action":"remove_items","items":[{"menuItemId":"ID","name":"نام"}]}
\`\`\`
تغییر تعداد: \`\`\`order
{"action":"update_quantity","items":[{"menuItemId":"ID","name":"نام","quantity":3}]}
\`\`\``
    : ""
}
ثبت نهایی (فقط بعد از تایید مشتری): \`\`\`order
{"action":"checkout"}
\`\`\`

منو:
${menuContext}

پرفروش: ${
      availableItems
        .filter((i) => i.isPopular)
        .map((i) => i.name)
        .join(", ") || "ندارد"
    }`;

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

    // ─── ۶. Parse action ───
    const orderMatch = aiMessage.match(/```order\n([\s\S]*?)\n```/);
    let orderAction: any = null;
    if (orderMatch) {
      try {
        orderAction = JSON.parse(orderMatch[1]);
      } catch {}
    }

    let newCart = [...cart];
    let orderSubmitted = false;
    let orderId: string | null = activeOrderId;

    if (orderAction && tableNumber) {
      // بررسی مجاز بودن action
      if (isLocked && !["add_items", "checkout"].includes(orderAction.action)) {
        console.warn(`Blocked ${orderAction.action} on locked order`);
        orderAction = null;
      }

      if (orderAction) {
        switch (orderAction.action) {
          case "add_items": {
            for (const item of orderAction.items || []) {
              const menuItem = availableItems.find(
                (m) => m.id === item.menuItemId,
              );
              if (!menuItem) continue;

              // اگه قفله، فقط آیتم‌های کاملاً جدید (که توی سفارش نیستن) اضافه کن
              if (
                isLocked &&
                existingOrderItems.some(
                  (i: any) => i.menuItemId === item.menuItemId,
                )
              )
                continue;

              const existing = newCart.find(
                (c) => c.menuItemId === item.menuItemId,
              );
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
            const ids = (orderAction.items || []).map((i: any) => i.menuItemId);
            newCart = newCart.filter((c) => !ids.includes(c.menuItemId));
            break;
          }
          case "update_quantity": {
            for (const item of orderAction.items || []) {
              // اول توی سبد AI چک کن
              const existingInCart = newCart.find(
                (c) => c.menuItemId === item.menuItemId,
              );
              if (existingInCart) {
                existingInCart.quantity = item.quantity;
              } else {
                // اگه توی سبد نبود، از آیتم‌های سفارش DB بردار و بذار توی سبد
                const existingInOrder = existingOrderItems.find(
                  (i: any) => i.menuItemId === item.menuItemId,
                );
                if (existingInOrder) {
                  const menuItem = availableItems.find(
                    (m) => m.id === item.menuItemId,
                  );
                  if (menuItem && item.quantity > 0) {
                    newCart.push({
                      menuItemId: menuItem.id,
                      name: menuItem.name,
                      price: menuItem.price,
                      quantity: item.quantity,
                    });
                  }
                }
              }
            }
            newCart = newCart.filter((c) => c.quantity > 0);
            break;
          }
          case "checkout": {
            if (newCart.length === 0) break;

            try {
              const totalAmount = newCart.reduce(
                (s, c) => s + Number(c.price) * c.quantity,
                0,
              );
              const newIsAboveThreshold = totalAmount >= PAYMENT_THRESHOLD;

              // بالای ۵۰۰: منتظر پرداخت صندوق → paymentStatus: pending
              // زیر ۵۰۰: نیاز به پرداخت نداره → paymentStatus: not_required
              const paymentStatus = newIsAboveThreshold
                ? "pending"
                : "not_required";

              if (activeOrderId && !isLocked) {
                // آپدیت سفارش موجود
                await db
                  .delete(orderItems)
                  .where(eq(orderItems.orderId, activeOrderId));
                await db.insert(orderItems).values(
                  newCart.map((c) => ({
                    orderId: activeOrderId!,
                    menuItemId: c.menuItemId,
                    name: c.name,
                    price: c.price,
                    quantity: c.quantity,
                    subtotal: (Number(c.price) * c.quantity).toString(),
                  })),
                );
                await db
                  .update(orders)
                  .set({
                    totalAmount: totalAmount.toString(),
                    status: "pending" as any,
                    paymentStatus,
                    updatedAt: new Date(),
                  })
                  .where(eq(orders.id, activeOrderId));
                orderId = activeOrderId;
              } else if (activeOrderId && isLocked) {
                // فقط آیتم‌های جدید اضافه کن
                const existingIds = new Set(
                  existingOrderItems.map((i: any) => i.menuItemId),
                );
                const newOnly = newCart.filter(
                  (c) => !existingIds.has(c.menuItemId),
                );
                if (newOnly.length > 0) {
                  let extra = 0;
                  const newData = newOnly.map((c) => {
                    const sub = Number(c.price) * c.quantity;
                    extra += sub;
                    return {
                      orderId: activeOrderId!,
                      menuItemId: c.menuItemId,
                      name: c.name,
                      price: c.price,
                      quantity: c.quantity,
                      subtotal: sub.toString(),
                    };
                  });
                  await db.insert(orderItems).values(newData);
                  const cur = await db.query.orders.findFirst({
                    where: eq(orders.id, activeOrderId),
                  });
                  await db
                    .update(orders)
                    .set({
                      totalAmount: (
                        Number(cur?.totalAmount || 0) + extra
                      ).toString(),
                      updatedAt: new Date(),
                    })
                    .where(eq(orders.id, activeOrderId));
                }
                orderId = activeOrderId;
              } else {
                // سفارش جدید
                const [order] = await db
                  .insert(orders)
                  .values({
                    tenantId,
                    tableNumber,
                    totalAmount: totalAmount.toString(),
                    status: "pending",
                    paymentStatus,
                    isAiOrder: true,
                  })
                  .returning();

                await db.insert(orderItems).values(
                  newCart.map((c) => ({
                    orderId: order.id,
                    menuItemId: c.menuItemId,
                    name: c.name,
                    price: c.price,
                    quantity: c.quantity,
                    subtotal: (Number(c.price) * c.quantity).toString(),
                  })),
                );
                orderId = order.id;

                const io = (global as any).io;
                if (io) {
                  const fullOrder = await db.query.orders.findFirst({
                    where: eq(orders.id, order.id),
                    with: { items: true },
                  });
                  io.to(`tenant:${tenantId}`).emit("new-order", fullOrder);
                  if (paymentStatus === "pending") {
                    io.to(`tenant:${tenantId}`).emit(
                      "payment-required",
                      fullOrder,
                    );
                  }
                }
              }

              orderSubmitted = true;
              newCart = [];
            } catch (e) {
              console.error("Checkout error:", e);
            }
            break;
          }
        }
      }
    }

    // ─── ۷. ذخیره ───
    const updateData = {
      messages: history,
      updatedAt: new Date(),
      cart: newCart as any,
      orderId,
    } as any;
    if (conversation) {
      await db
        .update(aiConversations)
        .set(updateData)
        .where(eq(aiConversations.id, conversation.id));
    } else {
      conversation = (
        await db
          .insert(aiConversations)
          .values({
            tenantId,
            sessionId,
            messages: history,
            cart: newCart as any,
            orderId,
          } as any)
          .returning()
      )[0];
    }

    // ─── ۸. Emit آپدیت ───
    if (orderSubmitted || orderAction) {
      const io = (global as any).io;
      if (io && orderId) {
        const updatedOrder = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
          with: { items: true },
        });
        if (updatedOrder) {
          io.to(`tenant:${tenantId}`).emit("order-updated", updatedOrder);
        }
      }
    }

    const displayMessage = aiMessage
      .replace(/```order\n[\s\S]*?\n```/g, "")
      .trim();

    return {
      message: displayMessage,
      menuCards,
      cart: newCart,
      cartTotal: newCart.reduce((s, c) => s + Number(c.price) * c.quantity, 0),
      orderSubmitted,
      orderId,
      conversationId: conversation?.id,
      activeOrder: activeOrderId
        ? {
            id: activeOrderId,
            status: activeOrderStatus,
            items: existingOrderItems,
            isLocked,
            lockReason,
            isAboveThreshold,
          }
        : null,
    };
  },

  async analyzeForAdmin(tenantId: string, question: string) {
    const [items, recentOrders] = await Promise.all([
      db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId)),
      db.select().from(orders).where(eq(orders.tenantId, tenantId)).limit(50),
    ]);

    const topItems = [...items]
      .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
      .slice(0, 5);
    const totalRevenue = recentOrders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + Number(o.totalAmount), 0);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `مشاور کسب‌وکار رستوران هستی.\nپرفروش‌ترین: ${topItems.map((i) => `${i.name}: ${i.totalOrders}`).join(", ")}\nکل: ${recentOrders.length} سفارش | درآمد: ${totalRevenue.toLocaleString("fa-IR")} تومان\nتحلیل فارسی بده.`,
        },
        { role: "user", content: question },
      ],
    });

    return response.choices[0]?.message?.content || "";
  },
};
