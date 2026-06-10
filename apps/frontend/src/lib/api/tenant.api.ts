import { apiClient } from './client'
import { ApiResponse, Tenant } from '@/src/types'

export const tenantApi = {
  getAll: async (page = 1, search?: string) => {
    const { data } = await apiClient.get<ApiResponse<Tenant[]>>('api/super/tenants', {
      params: { page, search },
    })
    return data
  },

  getBySlug: async (slug: string) => {
    const { data } = await apiClient.get<ApiResponse<Tenant>>(`api/super/tenants/${slug}`)
    return data.data
  },

  create: async (payload: {
    name: string
    ownerName: string
    ownerEmail: string
    ownerPassword: string
    plan?: string
  }) => {
    const { data } = await apiClient.post<ApiResponse<Tenant>>('api/super/tenants', payload)
    return data.data
  },

  update: async (id: string, payload: Partial<Tenant>) => {
    const { data } = await apiClient.patch<ApiResponse<Tenant>>(`api/super/tenants/${id}`, payload)
    return data.data
  },

  toggleActive: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Tenant>>(`api/super/tenants/${id}/toggle`)
    return data.data
  },
}