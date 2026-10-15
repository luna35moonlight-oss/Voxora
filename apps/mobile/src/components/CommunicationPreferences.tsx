import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommunicationAgreementSchema, type CommunicationAgreement } from '@voxora/contracts';
import { colors, radius, spacing } from '@voxora/design-system';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';

export function CommunicationPreferences() {
  const [draft, setDraft] = useState<CommunicationAgreement | null>(null);
  const [boundaries, setBoundaries] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function token() {
    const access = await secureSessionStore.getAccessToken();
    if (!access) throw new Error('Sign in again to manage preferences.');
    return access;
  }
  function apply(agreement: CommunicationAgreement) {
    setDraft(agreement);
    setBoundaries(agreement.personalBoundaries.join('\n'));
  }
  async function load() {
    setBusy(true);
    setError('');
    try {
      const result = await apiClient.communicationAgreement(await token());
      apply(CommunicationAgreementSchema.parse(result.agreement));
      setMessage(
        result.saved
          ? 'Loaded your saved preferences.'
          : 'Using defaults. No preferences saved yet.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load preferences.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save() {
    if (!draft) return;
    const result = CommunicationAgreementSchema.safeParse({
      ...draft,
      personalBoundaries: boundaries
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    });
    if (!result.success) {
      setError(result.error.issues.map((issue) => issue.message).join('; '));
      return;
    }
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await apiClient.saveCommunicationAgreement(await token(), result.data);
      apply(CommunicationAgreementSchema.parse(response.agreement));
      setMessage('Preferences saved to your account. AI and voice are not connected yet.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const result = await apiClient.resetCommunicationAgreement(await token());
      apply(CommunicationAgreementSchema.parse(result.agreement));
      setMessage('Saved preferences removed. Defaults restored.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key: 'buddyName' | 'preferredAddress' | 'language' | 'voicePreference',
    label: string,
  ) => (
    <View key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={!busy}
        value={draft?.[key] ?? ''}
        onChangeText={(text) => {
          setDraft((current) => current && { ...current, [key]: text });
          setMessage('Unsaved changes');
        }}
        style={styles.input}
      />
    </View>
  );
  return (
    <View style={styles.panel}>
      <Text style={styles.title} accessibilityRole="header">
        Your Alpha
      </Text>
      <Text style={styles.label}>
        Private communication preferences, separate from conversation memory. Saving does not
        connect AI or voice services.
      </Text>
      {busy && (
        <ActivityIndicator accessibilityLabel="Updating preferences" color={colors.brand.blue} />
      )}
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {!!message && (
        <Text style={styles.label} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
      {!draft ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void load()}
          style={styles.button}
        >
          <Text style={styles.text}>Retry loading preferences</Text>
        </Pressable>
      ) : (
        <>
          {field('buddyName', 'Buddy name')}
          {field('preferredAddress', 'What should Alpha call you?')}
          {field('language', 'Preferred language')}
          {field('voicePreference', 'Voice preference (not a selected voice)')}
          {(['humour', 'sarcasm'] as const).map((key) => (
            <View key={key}>
              <Text style={styles.label}>{key} (0–100)</Text>
              <TextInput
                accessibilityLabel={`${key} from 0 to 100`}
                editable={!busy}
                keyboardType="number-pad"
                value={String(draft[key])}
                onChangeText={(text) => {
                  setDraft({ ...draft, [key]: text === '' ? 0 : Number(text) });
                  setMessage('Unsaved changes');
                }}
                style={styles.input}
              />
            </View>
          ))}
          <Text style={styles.label}>Profanity preference</Text>
          {(['none', 'contextual'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.profanity === value }}
              disabled={busy}
              onPress={() => {
                setDraft({ ...draft, profanity: value });
                setMessage('Unsaved changes');
              }}
              style={styles.button}
            >
              <Text style={styles.text}>
                {draft.profanity === value ? '● ' : '○ '}
                {value}
              </Text>
            </Pressable>
          ))}
          <Text style={styles.label}>How directly should Alpha challenge you?</Text>
          {(['gentle', 'balanced', 'direct'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.challengeStyle === value }}
              disabled={busy}
              onPress={() => {
                setDraft({ ...draft, challengeStyle: value });
                setMessage('Unsaved changes');
              }}
              style={styles.button}
            >
              <Text style={styles.text}>
                {draft.challengeStyle === value ? '● ' : '○ '}
                {value}
              </Text>
            </Pressable>
          ))}
          <Text style={styles.label}>Personal boundaries (one per line, up to 30)</Text>
          <TextInput
            accessibilityLabel="Personal communication boundaries"
            editable={!busy}
            multiline
            value={boundaries}
            onChangeText={(text) => {
              setBoundaries(text);
              setMessage('Unsaved changes');
            }}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void save()}
            style={styles.button}
          >
            <Text style={styles.text}>Save preferences</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() =>
              Alert.alert(
                'Reset Alpha preferences?',
                'This removes your saved communication preferences and discards this draft.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: () => void reset() },
                ],
              )
            }
            style={styles.button}
          >
            <Text style={styles.text}>Reset to defaults</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  title: { color: colors.brand.blue, fontSize: 22, fontWeight: '600' },
  label: { color: colors.text.secondary, marginVertical: spacing.sm },
  input: {
    color: colors.text.primary,
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 44,
  },
  button: {
    backgroundColor: colors.background.soft,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  text: { color: colors.text.primary },
  error: { color: colors.state.error, marginVertical: spacing.sm },
});
