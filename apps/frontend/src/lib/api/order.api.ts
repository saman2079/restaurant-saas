import { ApiResponse, Order } from '@/types';
import { apiClient } from './client'

export const orderApi = {
  getAll: async (slug: string, params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<ApiResponse<Order[]>>(`/${slug}/orders`, { params })
    return data.data
  },

  getById: async (slug: string, id: string) => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/${slug}/orders/${id}`)
    return data.data
  },

  create: async (slug: string, payload: {
    tableNumber?: number
    customerName?: string
    notes?: string
    items: { menuItemId: string; quantity: number; notes?: string }[]
  }) => {
    const { data } = await apiClient.post<ApiResponse<Order>>(`/${slug}/orders`, payload)
    return data.data
  },

  updateStatus: async (slug: string, id: string, status: string) => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(
      `/${slug}/orders/${id}/status`,
      { status }
    )
    return data.data
  },
}