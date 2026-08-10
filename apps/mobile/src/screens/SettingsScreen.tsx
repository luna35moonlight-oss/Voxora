import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const access = await secureSessionStore.getAccessToken();
        if (!access) return;
        setData((await apiClient.settings(access)) as Record<string, unknown>);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      }
    })();
  }, []);

  if (!data && !error) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.brand.purple} />
      </View>
    );
  }

  const account = (data?.account ?? {}) as Record<string, unknown>;
  const privacy = (data?.privacy ?? {}) as Record<string, unknown>;
  const region = (data?.region ?? {}) as Record<string, unknown>;
  const phone = (data?.phone ?? {}) as Record<string, unknown>;
  const security = (data?.security ?? {}) as Record<string, unknown>;
  const subscription = (data?.subscription ?? null) as Record<string, unknown> | null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand} accessibilityRole="header">
        VOXORA
      </Text>
      <Text style={styles.title}>Account settings</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.section}>Profile</Text>
      <Text style={styles.row}>Email: {String(account.email ?? '')}</Text>
      <Text style={styles.row}>Username: {String(data?.username ?? '—')}</Text>
      <Text style={styles.row}>
        Email verified: {account.emailVerified ? 'yes' : 'no'} · Phone verified:{' '}
        {phone.verified ? 'yes' : 'no'}
      </Text>

      <Text style={styles.section}>Privacy</Text>
      <Text style={styles.row}>Email: {String(privacy.emailVisibility ?? 'PRIVATE')}</Text>
      <Text style={styles.row}>Phone: {String(privacy.phoneVisibility ?? 'PRIVATE')}</Text>

      <Text style={styles.section}>Region</Text>
      <Text style={styles.row}>
        {String(region.countryCode ?? '—')} · {String(region.locale ?? '—')} ·{' '}
        {String(region.timeZone ?? '—')} · {String(region.displayCurrency ?? '—')}
      </Text>

      <Text style={styles.section}>Security</Text>
      <Text style={styles.row}>MFA enabled: {security.mfaEnabled ? 'yes' : 'no'}</Text>

      <Text style={styles.section}>Subscription</Text>
      <Text style={styles.row}>
        {subscription
          ? `${String(subscription.productCode)} · ${String(subscription.status)} · paid=${String(subscription.paid)}`
          : 'None selected'}
      </Text>

      <Pressable accessibilityRole="button" onPress={onBack} style={styles.button}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background.base,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  brand: {
    color: colors.brand.blue,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    marginVertical: spacing.md,
  },
  section: {
    color: colors.brand.pink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: typography.weight.semibold,
  },
  row: { color: colors.text.secondary, marginBottom: spacing.xxs },
  error: { color: colors.state.error },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.background.soft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonText: { color: colors.text.primary, fontWeight: typography.weight.semibold },
});
