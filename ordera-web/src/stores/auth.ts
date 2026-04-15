import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  salesId: string;
  role: string;
  organizationId: string;
  branchId: string;
  subdomain: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        Cookies.set("ordera_token", token, { expires: 1, secure: true, sameSite: 'strict' });
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove("ordera_token");
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = "/";
      },
    }),
    {
      name: "ordera-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
