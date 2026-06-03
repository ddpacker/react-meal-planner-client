import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { refreshToken } from './auth';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type QueueEntry = {
  resolve: () => void;
  reject: (reason: unknown) => void;
};

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
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
