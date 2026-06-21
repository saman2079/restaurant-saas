import { apiClient } from "./client";
import { ApiResponse, Order } from "@/types";

export const orderApi = {
  getAll: async (
    slug: string,
    params?: { status?: string; page?: number; limit?: number },
  ) => {
    const { data } = await apiClient.get<ApiResponse<Order[]>>(
      `/${slug}/orders`,
      { params },
    );
    return data.data;
  },

  getById: async (slug: string, id: string) => {
    const { data } = await apiClient.get<ApiResponse<Order>>(
      `/${slug}/orders/${id}`,
    );
    return data.data;
  },

  // مشتری - بدون auth
  getByIdPublic: async (slug: string, id: string) => {
    const { data } = await apiClient.get<ApiResponse<Order>>(
      `/${slug}/orders/public/${id}`,
    );
    return data.data;
  },

  create: async (
    slug: string,
    payload: {
      tableNumber?: number;
      items: { menuItemId: string; quantity: number }[];
    },
  ) => {
    const { data } = await apiClient.post<ApiResponse<Order>>(
      `/${slug}/orders`,
      payload,
    );
    return data.data; // ← باید order رو برگردونه با items
  },

  // مشتری - ویرایش آیتم‌ها قبل از تایید
  updateItems: async (
    slug: string,
    id: string,
    items: { menuItemId: string; quantity: number; notes?: string }[],
  ) => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(
      `/${slug}/orders/${id}/items`,
      { items },
    );
    return data.data;
  },

  updateStatus: async (
    slug: string,
    id: string,
    status: string,
    rejectionReason?: string,
  ) => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(
      `/${slug}/orders/${id}/status`,
      { status, rejectionReason },
    );
    return data.data;
  },
};
