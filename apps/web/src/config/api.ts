import axios from 'axios';
import { useAuthStore } from '../store/authStore';

import * as Sentry from '@sentry/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Create a Sentry custom span to measure performance
  const span = Sentry.startInactiveSpan({
    name: `API Call: ${config.method?.toUpperCase()} ${config.url}`,
    op: 'http.client',
    attributes: {
      url: config.url,
      method: config.method,
    }
  });

  if (span) {
    (config as any).__sentry_span__ = span;
  }

  // Add Breadcrumb for better debugging context
  Sentry.addBreadcrumb({
    category: 'api',
    message: `Requesting ${config.url}`,
    level: 'info',
    data: {
      method: config.method,
      url: config.url,
      params: config.params,
    }
  });

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // End custom span on success
    const span = (response.config as any).__sentry_span__;
    if (span) {
      span.setAttribute('http.status_code', response.status);
      span.end();
    }
    return response;
  },
  (error) => {
    // End custom span and add error breadcrumb on failure
    const span = (error.config as any)?.__sentry_span__;
    if (span) {
      span.setAttribute('http.status_code', error.response?.status || 500);
      span.end();
    }
    
    Sentry.addBreadcrumb({
      category: 'api',
      message: `API request failed: ${error.config?.url}`,
      level: 'error',
      data: {
        status: error.response?.status,
        message: error.message
      }
    });
    
    return Promise.reject(error);
  }
);

// Backward-compatible apiFetch wrapper utilizing axios internally
export async function apiFetch(path: string, options: RequestInit = {}) {
  try {
    const response = await apiClient({
      url: path,
      method: options.method || 'GET',
      headers: options.headers as Record<string, string>,
      data: options.body && typeof options.body === 'string' ? JSON.parse(options.body) : options.body,
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    throw new Error(err.response?.data?.message || err.message || 'API request failed');
  }
}
