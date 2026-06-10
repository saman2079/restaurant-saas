import { ApiResponse, User } from '@/src/types';
import { apiClient } from './client'

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<{ token: string; user: User }>>('api/auth/login', {
      email,
      password,
    })
    return data.data
  },

  logout: async () => {
    await apiClient.post('api/auth/logout')
  },

  getMe: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me')
    return data.data
  },
}