const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

// getToken/setToken are no longer used for Auth as we transitioned to HttpOnly cookies.
// They are kept as stubs for backward compatibility if other code imports them.
export const getToken = () => null;
export const setToken = (token: string) => {};
export const clearToken = () => {};

async function request<T>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include', // Mandatory for HttpOnly cookies
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      clearToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `Request failed with status ${response.status}` };
      }
      throw new Error(errorData.message || 'API Request failed');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 15s');
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: any) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: any) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
