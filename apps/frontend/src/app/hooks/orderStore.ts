import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrderItem {
  id: string;
  name: string;
  price: string;
  image?: string;
  quantity: number;
}

interface OrderState {
  orders: OrderItem[];

  showInvoice: boolean;

  invoiceData: any;                 // ⭐ اضافه شد
  setInvoiceData: (data: any) => void; // ⭐ اضافه شد

  addToCart: (item: Omit<OrderItem, "quantity">, qty: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeOrder: (id: string) => void;
  clearCart: () => void;

  openInvoice: () => void;
  closeInvoice: () => void;

  getQuantity: (id: string) => number;
  totalAmount: () => string;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      showInvoice: false,

      invoiceData: null,
      setInvoiceData: (data) => set({ invoiceData: data }),

      addToCart: (item, qty) =>
        set((state) => {
          const exists = state.orders.find((o) => o.id === item.id);

          if (exists) {
            return {
              orders: state.orders.map((o) =>
                o.id === item.id ? { ...o, quantity: qty } : o
              ),
            };
          }

          return {
            orders: [...state.orders, { ...item, quantity: qty }],
          };
        }),

      updateQty: (id, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { orders: state.orders.filter((o) => o.id !== id) };
          }

          return {
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, quantity: qty } : o
            ),
          };
        }),

      removeOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),

      clearCart: () => set({ orders: [] }),

      openInvoice: () => set({ showInvoice: true }),
      closeInvoice: () => set({ showInvoice: false }),

      getQuantity: (id) => {
        const found = get().orders.find((o) => o.id === id);
        return found ? found.quantity : 0;
      },

      totalAmount: () => {
        const total = get().orders.reduce((sum, item) => {
          const num = parseFloat(item.price.replace("$", ""));
          return sum + num * item.quantity;
        }, 0);
        return total.toFixed(2);
      },
    }),
    {
      name: "order-cart-storage",
    }
  )
);
