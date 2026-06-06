import { Server as SocketServer } from 'socket.io';
export declare const setSocketIO: (socketIO: SocketServer) => void;
export declare const orderService: {
    create(tenantId: string, data: {
        tableNumber?: number;
        tableId?: string;
        customerName?: string;
        notes?: string;
        isAiOrder?: boolean;
        items: Array<{
            menuItemId: string;
            quantity: number;
            notes?: string;
        }>;
    }): Promise<{
        items: {
            id: string;
            name: string;
            price: string;
            notes: string;
            orderId: string;
            menuItemId: string;
            quantity: number;
            subtotal: string;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
        tableId: string;
        tableNumber: number;
        totalAmount: string;
        notes: string;
        customerName: string;
        assignedTo: string;
        isAiOrder: boolean;
        completedAt: Date;
    }>;
    getAll(tenantId: string, filters?: {
        status?: string;
        tableNumber?: number;
        date?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
        tableId: string;
        tableNumber: number;
        totalAmount: string;
        notes: string;
        customerName: string;
        assignedTo: string;
        isAiOrder: boolean;
        completedAt: Date;
        items: {
            id: string;
            name: string;
            price: string;
            notes: string;
            orderId: string;
            menuItemId: string;
            quantity: number;
            subtotal: string;
        }[];
    }[]>;
    getById(id: string, tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
        tableId: string;
        tableNumber: number;
        totalAmount: string;
        notes: string;
        customerName: string;
        assignedTo: string;
        isAiOrder: boolean;
        completedAt: Date;
        items: {
            id: string;
            name: string;
            price: string;
            notes: string;
            orderId: string;
            menuItemId: string;
            quantity: number;
            subtotal: string;
        }[];
    }>;
    updateStatus(id: string, tenantId: string, status: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        tableId: string;
        tableNumber: number;
        status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
        totalAmount: string;
        notes: string;
        customerName: string;
        assignedTo: string;
        isAiOrder: boolean;
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date;
    }>;
};
//# sourceMappingURL=order.service.d.ts.map