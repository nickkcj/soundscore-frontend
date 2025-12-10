import Cookies from 'js-cookie';
import type { AuthTokens, ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Token management
export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const getAccessToken = () => Cookies.get(TOKEN_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY);

export const setTokens = (tokens: AuthTokens) => {
  Cookies.set(TOKEN_KEY, tokens.access_token, { expires: 1 / 48 }); // 30 min
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh_token, { expires: 7 }); // 7 days
};

export const clearTokens = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// Custom error class
export class ApiException extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = 'ApiException';
  }
}

// Refresh token logic
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const tokens: AuthTokens = await response.json();
    setTokens(tokens);
    return tokens.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// Main fetch wrapper
interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth header if not skipped
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiException(401, 'Session expired');
      }
    } else {
      // Wait for token refresh
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (token) => {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          try {
            const retryResponse = await fetch(url, { ...fetchOptions, headers });
            if (!retryResponse.ok) {
              const error: ApiError = await retryResponse.json();
              reject(new ApiException(retryResponse.status, error.detail));
            }
            resolve(await retryResponse.json());
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const error: ApiError = await response.json();
      errorDetail = error.detail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new ApiException(response.status, errorDetail);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),

  // Form data for file uploads
  postForm: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiException(response.status, error.detail);
    }

    return response.json();
  },
};

// Auth-specific API calls
export const authApi = {
  login: async (username: string, password: string): Promise<AuthTokens> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiException(response.status, error.detail);
    }

    const tokens: AuthTokens = await response.json();
    setTokens(tokens);
    return tokens;
  },

  register: async (username: string, email: string, password: string) => {
    return api.post('/auth/register', { username, email, password }, { skipAuth: true });
  },

  logout: () => {
    clearTokens();
  },

  getMe: () => api.get<import('@/types').User>('/auth/me'),

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return api.post('/auth/forgot-password', { email }, { skipAuth: true });
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return api.post('/auth/reset-password', { token, new_password: newPassword }, { skipAuth: true });
  },
};

// Home page API calls (public endpoints)
export const homeApi = {
  getTopAlbums: (limit = 6) =>
    api.get<import('@/types').TopAlbumsResponse>(`/home/top-albums?limit=${limit}`, { skipAuth: true }),

  getRecentReviews: (limit = 6) =>
    api.get<import('@/types').RecentReviewsResponse>(`/home/recent-reviews?limit=${limit}`, { skipAuth: true }),

  getTrendingAlbums: (limit = 6) =>
    api.get<import('@/types').TrendingAlbumsResponse>(`/home/trending-albums?limit=${limit}`, { skipAuth: true }),
};
