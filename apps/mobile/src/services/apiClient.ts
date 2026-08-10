import Constants from 'expo-constants';
import type { AuthResponse } from '@voxora/contracts';

const apiUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://127.0.0.1:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}/v1${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export const apiClient = {
  health: () => request<{ status: string; service: string }>('/health'),
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  me: (accessToken: string) =>
    request<{
      id: string;
      email: string;
      emailVerified: boolean;
      roles: string[];
      mfaEnabled: boolean;
    }>('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  featureFlags: () => request<Array<{ key: string; enabled: boolean }>>('/feature-flags'),
};
