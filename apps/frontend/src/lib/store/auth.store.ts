import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  tenantId: string | null
  name: string
  email: string
  role: string
  isActive: boolean
  avatar?: string
  tenantSlug?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  _hasHydrated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setHasHydrated: (val: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token })
      },

      clearAuth: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)