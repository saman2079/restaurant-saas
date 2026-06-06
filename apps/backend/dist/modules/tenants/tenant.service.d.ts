import { tenants } from '../../db/schema';
export declare const tenantService: {
    getAll(page?: number, limit?: number, search?: string): Promise<{
        tenants: {
            id: string;
            name: string;
            slug: string;
            description: string;
            logo: string;
            coverImage: string;
            phone: string;
            address: string;
            plan: "basic" | "pro" | "business";
            isActive: boolean;
            settings: unknown;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    getBySlug(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string;
        logo: string;
        coverImage: string;
        phone: string;
        address: string;
        plan: "basic" | "pro" | "business";
        isActive: boolean;
        settings: unknown;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: {
        name: string;
        ownerName: string;
        ownerEmail: string;
        ownerPassword: string;
        plan?: "basic" | "pro" | "business";
    }): Promise<{
        tenant: {
            plan: "basic" | "pro" | "business";
            id: string;
            name: string;
            slug: string;
            description: string;
            logo: string;
            coverImage: string;
            phone: string;
            address: string;
            isActive: boolean;
            settings: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        owner: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string;
            role: "super_admin" | "owner" | "manager" | "waiter" | "chef";
            avatar: string;
            lastLoginAt: Date;
        };
    }>;
    update(id: string, data: Partial<typeof tenants.$inferInsert>): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string;
        logo: string;
        coverImage: string;
        phone: string;
        address: string;
        plan: "basic" | "pro" | "business";
        isActive: boolean;
        settings: unknown;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string;
        logo: string;
        coverImage: string;
        phone: string;
        address: string;
        plan: "basic" | "pro" | "business";
        isActive: boolean;
        settings: unknown;
        createdAt: Date;
        updatedAt: Date;
    }>;
};
//# sourceMappingURL=tenant.service.d.ts.map