import { create } from 'zustand';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  role: string;
  salesId: string;
  organizationId: string;
  branchId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (orgSlug: string, salesId: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('ordera_token'),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (orgSlug, salesId, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ access_token: string; user: User }>('/auth/login', {
        orgSlug,
        salesId,
        password,
      });

      Cookies.set('ordera_token', response.access_token, { expires: 7 });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    Cookies.remove('ordera_token');
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
