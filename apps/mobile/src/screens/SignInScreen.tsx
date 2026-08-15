import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import { useAuth } from '../auth/AuthContext';

export function SignInScreen({ onOpenRiveValidation }: { onOpenRiveValidation?: () => void }) {
  const { signIn, register, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = async (mode: 'login' | 'register') => {
    setBusy(true);
    setLocalError(null);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand} accessibilityRole="header">
        VOXORA
      </Text>
      <Text style={styles.subtitle}>Enter Voxora</Text>
      <Text style={styles.note}>
        Create a real account to begin resumable onboarding. Email and phone are never Verified
        until verification succeeds. No fake success states.
      </Text>

      <TextInput
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        accessibilityLabel="Password"
        secureTextEntry
        placeholder="Password (min 10)"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {(localError || error) && (
        <Text style={styles.error} accessibilityRole="alert">
          {localError || error}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void onSubmit('login')}
        style={[styles.button, styles.primary]}
      >
        {busy ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void onSubmit('register')}
        style={[styles.button, styles.secondary]}
      >
        <Text style={styles.buttonText}>Create account</Text>
      </Pressable>

      {(__DEV__ || process.env.EXPO_PUBLIC_ENABLE_RIVE_HARNESS === '1') && onOpenRiveValidation ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenRiveValidation}
          style={[styles.button, styles.secondary]}
          testID="open-rive-native-validation"
        >
          <Text style={styles.buttonText}>Native Rive validation harness</Text>
        </Pressable>
      ) : null}
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
    color: colors.brand.purple,
    fontSize: typography.size.hero,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    marginTop: spacing.sm,
  },
  note: {
    color: colors.text.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.size.sm,
  },
  input: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.subtle,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primary: { backgroundColor: colors.brand.pink },
  secondary: {
    backgroundColor: colors.background.soft,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  buttonText: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  error: {
    color: colors.state.error,
    marginBottom: spacing.sm,
  },
});
