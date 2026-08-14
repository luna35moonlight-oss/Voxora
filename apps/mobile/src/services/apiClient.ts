import Constants from 'expo-constants';
import type {
  AuthResponse,
  CompleteWhiteWolfAttemptRequest,
  CompleteWhiteWolfAttemptResponse,
  CurrentAvatarResponse,
  EquipAvatarItemRequest,
  LoginResponse,
  SelectAvatarRequest,
  StartWhiteWolfAttemptResponse,
  UnequipAvatarItemRequest,
  WhiteWolfGameStatusResponse,
} from '@voxora/contracts';

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

function auth(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export const apiClient = {
  health: () => request<{ status: string; service: string }>('/health'),
  register: (email: string, password: string) =>
    request<AuthResponse & { emailDeliveryStatus?: string; devVerificationToken?: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    ),
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
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
      onboardingStage?: string | null;
      onboardingStatus?: string | null;
    }>('/users/me', {
      headers: auth(accessToken),
    }),
  featureFlags: () => request<Array<{ key: string; enabled: boolean }>>('/feature-flags'),
  onboardingState: (accessToken: string) =>
    request<{
      currentStage: string;
      status: string;
      nextAllowedActions: string[];
      emailVerified: boolean;
      phoneVerified: boolean;
      username: string | null;
      handoff: { note: string };
    }>('/onboarding/state', { headers: auth(accessToken) }),
  requestEmailVerification: (accessToken: string) =>
    request<{ deliveryStatus: string; devVerificationToken?: string }>(
      '/onboarding/email/request',
      { method: 'POST', headers: auth(accessToken) },
    ),
  confirmEmailVerification: (accessToken: string, token: string) =>
    request('/onboarding/email/confirm', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ token }),
    }),
  setUsername: (accessToken: string, username: string) =>
    request('/onboarding/username', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ username }),
    }),
  setPrivacy: (
    accessToken: string,
    body: { emailVisibility: 'PRIVATE' | 'PUBLIC'; phoneVisibility: 'PRIVATE' | 'PUBLIC' },
  ) =>
    request('/onboarding/privacy', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify(body),
    }),
  setRegionLocale: (
    accessToken: string,
    body: {
      countryCode: string;
      locale: string;
      timeZone: string;
      displayCurrency: string;
      regionCode?: string;
    },
  ) =>
    request('/onboarding/region-locale', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify(body),
    }),
  setPhone: (accessToken: string, phone: string) =>
    request('/onboarding/phone', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ phone }),
    }),
  requestPhoneOtp: (accessToken: string) =>
    request<{ deliveryStatus: string; devOtp?: string }>('/onboarding/phone/otp/request', {
      method: 'POST',
      headers: auth(accessToken),
    }),
  confirmPhoneOtp: (accessToken: string, code: string) =>
    request('/onboarding/phone/otp/confirm', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ code }),
    }),
  setInterests: (accessToken: string, providers: string[]) =>
    request('/onboarding/interests', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ providers }),
    }),
  confirmAgeGate: (accessToken: string) =>
    request('/onboarding/age-gate', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ confirmed18Plus: true, ruleVersion: 'age-gate-v1' }),
    }),
  grantConsents: (
    accessToken: string,
    consents: Array<{
      consentType: string;
      policyVersion: string;
      status: 'GRANTED' | 'DENIED';
      platform: string;
    }>,
  ) =>
    request('/onboarding/consents', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ consents }),
    }),
  selectSubscription: (
    accessToken: string,
    productCode: string,
    storefront: 'APPLE' | 'GOOGLE' | 'INTERNAL',
  ) =>
    request('/onboarding/subscription', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify({ productCode, storefront }),
    }),
  settings: (accessToken: string) => request('/settings', { headers: auth(accessToken) }),
  catalogue: () => request('/catalogue/products'),
  entitlements: (accessToken: string) =>
    request('/entitlements/me', { headers: auth(accessToken) }),
  whiteWolfStatus: (accessToken: string) =>
    request<WhiteWolfGameStatusResponse>('/games/white-wolf-moon-dash/me', {
      headers: auth(accessToken),
    }),
  startWhiteWolfAttempt: (accessToken: string) =>
    request<StartWhiteWolfAttemptResponse>('/games/white-wolf-moon-dash/attempts/start', {
      method: 'POST',
      headers: auth(accessToken),
    }),
  completeWhiteWolfAttempt: (
    accessToken: string,
    attemptId: string,
    body: CompleteWhiteWolfAttemptRequest,
  ) =>
    request<CompleteWhiteWolfAttemptResponse>(
      `/games/white-wolf-moon-dash/attempts/${attemptId}/complete`,
      {
        method: 'POST',
        headers: auth(accessToken),
        body: JSON.stringify(body),
      },
    ),
  avatarMe: (accessToken: string) =>
    request<CurrentAvatarResponse>('/avatars/me', {
      headers: auth(accessToken),
    }),
  selectAvatar: (accessToken: string, body: SelectAvatarRequest) =>
    request<CurrentAvatarResponse>('/avatars/select', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify(body),
    }),
  equipAvatarItem: (accessToken: string, body: EquipAvatarItemRequest) =>
    request<CurrentAvatarResponse>('/avatars/equip', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify(body),
    }),
  unequipAvatarItem: (accessToken: string, body: UnequipAvatarItemRequest) =>
    request<CurrentAvatarResponse>('/avatars/unequip', {
      method: 'POST',
      headers: auth(accessToken),
      body: JSON.stringify(body),
    }),
};
