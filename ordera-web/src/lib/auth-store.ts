import { create } from 'zustand';
import { api, setToken, clearToken } from './api';

interface AuthState {
  user: any | null;
  organization: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<any>;
  register: (formData: any) => Promise<any>;
  loginWithGoogle: (googleToken: string) => Promise<{ requiresRegistration: boolean; data?: any; user?: any } | undefined>;
  logout: () => void;
  loadUser: () => Promise<void>;
}


export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data: any = await api.post('/api/auth/login', { email, password });
      setToken(data.accessToken);
      set({ 
        user: data.user, 
        organization: data.organization, 
        token: data.accessToken, 
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
      setToken(data.accessToken);
      set({ 
        user: data.user, 
        organization: data.organization, 
        token: data.accessToken, 
        isAuthenticated: true,
        isLoading: false 
      });
      return data.user;
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

      if (data.accessToken) {
        setToken(data.accessToken);
        set({ 
          user: data.user, 
          organization: data.organization, 
          token: data.accessToken, 
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


  logout: () => {
    clearToken();
    set({ 
      user: null, 
      organization: null, 
      token: null, 
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
