"use client";

import { create } from "zustand";

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  activeSection: "stream",

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((s : any) => ({ isSidebarOpen: !s.isSidebarOpen })),

  setActiveSection: (section :any) => set({ activeSection: section }),
  toggleActiveSection: () =>
    set((s : any) => ({
      activeSection: s.activeSection === "stream" ? "chat" : "stream",
    })),
}));


