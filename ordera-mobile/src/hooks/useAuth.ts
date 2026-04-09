import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { AuthUser, AuthResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('userData');
      const token = await SecureStore.getItemAsync('userToken');

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        // Verify token with API
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          await SecureStore.setItemAsync('userData', JSON.stringify(res.data));
        } catch (err) {
          // Token might be expired
          await logout();
        }
      }
    } catch (err) {
      console.error('Failed to load auth state', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (salesId: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      salesId,
      password,
    });

    const { access_token, user: userData } = response.data;

    await SecureStore.setItemAsync('userToken', access_token);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
  };

  return { user, loading, login, logout };
}
