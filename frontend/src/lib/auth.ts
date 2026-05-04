import { create } from 'zustand';
import { apiFetch } from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email, password) => {
    set({ isLoading: true });
    await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user = await apiFetch<User>('/auth/me');
    set({ user, isLoading: false });
  },
  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    set({ user: null });
  },
  refresh: async () => {
    try {
      const user = await apiFetch<User>('/auth/me');
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
