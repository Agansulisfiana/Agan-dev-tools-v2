import { create } from "zustand";
import type { ToolInfo } from "@/lib/tools-data";
import { getToolById } from "@/lib/tools-data";

interface AppState {
  activeToolId: string;
  sidebarOpen: boolean;
  searchOpen: boolean;
  setActiveTool: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  activeTool: () => ToolInfo | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeToolId: "json-formatter",
  sidebarOpen: false,
  searchOpen: false,
  setActiveTool: (id) => set({ activeToolId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  activeTool: () => getToolById(get().activeToolId),
}));