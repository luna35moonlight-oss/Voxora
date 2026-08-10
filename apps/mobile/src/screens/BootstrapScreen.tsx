import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@voxora/design-system';
import type { ConnectivityState } from '../hooks/useConnectivity';

export function BootstrapScreen({ connectivity }: { connectivity: ConnectivityState }) {
  return (
    <View style={styles.container} accessibilityLabel="Voxora is starting">
      <Text style={styles.brand}>VOXORA</Text>
      <Text style={styles.tagline}>
        Your Voice. Your Avatar. Your Companion. Your World. All in One.
      </Text>
      <ActivityIndicator color={colors.brand.pink} style={{ marginTop: spacing.lg }} />
      <Text style={styles.meta}>Checking secure session… ({connectivity})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brand: {
    color: colors.brand.pink,
    fontSize: typography.size.hero,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
  },
  tagline: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    marginTop: spacing.sm,
    maxWidth: 420,
  },
  meta: {
    color: colors.text.muted,
    marginTop: spacing.md,
    fontSize: typography.size.sm,
  },
});
