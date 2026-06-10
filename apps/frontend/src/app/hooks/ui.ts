
import { create } from "zustand";

type UIState = {
  scrollContainer: HTMLDivElement | null;
  setScrollContainer: (el: HTMLDivElement | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  scrollContainer: null,
  setScrollContainer: (el) => set({ scrollContainer: el }),
}));