import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiRequest } from "../app/api/client";
import type { AuthResponse, User } from "../lib/types";

type AuthMode = "login" | "register";

type AuthState = {
  token: string | null;
  user: User | null;
  error: string | null;
  loading: boolean;
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  hydrateUser: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      error: null,
      loading: false,
      mode: "login",
      setMode: (mode) => set({ mode, error: null }),
      clearError: () => set({ error: null }),
      login: async (payload) => {
        set({ loading: true, error: null });
        try {
          const response = await apiRequest<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          set({ token: response.accessToken, user: response.user, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to log in.", loading: false });
        }
      },
      register: async (payload) => {
        set({ loading: true, error: null });
        try {
          const response = await apiRequest<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          set({ token: response.accessToken, user: response.user, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to register.", loading: false });
        }
      },
      hydrateUser: async () => {
        if (!get().token) {
          return;
        }
        try {
          const user = await apiRequest<User>("/auth/me");
          set({ user });
        } catch {
          set({ token: null, user: null });
        }
      },
      logout: () => set({ token: null, user: null, error: null }),
    }),
    {
      name: "collab-editor-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
