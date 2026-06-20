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
import { eq, and } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL,
});

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
  if (showAllKeywords.some((k) => text.includes(normalizeText(k)))) {
    return items;
  }

  const matchedCat = categoriesList.find((cat: any) => {
    const catName = normalizeText(cat.name);
    return (
      text.includes(catName) || (catName.length > 1 && catName.includes(text))
    );
  });

  if (matchedCat) {
    return items.filter((item: any) => item.categoryId === matchedCat.id);
  }

  const directMatches = items.filter((item: any) => {
    const name = normalizeText(item.name);
    if (text.includes(name) || name.includes(text)) return true;

    const words = name.split(" ").filter((w: string) => w.length > 1);
    return words.some((word: string) => text.includes(word));
  });

  return directMatches;
}

const SYSTEM_PROMPT_TEMPLATE = `تو یک AI Restaurant Agent حرفه‌ای هستی که برای یک سیستم SaaS چند رستورانی کار می‌کنی.

هر درخواست فقط به داده‌های همین رستوران دسترسی دارد و نباید اطلاعات رستوران‌های دیگر را نمایش دهی.

========================
هدف اصلی
========
1. به سوالات مشتری درباره منو پاسخ کامل بدهی
2. درباره هر غذا توضیح کامل بدهی (مواد، قیمت، زمان آماده‌سازی، کالری، آلرژن در صورت وجود)
3. غذاهای مشابه و مکمل پیشنهاد بدهی
4. سفارش مشتری را مدیریت کنی (افزودن، حذف، تغییر تعداد، نهایی‌سازی)
5. تجربه‌ای شبیه گارسون حرفه‌ای ایجاد کنی

========================
نمایش منو و کارت‌ها
==================
وقتی مشتری درباره منو، دسته‌بندی خاص، یا یک غذا سوال می‌کند، کارت‌های مربوطه به صورت گرافیکی به او نمایش داده می‌شود (تو لازم نیست عکس رو توصیف کنی یا بگی نمیتونی عکس نشون بدی).
فقط کافیست به صورت کوتاه بگویی مثلاً: "این مورد رو برات نشون دادم" یا "گزینه‌های موجود رو می‌بینی".
هرگز نگو "نمی‌توانم عکس نمایش دهم" - چون سیستم خودش عکس‌ها رو نمایش می‌دهد.

========================
قوانین پاسخگویی
===============
- همیشه فارسی، دوستانه، حرفه‌ای، کوتاه اما کامل
- هرگز اطلاعاتی نساز. اگر چیزی در منو نیست بگو: "این مورد در منو موجود نیست"

========================
مدیریت سفارش
============
وقتی مشتری درخواست افزودن آیتم داد (مثلاً "دو تا پیتزا مخصوص"):
در پایان پاسخ این بلاک رو بذار:

\`\`\`order
{
  "action": "add_items",
  "items": [
    {"menuItemId": "ID_FROM_MENU", "name": "نام دقیق", "quantity": 2}
  ]
}
\`\`\`

اگر گفت حذفش کن:
\`\`\`order
{
  "action": "remove_items",
  "items": [{"menuItemId": "ITEM_ID", "name": "نام"}]
}
\`\`\`

اگر گفت تعدادش رو عوض کن:
\`\`\`order
{
  "action": "update_quantity",
  "items": [{"menuItemId": "ITEM_ID", "name": "نام", "quantity": 3}]
}
\`\`\`

اگر مشتری گفت "سفارشم چیه" یا "سبد خریدم رو نشون بده": فقط توضیح بده، هیچ JSON تولید نکن.

فقط وقتی مشتری صراحتاً گفت "ثبت سفارش" یا "تایید میکنم" یا "نهایی کن":
\`\`\`order
{
  "action": "checkout"
}
\`\`\`
قبل از این، هرگز checkout تولید نکن.

========================
قوانین مهم
==========
1. هرگز menuItemId جعلی نساز - فقط از آیتم‌های موجود در منو استفاده کن
2. هرگز قیمت جعلی نساز
3. اگر آیتم unavailable یا out_of_stock بود، سفارش ثبت نکن و توضیح بده
4. سعی کن فروش بیشتری ایجاد کنی - وقتی غذا سفارش داد، نوشیدنی یا دسر مکمل پیشنهاد بده
5. JSON فقط داخل بلاک \`\`\`order قرار بگیرد، خارج از آن هیچ JSON دیگری تولید نشود

========================
منوی رستوران "{{RESTAURANT_NAME}}"
========================
{{MENU_CONTEXT}}

محبوب‌ترین آیتم‌ها:
{{POPULAR_ITEMS}}

سبد خرید فعلی مشتری:
{{CURRENT_CART}}`;

interface CartItem {
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
}

