export declare const authService: {
    login(email: string, password: string): Promise<{
        token: string;
        user: {
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
        };
    }>;
    logout(token: string): Promise<void>;
    getMe(userId: string): Promise<{
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
    createSuperAdmin(): Promise<void>;
};
//# sourceMappingURL=auth.service.d.ts.map