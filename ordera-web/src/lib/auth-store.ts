import { create } from 'zustand';
import { api } from './api';

interface AuthState {
  user: any | null;
  organization: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<any>;
  register: (formData: any) => Promise<any>;
  loginWithGoogle: (googleToken: string) => Promise<{ requiresRegistration: boolean; data?: any; user?: any } | undefined>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}


export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data: any = await api.post('/api/auth/login', { email, password });
      set({ 
        user: data.user, 
        organization: data.organization, 
        isAuthenticated: true,
        isLoading: false 
      });
      return data.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (formData: any) => {
    set({ isLoading: true });
    try {
      const data: any = await api.post('/api/auth/register', formData);
      set({ 
        user: data.user, 
        organization: data.organization, 
        isAuthenticated: true,
        isLoading: false 
      });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async (googleToken: string) => {
    set({ isLoading: true });
    try {
      const data: any = await api.post('/api/auth/google', { token: googleToken });
      
      if (data.requiresRegistration) {
        set({ isLoading: false });
        return { requiresRegistration: true, data: data.prefilledData };
      }

      if (data.user) {
        set({ 
          user: data.user, 
          organization: data.organization, 
          isAuthenticated: true,
          isLoading: false 
        });
        return { requiresRegistration: false, user: data.user };
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },


  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    }
    set({ 
      user: null, 
      organization: null, 
      isAuthenticated: false 
    });
    if (typeof window !== 'undefined') window.location.href = '/login';
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const data: any = await api.get('/api/auth/me');
      set({ 
        user: data, 
        // Note: Organization might need a separate fetch in Stage 3 but using current user context
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
