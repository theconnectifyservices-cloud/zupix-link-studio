import { create } from "zustand";

interface ShortcutsDialogState {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export const useShortcutsDialog = create<ShortcutsDialogState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
