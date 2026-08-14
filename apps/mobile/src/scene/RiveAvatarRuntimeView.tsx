import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AvatarPerformanceProfile, AvatarRuntimeState } from '@voxora/contracts';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import { RIVE_DEV_TEST_ASSET } from './riveDevAsset';
import {
  applyCommandsToNativeView,
  probeRiveJsModuleAvailability,
  sceneHeightForProfile,
} from './riveRuntimeBridge';
import { mapVoxoraStateToDevAssetCommands } from './riveStateAdapter';

type Props = {
  runtimeState: AvatarRuntimeState;
  reducedMotion: boolean;
  performanceProfile: AvatarPerformanceProfile;
  equippedSlotLabels: string[];
};

type RiveModule = typeof import('@rive-app/react-native');

function tryLoadRiveModule(): RiveModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@rive-app/react-native') as RiveModule;
  } catch {
    return null;
  }
}

/**
 * Living-avatar Rive proof surface.
 * Native rendering requires an Expo development build (not Expo Go).
 */
export function RiveAvatarRuntimeView(props: Props) {
  const riveModule = useMemo(() => tryLoadRiveModule(), []);
  const availability = useMemo(() => probeRiveJsModuleAvailability(), []);
  const height = sceneHeightForProfile(props.performanceProfile);

  if (!riveModule || availability.status === 'unavailable') {
    return (
      <FallbackScene
        height={height}
        message={`Rive JS module unavailable: ${availability.detail}. Expo development build required. ${RIVE_DEV_TEST_ASSET.marker}`}
        runtimeState={props.runtimeState}
      />
    );
  }

  return <RiveAvatarRuntimeNative riveModule={riveModule} {...props} height={height} />;
}

function RiveAvatarRuntimeNative({
  riveModule,
  runtimeState,
  reducedMotion,
  performanceProfile,
  equippedSlotLabels,
  height,
}: Props & { riveModule: RiveModule; height: number }) {
  const { RiveView, Fit, useRive, useRiveFile } = riveModule;
  const { setHybridRef, riveViewRef } = useRive();
  const { riveFile, error: fileError } = useRiveFile(RIVE_DEV_TEST_ASSET.sourceUrl);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appliedNote, setAppliedNote] = useState('Waiting for Rive view…');
  const remountKeyRef = useRef(0);
  const showEquipmentOverlay =
    performanceProfile !== 'LOW' && !reducedMotion && equippedSlotLabels.length > 0;

  useEffect(() => {
    if (fileError) {
      setLoadError(
        typeof fileError === 'object' && fileError && 'message' in fileError
          ? String((fileError as { message: unknown }).message)
          : String(fileError),
      );
    }
  }, [fileError]);

  useEffect(() => {
    if (reducedMotion) {
      setAppliedNote('Reduced motion: Rive mood inputs cleared; static presence retained.');
      applyCommandsToNativeView(riveViewRef, [
        { kind: 'boolean', name: 'isHappy', value: false },
        { kind: 'boolean', name: 'isSad', value: false },
      ]);
      return;
    }

    const mapping = mapVoxoraStateToDevAssetCommands(runtimeState);
    const result = applyCommandsToNativeView(riveViewRef, mapping.commands);
    setAppliedNote(
      `${mapping.notes} Applied=[${result.applied.join('; ') || 'none'}] Skipped=[${
        result.skipped.join('; ') || 'none'
      }] Return=${mapping.returnToIdleStrategy}`,
    );
  }, [runtimeState, reducedMotion, riveViewRef, riveFile]);

  if (loadError) {
    return (
      <FallbackScene
        height={height}
        message={`Rive renderer failure (honest fallback): ${loadError}. ${RIVE_DEV_TEST_ASSET.marker}`}
        runtimeState={runtimeState}
      />
    );
  }

  if (!riveFile) {
    return (
      <FallbackScene
        height={height}
        message={`Loading development Rive asset from CDN… ${RIVE_DEV_TEST_ASSET.marker}`}
        runtimeState={runtimeState}
      />
    );
  }

  return (
    <View style={[styles.scene, { height }]} accessibilityLabel={`Rive avatar ${runtimeState}`}>
      <Text style={styles.banner}>{RIVE_DEV_TEST_ASSET.marker}</Text>
      <RiveView
        // Stable remount key: parent React re-renders must not continuously restart animation.
        key={`rive-stable-${remountKeyRef.current}`}
        ref={setHybridRef}
        autoPlay
        file={riveFile}
        artboardName={RIVE_DEV_TEST_ASSET.artboardName}
        stateMachineName={RIVE_DEV_TEST_ASSET.stateMachineName}
        fit={Fit.Contain}
        style={styles.rive}
        onError={(error) => setLoadError(error.message)}
      />
      {showEquipmentOverlay ? (
        <Text style={styles.overlay}>
          Scene composition equipment (not flattened into .riv): {equippedSlotLabels.join(', ')}
        </Text>
      ) : (
        <Text style={styles.overlay}>
          LOW / reduced-motion profile retains avatar presence without extra equipment overlays.
        </Text>
      )}
      <Text style={styles.meta}>{appliedNote}</Text>
      <Text style={styles.meta}>
        Expo Go is not supported for this native runtime. Use an Expo development build.
      </Text>
    </View>
  );
}

function FallbackScene({
  height,
  message,
  runtimeState,
}: {
  height: number;
  message: string;
  runtimeState: AvatarRuntimeState;
}) {
  return (
    <View style={[styles.scene, styles.fallback, { height }]}>
      <Text style={styles.banner}>{RIVE_DEV_TEST_ASSET.marker}</Text>
      <Text style={styles.fallbackTitle}>Avatar presence fallback</Text>
      <Text style={styles.meta}>Runtime state: {runtimeState}</Text>
      <Text style={styles.meta}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: '#1F1636',
    borderColor: colors.border.strong,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  fallback: {
    justifyContent: 'center',
  },
  rive: {
    height: 150,
    width: '100%',
  },
  banner: {
    color: colors.state.warning,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  fallbackTitle: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  overlay: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
});
