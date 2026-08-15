import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import type {
  AvatarInventoryItem,
  AvatarRuntimeState,
  CurrentAvatarResponse,
} from '@voxora/contracts';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';
import { requestAvatarStateTransition, shouldReturnToIdle } from '../scene/avatarRuntime';
import { RiveAvatarRuntimeView } from '../scene/RiveAvatarRuntimeView';
import { RIVE_DEV_TEST_ASSET } from '../scene/riveDevAsset';
import { describeDevAssetAdapter } from '../scene/riveStateAdapter';

const demoStates: AvatarRuntimeState[] = ['IDLE', 'LISTEN', 'THINK', 'SPEAK', 'SMILE'];

export function AvatarFoundationCard() {
  const [avatarState, setAvatarState] = useState<CurrentAvatarResponse | null>(null);
  const [runtimeState, setRuntimeState] = useState<AvatarRuntimeState>('IDLE');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [performanceProfile, setPerformanceProfile] = useState<'STANDARD' | 'LOW'>('STANDARD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const currentAvatar = avatarState?.currentAvatar;
  const equippedIds = new Set(avatarState?.equipment.map((entry) => entry.item.id) ?? []);

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Phase 3</Text>
      <Text style={styles.title}>Living Avatar Foundation</Text>
      <Text style={styles.body}>
        Server-owned catalogue, ownership, wardrobe, persistent equipment, and real Rive runtime
        proof (development asset). Pet selection remains Phase 4.
      </Text>

      <RiveAvatarRuntimeView
        equippedSlotLabels={avatarState?.equipment.map((entry) => entry.slot) ?? []}
        performanceProfile={performanceProfile}
        reducedMotion={reducedMotion}
        runtimeState={runtimeState}
      />

      <Text style={styles.meta}>Current: {currentAvatar?.displayName ?? 'loading avatar...'}</Text>
      <Text style={styles.meta}>Runtime state: {runtimeState}</Text>
      <Text style={styles.meta}>
        Catalogue Rive ref: {currentAvatar?.riveAssetRef ?? 'pending'}
      </Text>
      <Text style={styles.meta}>{describeDevAssetAdapter()}</Text>
      <Text style={styles.meta}>{RIVE_DEV_TEST_ASSET.marker}</Text>

      <View style={styles.buttonRow}>
        {demoStates.map((state) => (
          <Pressable
            accessibilityRole="button"
            key={state}
            onPress={() => requestState(state)}
            style={styles.smallButton}
          >
            <Text style={styles.buttonText}>{state}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setReducedMotion((value) => !value)}
        style={styles.secondaryButton}
      >
        <Text style={styles.buttonText}>Reduced motion: {reducedMotion ? 'on' : 'off'}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          setPerformanceProfile((value) => (value === 'STANDARD' ? 'LOW' : 'STANDARD'))
        }
        style={styles.secondaryButton}
      >
        <Text style={styles.buttonText}>Performance profile: {performanceProfile}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Catalogue</Text>
      {avatarState?.catalogue.map((avatar) => (
        <Pressable
          accessibilityRole="button"
          disabled={busy || !avatar.owned}
          key={avatar.id}
          onPress={() => selectAvatar(avatar.id)}
          style={[styles.row, !avatar.owned && styles.lockedRow]}
        >
          <Text style={styles.rowTitle}>
            {avatar.displayName} ({avatar.tier})
          </Text>
          <Text style={styles.rowText}>
            {avatar.owned ? 'Owned' : avatar.lockedReason} · {avatar.performanceProfile}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Wardrobe proof</Text>
      {avatarState?.inventory.map((item) => (
        <WardrobeRow
          busy={busy}
          currentAvatarId={currentAvatar?.id}
          equipped={equippedIds.has(item.id)}
          item={item}
          key={item.id}
          onEquip={equipItem}
          onUnequip={unequipItem}
        />
      ))}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Text style={styles.finePrint}>
        Listening and Speaking are avatar states only here. No microphone capture, speech
        recognition, voice output, or Alpha provider is active in Phase 3. Return-to-IDLE for the
        development asset is application orchestration unless a production `.riv` provides a genuine
        state-machine transition.
      </Text>
    </View>
  );

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const token = await requireAccessToken();
      setAvatarState(await apiClient.avatarMe(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load avatar foundation');
    } finally {
      setBusy(false);
    }
  }

  async function selectAvatar(avatarId: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await requireAccessToken();
      setAvatarState(await apiClient.selectAvatar(token, { avatarId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not select avatar');
    } finally {
      setBusy(false);
    }
  }

  async function equipItem(itemId: string) {
    if (!currentAvatar) return;
    setBusy(true);
    setError(null);
    try {
      const token = await requireAccessToken();
      setAvatarState(
        await apiClient.equipAvatarItem(token, { avatarId: currentAvatar.id, itemId }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not equip item');
    } finally {
      setBusy(false);
    }
  }

  async function unequipItem(slot: AvatarInventoryItem['slot']) {
    if (!currentAvatar) return;
    setBusy(true);
    setError(null);
    try {
      const token = await requireAccessToken();
      setAvatarState(
        await apiClient.unequipAvatarItem(token, {
          avatarId: currentAvatar.id,
          slot,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unequip item');
    } finally {
      setBusy(false);
    }
  }

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

function WardrobeRow({
  busy,
  currentAvatarId,
  equipped,
  item,
  onEquip,
  onUnequip,
}: {
  busy: boolean;
  currentAvatarId?: string;
  equipped: boolean;
  item: AvatarInventoryItem;
  onEquip: (itemId: string) => void;
  onUnequip: (slot: AvatarInventoryItem['slot']) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy || !currentAvatarId || !item.owned}
      onPress={() => (equipped ? onUnequip(item.slot) : onEquip(item.id))}
      style={[styles.row, !item.owned && styles.lockedRow, equipped && styles.equippedRow]}
    >
      <Text style={styles.rowTitle}>
        {item.displayName} · {item.slot}
      </Text>
      <Text style={styles.rowText}>
        {equipped ? 'Equipped' : item.owned ? 'Tap to equip' : item.lockedReason}
      </Text>
    </Pressable>
  );
}

async function requireAccessToken(): Promise<string> {
  const token = await secureSessionStore.getAccessToken();
  if (!token) {
    throw new Error('Sign in again to load avatar state');
  }
  return token;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  kicker: {
    color: colors.brand.blue,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xxs,
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
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
  },
  row: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  lockedRow: {
    opacity: 0.55,
  },
  equippedRow: {
    borderColor: colors.brand.blue,
  },
  rowTitle: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  rowText: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  error: {
    color: colors.state.error,
    marginTop: spacing.sm,
  },
  finePrint: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
  },
});
