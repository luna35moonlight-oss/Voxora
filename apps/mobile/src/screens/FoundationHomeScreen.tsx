import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../services/apiClient';
import type { ConnectivityState } from '../hooks/useConnectivity';
import { notificationArchitecture } from '../services/notificationArchitecture';

export function FoundationHomeScreen({
  connectivity,
  onOpenSettings,
}: {
  connectivity: ConnectivityState;
  onOpenSettings: () => void;
}) {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<string>('checking…');
  const [flags, setFlags] = useState<string>('loading…');
  const [subscription, setSubscription] = useState<string>('loading…');

  useEffect(() => {
    void (async () => {
      try {
        const h = await apiClient.health();
        setHealth(`${h.service}: ${h.status}`);
      } catch {
        setHealth('API unreachable (honest failure)');
      }
      try {
        const f = await apiClient.featureFlags();
        setFlags(f.map((x) => x.key).join(', ') || 'none enabled');
      } catch {
        setFlags('unavailable');
      }
      try {
        const products = (await apiClient.catalogue()) as Array<{
          code: string;
          pricing: { amountMinor: number; currency: string } | null;
        }>;
        setSubscription(
          products
            .map((p) =>
              p.pricing
                ? `${p.code} ${p.pricing.currency} ${(p.pricing.amountMinor / 100).toFixed(0)}`
                : p.code,
            )
            .join(' · '),
        );
      } catch {
        setSubscription('catalogue unavailable');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.brand} accessibilityRole="header">
        VOXORA
      </Text>
      <Text style={styles.title}>Account foundation ready</Text>
      <Text style={styles.body}>
        Phase 2 complete for this account path — avatar/pet systems belong to a later phase. No
        Bondfire conversations, pets, or fake Connected providers here.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <Text style={styles.meta}>
          Roles: {user?.roles.join(', ')} · Email verified: {user?.emailVerified ? 'yes' : 'no'} ·
          MFA enabled: {user?.mfaEnabled ? 'yes' : 'not yet'}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>API health</Text>
        <Text style={styles.value}>{health}</Text>
        <Text style={styles.meta}>Connectivity: {connectivity}</Text>
        <Text style={styles.meta}>Feature flags: {flags}</Text>
        <Text style={styles.meta}>Catalogue: {subscription}</Text>
        <Text style={styles.meta}>
          Notifications interface: {notificationArchitecture.describe()}
        </Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.button}>
        <Text style={styles.buttonText}>Open settings</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={[styles.button, styles.secondary]}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  brand: {
    color: colors.brand.blue,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    marginTop: spacing.xs,
  },
  body: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  panel: {
    backgroundColor: colors.background.elevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  label: { color: colors.text.muted, fontSize: typography.size.sm },
  value: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    marginTop: spacing.xxs,
  },
  meta: { color: colors.text.secondary, marginTop: spacing.xs, fontSize: typography.size.sm },
  button: {
    backgroundColor: colors.brand.purple,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondary: {
    backgroundColor: colors.background.soft,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  buttonText: { color: colors.text.primary, fontWeight: typography.weight.semibold },
});
