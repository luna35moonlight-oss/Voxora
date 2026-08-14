import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, motion, radius, spacing, typography } from '@voxora/design-system';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';

type OnboardingState = {
  currentStage: string;
  status: string;
  nextAllowedActions: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  username: string | null;
  handoff: { note: string };
};

export function OnboardingScreen({ onHandoffReady }: { onHandoffReady: () => void }) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const access = await secureSessionStore.getAccessToken();
    if (!access) return;
    const next = await apiClient.onboardingState(access);
    setState(next);
    if (next.status === 'HANDOFF_READY') {
      onHandoffReady();
    }
  }, [onHandoffReady]);

  useEffect(() => {
    void refresh().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load onboarding'),
    );
  }, [refresh]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const result = await action();
      if (result && typeof result === 'object' && 'deliveryStatus' in result) {
        const delivery = String((result as { deliveryStatus: string }).deliveryStatus);
        if (delivery === 'NOT_CONFIGURED') {
          setInfo(
            'Delivery provider is NOT_CONFIGURED — Voxora will not claim a message was sent.',
          );
        } else if (delivery === 'DEV_CAPTURED') {
          const r = result as { devVerificationToken?: string; devOtp?: string };
          if (r.devVerificationToken) setEmailToken(r.devVerificationToken);
          if (r.devOtp) setOtp(r.devOtp);
          setInfo('Dev capture transport accepted the request (not a production send).');
        }
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding action failed');
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.brand.pink} />
        <Text style={styles.note}>Restoring your Voxora onboarding…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand} accessibilityRole="header">
        VOXORA
      </Text>
      <Text style={styles.subtitle}>Your account foundation</Text>
      <Text style={styles.note}>
        Stage {state.currentStage.replaceAll('_', ' ')}. Close anytime — resume continues from the
        server, not the device.
      </Text>

      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {info && <Text style={styles.info}>{info}</Text>}

      {state.currentStage === 'EMAIL_VERIFICATION' && (
        <View style={styles.block}>
          <Text style={styles.label}>Verify email</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.secondary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.requestEmailVerification(access!);
              })
            }
          >
            <Text style={styles.buttonText}>Request verification</Text>
          </Pressable>
          <TextInput
            accessibilityLabel="Email verification token"
            style={styles.input}
            placeholder="Verification token"
            placeholderTextColor={colors.text.muted}
            value={emailToken}
            onChangeText={setEmailToken}
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.confirmEmailVerification(access!, emailToken);
              })
            }
          >
            <Text style={styles.buttonText}>Confirm email</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'USERNAME' && (
        <View style={styles.block}>
          <Text style={styles.label}>Choose a username</Text>
          <TextInput
            accessibilityLabel="Username"
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={colors.text.muted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.setUsername(access!, username);
              })
            }
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'PRIVACY' && (
        <View style={styles.block}>
          <Text style={styles.label}>Privacy defaults</Text>
          <Text style={styles.note}>Email and phone visibility default to PRIVATE.</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.setPrivacy(access!, {
                  emailVisibility: 'PRIVATE',
                  phoneVisibility: 'PRIVATE',
                });
              })
            }
          >
            <Text style={styles.buttonText}>Keep private & continue</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'REGION_LOCALE' && (
        <View style={styles.block}>
          <Text style={styles.label}>Region & locale</Text>
          <Text style={styles.note}>No GPS permission is requested for this step.</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.setRegionLocale(access!, {
                  countryCode: 'ZA',
                  locale: 'en-ZA',
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                  displayCurrency: 'ZAR',
                });
              })
            }
          >
            <Text style={styles.buttonText}>Save locale defaults</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'CONTACT_NUMBER' && (
        <View style={styles.block}>
          <Text style={styles.label}>Contact number</Text>
          <TextInput
            accessibilityLabel="Phone number"
            style={styles.input}
            placeholder="+27…"
            placeholderTextColor={colors.text.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.setPhone(access!, phone);
              })
            }
          >
            <Text style={styles.buttonText}>Save number</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'PHONE_VERIFICATION' && (
        <View style={styles.block}>
          <Text style={styles.label}>Phone verification</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.secondary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.requestPhoneOtp(access!);
              })
            }
          >
            <Text style={styles.buttonText}>Request OTP</Text>
          </Pressable>
          <TextInput
            accessibilityLabel="OTP code"
            style={styles.input}
            placeholder="6-digit code"
            placeholderTextColor={colors.text.muted}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.confirmPhoneOtp(access!, otp);
              })
            }
          >
            <Text style={styles.buttonText}>Confirm OTP</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'PROVIDER_INTERESTS' && (
        <View style={styles.block}>
          <Text style={styles.label}>Services you may want later</Text>
          <Text style={styles.note}>
            Selection means INTEREST_SELECTED — not Connected. No fake integrations.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.setInterests(access!, ['gmail', 'whatsapp']);
              })
            }
          >
            <Text style={styles.buttonText}>Save interests</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'AGE_GATE' && (
        <View style={styles.block}>
          <Text style={styles.label}>Age confirmation</Text>
          <Text style={styles.note}>Voxora launch is 18+. No minor accounts in this version.</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.confirmAgeGate(access!);
              })
            }
          >
            <Text style={styles.buttonText}>I confirm I am 18+</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'LEGAL_CONSENTS' && (
        <View style={styles.block}>
          <Text style={styles.label}>Legal agreements</Text>
          <Text style={styles.note}>
            Policy wording requires professional legal review. Separate consents — not one bundled
            checkbox.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const access = await secureSessionStore.getAccessToken();
                return apiClient.grantConsents(access!, [
                  {
                    consentType: 'terms_of_service',
                    policyVersion: 'tos-draft-v0',
                    status: 'GRANTED',
                    platform: 'mobile',
                  },
                  {
                    consentType: 'privacy_policy',
                    policyVersion: 'privacy-draft-v0',
                    status: 'GRANTED',
                    platform: 'mobile',
                  },
                ]);
              })
            }
          >
            <Text style={styles.buttonText}>Accept required consents</Text>
          </Pressable>
        </View>
      )}

      {state.currentStage === 'SUBSCRIPTION_SELECTION' && (
        <View style={styles.block}>
          <Text style={styles.label}>Choose a Voxora level</Text>
          <Text style={styles.note}>
            Selection records intent. Store billing is NOT_CONFIGURED until credentials exist — no
            fake Paid/Active.
          </Text>
          {(['level_1', 'level_2', 'level_3', 'level_4'] as const).map((code) => (
            <Pressable
              key={code}
              accessibilityRole="button"
              style={[styles.button, styles.secondary]}
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  const access = await secureSessionStore.getAccessToken();
                  return apiClient.selectSubscription(access!, code, 'INTERNAL');
                })
              }
            >
              <Text style={styles.buttonText}>{code.replace('_', ' ').toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {state.currentStage === 'AVATAR_PET_HANDOFF' && (
        <View style={styles.block}>
          <Text style={styles.label}>Handoff ready</Text>
          <Text style={styles.note}>{state.handoff.note}</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.primary]}
            onPress={onHandoffReady}
          >
            <Text style={styles.buttonText}>Continue to home</Text>
          </Pressable>
        </View>
      )}

      {busy && <ActivityIndicator color={colors.brand.blue} style={{ marginTop: spacing.md }} />}
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
    color: colors.brand.pink,
    fontSize: typography.size.hero,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    marginTop: spacing.xs,
  },
  note: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  block: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.brand.blue,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
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
    marginTop: spacing.xs,
  },
  primary: { backgroundColor: colors.brand.purple },
  secondary: {
    backgroundColor: colors.background.soft,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  buttonText: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  error: { color: colors.state.error, marginBottom: spacing.sm },
  info: { color: colors.state.info, marginBottom: spacing.sm },
});

// Intentional motion tokens referenced for future animated transitions.
void motion.normal;
