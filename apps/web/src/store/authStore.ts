import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
  setSession: (token: string, walletAddress: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      walletAddress: null,
      isAuthenticated: false,
      setSession: (token, walletAddress) =>
        set({
          token,
          walletAddress: walletAddress.toLowerCase(),
          isAuthenticated: true,
        }),
      clearSession: () =>
        set({
          token: null,
          walletAddress: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'dworkspace-auth-session', // LocalStorage cache key
    },
  ),
);
