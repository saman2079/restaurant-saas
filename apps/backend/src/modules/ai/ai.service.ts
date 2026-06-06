import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { db } from '../../config/database';
import { menuItems, categories, orders, aiConversations } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { redis } from '../../config/redis';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const aiService = {
  async chat(tenantId: string, sessionId: string, userMessage: string) {
    // گرفتن یا ساختن conversation
    let conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.tenantId, tenantId),
        eq(aiConversations.sessionId, sessionId)
      ),
    });
    
    const messages: any[] = conversation?.messages as any[] || [];
    
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
      await db.update(aiConversations)
        .set({ messages, updatedAt: new Date() })
        .where(eq(aiConversations.id, conversation.id));
    } else {
      conversation = (await db.insert(aiConversations).values({
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
      } catch {}
    }
    
    return {
      message: assistantMessage.replace(/```order\n[\s\S]*?\n```/g, '').trim(),
      orderData,
      conversationId: conversation.id,
    };
  },
  
  async analyzeForAdmin(tenantId: string, question: string) {
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
  
  async getMenuContext(tenantId: string): Promise<string> {
    const cacheKey = `ai:menu:${tenantId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
    
    const items = await db.select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      status: menuItems.status,
      categoryId: menuItems.categoryId,
    }).from(menuItems)
    .where(and(eq(menuItems.tenantId, tenantId), eq(menuItems.status, 'available')));
    
    const context = items.map(i => 
      `- ${i.name} | ${i.price} تومان | ID: ${i.id}${i.description ? ` | ${i.description}` : ''}`
    ).join('\n');
    
    await redis.setex(cacheKey, 300, context);
    return context;
  },
  
  async getPopularItems(tenantId: string): Promise<string> {
    const items = await db.select()
      .from(menuItems)
      .where(and(eq(menuItems.tenantId, tenantId), eq(menuItems.isPopular, true)))
      .limit(5);
    
    return items.map(i => `- ${i.name} (${i.totalOrders} سفارش)`).join('\n');
  },
  
  async getAnalyticsContext(tenantId: string): Promise<string> {
    // اینجا میشه analytics data رو اضافه کرد
    return 'داده‌های فروش در دسترس است';
  },
};