export declare const aiService: {
    chat(tenantId: string, sessionId: string, userMessage: string): Promise<{
        message: string;
        orderData: any;
        conversationId: string;
    }>;
    analyzeForAdmin(tenantId: string, question: string): Promise<string>;
    getMenuContext(tenantId: string): Promise<string>;
    getPopularItems(tenantId: string): Promise<string>;
    getAnalyticsContext(tenantId: string): Promise<string>;
};
//# sourceMappingURL=ai.service.d.ts.map