import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateTokens: (tokens: AuthTokens) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      login: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
      logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
      updateTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'jenga-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
