import { apiClient } from './client'
import { ApiResponse, Tenant } from '@/types'

export const tenantApi = {
  getAll: async (page = 1, search?: string) => {
    const { data } = await apiClient.get<ApiResponse<Tenant[]>>('/super/tenants', {
      params: { page, search },
    })
    return data
  },

  getBySlug: async (slug: string) => {
    const { data } = await apiClient.get<ApiResponse<Tenant>>(`/super/tenants/${slug}`)
    return data.data
  },

  create: async (payload: {
    name: string
    ownerName: string
    ownerEmail: string
    ownerPassword: string
    plan?: string
  }) => {
    const { data } = await apiClient.post<ApiResponse<Tenant>>('/super/tenants', payload)
    return data.data
  },

  update: async (id: string, payload: Partial<Tenant>) => {
    const { data } = await apiClient.patch<ApiResponse<Tenant>>(`/super/tenants/${id}`, payload)
    return data.data
  },

  toggleActive: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Tenant>>(`/super/tenants/${id}/toggle`)
    return data.data
  },
}