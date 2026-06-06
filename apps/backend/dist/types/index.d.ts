import { Request } from 'express';
export interface AuthPayload {
    userId: string;
    tenantId: string | null;
    role: string;
    email: string;
}
export interface AuthRequest extends Request {
    user?: AuthPayload;
    tenantId?: string;
    tenant?: any;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=index.d.ts.map