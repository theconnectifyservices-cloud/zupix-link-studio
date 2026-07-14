import { create } from "zustand";
import type { Role } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  status: "unknown" | "authenticated" | "unauthenticated";
  setUser: (u: AuthUser | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "unknown",
  setUser: (user) => set({ user, status: user ? "authenticated" : "unauthenticated" }),
  reset: () => set({ user: null, status: "unauthenticated" }),
}));
