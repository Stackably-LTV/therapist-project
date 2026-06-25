import { create } from 'zustand';
export const useChatQuickActionsStore = create((set) => ({
    open: false,
    view: 'menu',
    openMenu: () => set({ open: true, view: 'menu' }),
    openView: (view) => set({ open: true, view }),
    close: () => set({ open: false, view: 'menu' }),
}));