export const aiService = {
  async chat(
    tenantId: string,
    sessionId: string,
    userMessage: string,
    tableNumber?: number,
  ) {
    let conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.tenantId, tenantId),
        eq(aiConversations.sessionId, sessionId),
      ),
    });

    const history: any[] = (conversation?.messages as any[]) || [];
    const cart: CartItem[] = (conversation as any)?.cart || [];

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

    // کارت‌های منوی مرتبط با پیام کاربر
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

    const menuContext = availableItems
      .map((item) => {
        const cat = categoriesList.find((c) => c.id === item.categoryId);
        return (
          `- ${item.name} | ${Number(item.price).toLocaleString("fa-IR")} تومان | ID: ${item.id}` +
          `${cat ? ` | دسته: ${cat.name}` : ""}` +
          `${item.description ? ` | توضیح: ${item.description}` : ""}` +
          `${item.preparationTime ? ` | زمان آماده‌سازی: ${item.preparationTime} دقیقه` : ""}` +
          `${item.calories ? ` | کالری: ${item.calories}` : ""}` +
          `${item.image ? ` | دارای عکس` : ""}`
        );
      })
      .join("\n");

    const popularItems =
      availableItems
        .filter((i) => i.isPopular)
        .map((i) => `- ${i.name} (${i.totalOrders} سفارش)`)
        .join("\n") || "موردی ثبت نشده";

    const cartText =
      cart.length > 0
        ? cart
            .map(
              (c) =>
                `- ${c.name} × ${c.quantity} = ${(Number(c.price) * c.quantity).toLocaleString("fa-IR")} تومان`,
            )
            .join("\n") +
          `\nجمع کل: ${cart.reduce((s, c) => s + Number(c.price) * c.quantity, 0).toLocaleString("fa-IR")} تومان`
        : "سبد خرید خالی است";

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
      "{{RESTAURANT_NAME}}",
      tenant?.name || "رستوران",
    )
      .replace("{{MENU_CONTEXT}}", menuContext || "منو خالی است")
      .replace("{{POPULAR_ITEMS}}", popularItems)
      .replace("{{CURRENT_CART}}", cartText);

    history.push({ role: "user", content: userMessage });

    const response = await openai.chat.completions.create({
      model: "deepseek-v4-flash",
      // max_tokens: 2024,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });

    const aiMessage = response.choices[0]?.message?.content || "";
    history.push({ role: "assistant", content: aiMessage });

    const orderMatch = aiMessage.match(/```order\n([\s\S]*?)\n```/);
    let orderAction: any = null;
    if (orderMatch) {
      try {
        orderAction = JSON.parse(orderMatch[1]);
      } catch {}
    }

    let newCart = [...cart];
    let orderSubmitted = false;
    let orderId: string | null = null;

    if (orderAction) {
      switch (orderAction.action) {
        case "add_items": {
          for (const item of orderAction.items || []) {
            const menuItem = availableItems.find(
              (m) => m.id === item.menuItemId,
            );
            if (!menuItem) continue;

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
          const removeIds = (orderAction.items || []).map(
            (i: any) => i.menuItemId,
          );
          newCart = newCart.filter((c) => !removeIds.includes(c.menuItemId));
          break;
        }
        case "update_quantity": {
          for (const item of orderAction.items || []) {
            const existing = newCart.find(
              (c) => c.menuItemId === item.menuItemId,
            );
            if (existing) existing.quantity = item.quantity;
          }
          newCart = newCart.filter((c) => c.quantity > 0);
          break;
        }
        case "checkout": {
          if (newCart.length > 0) {
            const totalAmount = newCart.reduce(
              (s, c) => s + Number(c.price) * c.quantity,
              0,
            );

            const [order] = await db
              .insert(orders)
              .values({
                tenantId,
                tableNumber,
                totalAmount: totalAmount.toString(),
                status: "pending",
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
            orderSubmitted = true;
            newCart = [];
          }
          break;
        }
      }
    }

    if (conversation) {
      await db
        .update(aiConversations)
        .set({
          messages: history,
          updatedAt: new Date(),
          cart: newCart as any,
          orderId: orderId || conversation.orderId,
        } as any)
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

    const context = `
پرفروش‌ترین آیتم‌ها:
${topItems.map((i) => `- ${i.name}: ${i.totalOrders} سفارش`).join("\n")}

تعداد کل سفارشات: ${recentOrders.length}
درآمد کل (تحویل شده): ${totalRevenue.toLocaleString("fa-IR")} تومان
تعداد آیتم‌های منو: ${items.length}
`;

    const response = await openai.chat.completions.create({
      model: "deepseek-v4-flash",
      // max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `تو یک مشاور کسب‌وکار هوشمند برای رستوران هستی. داده‌های رستوران:\n${context}\nتحلیل دقیق و عملی بده. به فارسی پاسخ بده.`,
        },
        { role: "user", content: question },
      ],
    });

    return response.choices[0]?.message?.content || "";
  },
};
