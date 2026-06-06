type UserRole = 'super_admin' | 'owner' | 'manager' | 'waiter' | 'chef';
export declare const staffService: {
    getAll(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: "super_admin" | "owner" | "manager" | "waiter" | "chef";
        isActive: boolean;
        avatar: string;
        lastLoginAt: Date;
        createdAt: Date;
    }[]>;
    create(tenantId: string, data: {
        name: string;
        email: string;
        password: string;
        role: "manager" | "waiter" | "chef";
    }): Promise<{
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
    }>;
    update(id: string, tenantId: string, data: {
        name?: string;
        role?: UserRole;
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string;
        role: "super_admin" | "owner" | "manager" | "waiter" | "chef";
        isActive: boolean;
        avatar: string;
        lastLoginAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string, tenantId: string): Promise<void>;
};
export {};
//# sourceMappingURL=staff.service.d.ts.map