export declare const analyticsService: {
    getSummary(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
        totalRevenue: string | number;
        totalOrders: number;
        avgOrderValue: number;
        period: {
            start: Date;
            end: Date;
        };
    }>;
    getTopItems(tenantId: string, limit?: number): Promise<{
        menuItemId: string;
        name: string;
        totalQuantity: string;
        totalRevenue: string;
    }[]>;
    getDailyRevenue(tenantId: string, days?: number): Promise<{
        date: string;
        revenue: string;
        orderCount: number;
    }[]>;
    getHourlyDistribution(tenantId: string): Promise<{
        hour: number;
        orderCount: number;
    }[]>;
};
//# sourceMappingURL=analytics.service.d.ts.map