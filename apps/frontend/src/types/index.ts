export type UserRole = 'super_admin' | 'owner' | 'manager' | 'waiter' | 'chef'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type Plan = 'basic' | 'pro' | 'business'
export type MenuItemStatus = 'available' | 'unavailable' | 'out_of_stock'

export interface User {
  id: string
  tenantId: string | null
  name: string
  email: string
  role: UserRole
  isActive: boolean
  avatar?: string
  lastLoginAt?: string
  createdAt: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  phone?: string
  address?: string
  plan: Plan
  isActive: boolean
  settings: {
    primaryColor: string
    currency: string
    language: string
    taxPercent: number
  }
  createdAt: string
}

export interface Category {
  id: string
  tenantId: string
  name: string
  nameEn?: string
  icon?: string
  image?: string
  sortOrder: number
  isActive: boolean
}

export interface MenuItem {
  id: string
  tenantId: string
  categoryId?: string
  name: string
  nameEn?: string
  description?: string
  price: string
  image?: string
  status: MenuItemStatus
  isPopular: boolean
  isFeatured: boolean
  preparationTime: number
  totalOrders: number
  ratingCount: number
  createdAt: string
}

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  price: string
  quantity: number
  notes?: string
  subtotal: string
}

export interface Order {
  id: string
  tenantId: string
  tableNumber?: number
  status: OrderStatus
  totalAmount: string
  notes?: string
  customerName?: string
  isAiOrder: boolean
  items: OrderItem[]
  createdAt: string
  updatedAt: string
  paymentStatus: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}