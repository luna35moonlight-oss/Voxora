import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import type { AvatarRuntimeState } from '@voxora/contracts';
import { requestAvatarStateTransition, shouldReturnToIdle } from '../scene/avatarRuntime';
import { RiveAvatarRuntimeView } from '../scene/RiveAvatarRuntimeView';
import { RIVE_DEV_TEST_ASSET } from '../scene/riveDevAsset';
import { describeDevAssetAdapter } from '../scene/riveStateAdapter';

const demoStates: AvatarRuntimeState[] = ['IDLE', 'LISTEN', 'THINK', 'SPEAK', 'SMILE'];

/**
 * Development-only harness for native Android/iOS Rive validation.
 * Does not require API auth. Not a production surface.
 */
export function RiveNativeValidationScreen({ onBack }: { onBack: () => void }) {
  const [runtimeState, setRuntimeState] = useState<AvatarRuntimeState>('IDLE');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [performanceProfile, setPerformanceProfile] = useState<'STANDARD' | 'LOW'>('STANDARD');
  const [remountToken, setRemountToken] = useState(0);
  const [rerenderTick, setRerenderTick] = useState(0);

  useEffect(() => {
    // Ordinary parent re-renders must not restart the Rive runtime.
    const id = setInterval(() => setRerenderTick((value) => value + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="rive-native-validation">
      <Text style={styles.brand} accessibilityRole="header">
        VOXORA
      </Text>
      <Text style={styles.title}>Native Rive validation harness</Text>
      <Text style={styles.body}>
        Development build only. Validates artboard load, state orchestration, reduced motion,
        performance profiles, remount, and honest fallback. Parent re-render tick: {rerenderTick}
      </Text>
      <Text style={styles.meta}>{RIVE_DEV_TEST_ASSET.marker}</Text>
      <Text style={styles.meta}>{describeDevAssetAdapter()}</Text>

      <RiveAvatarRuntimeView
        key={`harness-${remountToken}`}
        equippedSlotLabels={performanceProfile === 'STANDARD' ? ['HAT', 'TOP'] : []}
        performanceProfile={performanceProfile}
        reducedMotion={reducedMotion}
        runtimeState={runtimeState}
      />

      <Text style={styles.meta}>Runtime state: {runtimeState}</Text>

      <View style={styles.buttonRow}>
        {demoStates.map((state) => (
          <Pressable
            accessibilityRole="button"
            key={state}
            onPress={() => requestState(state)}
            style={styles.smallButton}
            testID={`rive-state-${state}`}
          >
            <Text style={styles.buttonText}>{state}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setReducedMotion((value) => !value)}
        style={styles.secondaryButton}
        testID="rive-toggle-reduced-motion"
      >
        <Text style={styles.buttonText}>Reduced motion: {reducedMotion ? 'on' : 'off'}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          setPerformanceProfile((value) => (value === 'STANDARD' ? 'LOW' : 'STANDARD'))
        }
        style={styles.secondaryButton}
        testID="rive-toggle-performance"
      >
        <Text style={styles.buttonText}>Performance profile: {performanceProfile}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setRuntimeState('IDLE');
          setRemountToken((value) => value + 1);
        }}
        style={styles.secondaryButton}
        testID="rive-remount"
      >
        <Text style={styles.buttonText}>Unmount / remount Rive view</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );

  function requestState(requested: AvatarRuntimeState) {
    const next = requestAvatarStateTransition({
      current: runtimeState,
      requested,
      reducedMotion,
    });
    setRuntimeState(next);
    if (shouldReturnToIdle(next)) {
      setTimeout(() => setRuntimeState('IDLE'), reducedMotion ? 300 : 900);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.base,
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  brand: {
    color: colors.brand.purple,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.sm,
  },
  body: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  smallButton: {
    backgroundColor: colors.brand.purple,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});
