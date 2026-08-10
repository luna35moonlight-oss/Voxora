import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@voxora/contracts';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  onboardingStatus: string | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);

  const loadOnboarding = async (accessToken: string) => {
    try {
      const state = await apiClient.onboardingState(accessToken);
      setOnboardingStatus(state.status);
    } catch {
      setOnboardingStatus(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshToken = await secureSessionStore.getRefreshToken();
        if (!refreshToken) {
          if (!cancelled) setStatus('signedOut');
          return;
        }
        const session = await apiClient.refresh(refreshToken);
        await secureSessionStore.saveTokens(
          session.tokens.accessToken,
          session.tokens.refreshToken,
        );
        if (!cancelled) {
          setUser(session.user);
          setStatus('signedIn');
          await loadOnboarding(session.tokens.accessToken);
        }
      } catch {
        await secureSessionStore.clear();
        if (!cancelled) {
          setUser(null);
          setStatus('signedOut');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      onboardingStatus,
      async refreshProfile() {
        const access = await secureSessionStore.getAccessToken();
        if (!access) return;
        const me = await apiClient.me(access);
        setUser({
          id: me.id,
          email: me.email,
          emailVerified: me.emailVerified,
          roles: me.roles as AuthUser['roles'],
          mfaEnabled: me.mfaEnabled,
        });
        await loadOnboarding(access);
      },
      async signIn(email, password) {
        setError(null);
        const session = await apiClient.login(email, password);
        if (session.status === 'mfa_enrollment_required') {
          throw new Error(
            'Privileged MFA enrollment required before access. Complete MFA in the security flow.',
          );
        }
        if (session.status === 'mfa_required') {
          throw new Error('Privileged MFA challenge required before access.');
        }
        await secureSessionStore.saveTokens(
          session.tokens.accessToken,
          session.tokens.refreshToken,
        );
        setUser(session.user);
        setStatus('signedIn');
        await loadOnboarding(session.tokens.accessToken);
      },
      async register(email, password) {
        setError(null);
        const session = await apiClient.register(email, password);
        await secureSessionStore.saveTokens(
          session.tokens.accessToken,
          session.tokens.refreshToken,
        );
        setUser(session.user);
        setStatus('signedIn');
        await loadOnboarding(session.tokens.accessToken);
      },
      async signOut() {
        await secureSessionStore.clear();
        setUser(null);
        setOnboardingStatus(null);
        setStatus('signedOut');
      },
    }),
    [status, user, error, onboardingStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
