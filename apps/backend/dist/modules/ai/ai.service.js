"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const redis_1 = require("../../config/redis");
const anthropic = new sdk_1.default({ apiKey: env_1.env.ANTHROPIC_API_KEY });
exports.aiService = {
    async chat(tenantId, sessionId, userMessage) {
        // گرفتن یا ساختن conversation
        let conversation = await database_1.db.query.aiConversations.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.aiConversations.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.aiConversations.sessionId, sessionId)),
        });
        const messages = conversation?.messages || [];
        // گرفتن منوی رستوران برای context
        const [menuContext, popularItems] = await Promise.all([
            this.getMenuContext(tenantId),
            this.getPopularItems(tenantId),
        ]);
        const systemPrompt = `تو یک دستیار هوشمند رستوران هستی. اسم رستوران در سیستم ثبت شده.

منوی کامل رستوران:
${menuContext}

محبوب‌ترین آیتم‌ها (بر اساس سفارشات قبلی):
${popularItems}

وظایف تو:
1. معرفی منو و توضیح آیتم‌ها به مشتری
2. پیشنهاد آیتم‌های مناسب بر اساس علاقه مشتری
3. اضافه کردن آیتم‌ها به سبد خرید مشتری
4. نهایی کردن سفارش

وقتی مشتری آیتمی رو تأیید کرد که بخواد سفارش بده، در پایان پیامت یک JSON block بذار:
\`\`\`order
{
  "items": [
    {"menuItemId": "...", "quantity": 1, "name": "..."}
  ],
  "ready": false
}
\`\`\`
وقتی سفارش کامل شد و مشتری تأیید کرد، ready رو true کن.

به فارسی صحبت کن. صمیمی و خوش‌برخورد باش.`;
        messages.push({ role: 'user', content: userMessage });
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        const assistantMessage = response.content[0].type === 'text'
            ? response.content[0].text : '';
        messages.push({ role: 'assistant', content: assistantMessage });
        // ذخیره conversation
        if (conversation) {
            await database_1.db.update(schema_1.aiConversations)
                .set({ messages, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.aiConversations.id, conversation.id));
        }
        else {
            conversation = (await database_1.db.insert(schema_1.aiConversations).values({
                tenantId,
                sessionId,
                messages,
            }).returning())[0];
        }
        // چک کن آیا سفارش آماده‌ست
        const orderMatch = assistantMessage.match(/```order\n([\s\S]*?)\n```/);
        let orderData = null;
        if (orderMatch) {
            try {
                orderData = JSON.parse(orderMatch[1]);
            }
            catch { }
        }
        return {
            message: assistantMessage.replace(/```order\n[\s\S]*?\n```/g, '').trim(),
            orderData,
            conversationId: conversation.id,
        };
    },
    async analyzeForAdmin(tenantId, question) {
        // گرفتن آمار برای تحلیل
        const analyticsData = await this.getAnalyticsContext(tenantId);
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `تو یک مشاور کسب‌وکار هوشمند برای رستوران‌ها هستی.
داده‌های رستوران:
${analyticsData}
تحلیل دقیق و عملی بده. به فارسی پاسخ بده.`,
            messages: [{ role: 'user', content: question }],
        });
        return response.content[0].type === 'text' ? response.content[0].text : '';
    },
    async getMenuContext(tenantId) {
        const cacheKey = `ai:menu:${tenantId}`;
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return cached;
        const items = await database_1.db.select({
            id: schema_1.menuItems.id,
            name: schema_1.menuItems.name,
            description: schema_1.menuItems.description,
            price: schema_1.menuItems.price,
            status: schema_1.menuItems.status,
            categoryId: schema_1.menuItems.categoryId,
        }).from(schema_1.menuItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.menuItems.status, 'available')));
        const context = items.map(i => `- ${i.name} | ${i.price} تومان | ID: ${i.id}${i.description ? ` | ${i.description}` : ''}`).join('\n');
        await redis_1.redis.setex(cacheKey, 300, context);
        return context;
    },
    async getPopularItems(tenantId) {
        const items = await database_1.db.select()
            .from(schema_1.menuItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.menuItems.isPopular, true)))
            .limit(5);
        return items.map(i => `- ${i.name} (${i.totalOrders} سفارش)`).join('\n');
    },
    async getAnalyticsContext(tenantId) {
        // اینجا میشه analytics data رو اضافه کرد
        return 'داده‌های فروش در دسترس است';
    },
};
//# sourceMappingURL=ai.service.js.map