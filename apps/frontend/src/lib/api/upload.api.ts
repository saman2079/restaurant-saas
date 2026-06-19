import { apiClient } from './client'

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const { data } = await apiClient.post<{ success: boolean; data: { url: string } }>(
      '/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    // url کامل برگردون
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000/api'
    return `${baseUrl}${data.data.url}`
  },
}