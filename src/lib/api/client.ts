import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from './accessToken';
import { usesBearerTokenAuth } from './authMode';
import { refreshToken } from './auth';
import { resolveApiBaseURL } from './baseUrl';

export { clearAccessToken, setAccessToken } from './accessToken';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type QueueEntry = {
  resolve: () => void;
  reject: (reason: unknown) => void;
};

const baseURL = resolveApiBaseURL();

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (!usesBearerTokenAuth()) {
    return config;
  }
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: QueueEntry[] = [];

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register')
  );
}

function redirectToLogin(): void {
  const { pathname } = window.location;
  if (pathname === '/login' || pathname === '/register') return;
  window.location.assign('/login');
}

function flushQueue(error: unknown | null): void {
  const queue = pendingQueue;
  pendingQueue = [];
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
}

function shouldAttemptRefresh(): boolean {
  if (usesBearerTokenAuth()) {
    return Boolean(getAccessToken());
  }
  return true;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (!shouldAttemptRefresh()) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(apiClient(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshToken();
      flushQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
