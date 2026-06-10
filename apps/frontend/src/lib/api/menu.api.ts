import { apiClient } from './client'
import { ApiResponse, Category, MenuItem } from '@/types'

export const menuApi = {
  getFullMenu: async (slug: string) => {
    const { data } = await apiClient.get<ApiResponse<(Category & { items: MenuItem[] })[]>>(
      `api/${slug}/menu/full`
    )
    return data.data
  },

  getCategories: async (slug: string) => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>(`api/${slug}/menu/categories`)
    return data.data
  },

  createCategory: async (slug: string, payload: Partial<Category>) => {
    const { data } = await apiClient.post<ApiResponse<Category>>(`api/${slug}/menu/categories`, payload)
    return data.data
  },

  updateCategory: async (slug: string, id: string, payload: Partial<Category>) => {
    const { data } = await apiClient.patch<ApiResponse<Category>>(`api/${slug}/menu/categories/${id}`, payload)
    return data.data
  },

  deleteCategory: async (slug: string, id: string) => {
    await apiClient.delete(`/${slug}/menu/categories/${id}`)
  },

  getItems: async (slug: string, categoryId?: string) => {
    const { data } = await apiClient.get<ApiResponse<MenuItem[]>>(`api/${slug}/menu/items`, {
      params: { categoryId },
    })
    return data.data
  },

  createItem: async (slug: string, payload: Partial<MenuItem>) => {
    const { data } = await apiClient.post<ApiResponse<MenuItem>>(`api/${slug}/menu/items`, payload)
    return data.data
  },

  updateItem: async (slug: string, id: string, payload: Partial<MenuItem>) => {
    const { data } = await apiClient.patch<ApiResponse<MenuItem>>(`api/${slug}/menu/items/${id}`, payload)
    return data.data
  },

  deleteItem: async (slug: string, id: string) => {
    await apiClient.delete(`api/${slug}/menu/items/${id}`)
  },
}