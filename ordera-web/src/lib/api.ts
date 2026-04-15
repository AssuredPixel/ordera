import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth token and multi-tenancy headers
api.interceptors.request.use((config) => {
  const token = Cookies.get("ordera_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Multi-tenancy headers can be useful for additional API-side checks
  // (though the API primarily uses the JWT payload)
  return config;
});

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid redirect loops if already on login
      if (!window.location.pathname.includes("/login")) {
        const subdomain = window.location.pathname.split('/')[1] || 'demo';
        Cookies.remove("ordera_token");
        window.location.href = `/${subdomain}/login`;
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);
