import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i._id === item._id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      increase: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item._id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        })),

      decrease: (id) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item._id === id ? { ...item, quantity: item.quantity - 1 } : item
            )
            .filter((item) => item.quantity > 0),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item._id !== id),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalAmount: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);