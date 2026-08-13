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

const demoStates: AvatarRuntimeState[] = ['IDLE', 'LISTEN', 'THINK', 'SPEAK', 'SMILE'];

export function AvatarFoundationCard() {
  const [avatarState, setAvatarState] = useState<CurrentAvatarResponse | null>(null);
  const [runtimeState, setRuntimeState] = useState<AvatarRuntimeState>('IDLE');
  const [reducedMotion, setReducedMotion] = useState(false);
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
        Server-owned catalogue, ownership, wardrobe, persistent equipment, and Rive-ready runtime
        states. Pet selection remains Phase 4.
      </Text>

      <View style={styles.scene} accessibilityLabel={sceneLabel(currentAvatar?.displayName, runtimeState)}>
        <View style={styles.avatarBase}>
          <View style={styles.hairLayer} />
          <View style={styles.face}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
          <View style={[styles.outfitLayer, runtimeState === 'SPEAK' && styles.speakingOutfit]} />
          {avatarState?.equipment.some((entry) => entry.slot === 'JEWELLERY') ? (
            <View style={styles.accessoryLayer} />
          ) : null}
        </View>
      </View>

      <Text style={styles.meta}>Current: {currentAvatar?.displayName ?? 'loading avatar...'}</Text>
      <Text style={styles.meta}>Runtime state: {runtimeState}</Text>
      <Text style={styles.meta}>Rive asset: {currentAvatar?.riveAssetRef ?? 'pending'}</Text>

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
        Listening and Speaking are avatar states only here. No microphone capture or Alpha provider is
        active in Phase 3.
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
      setAvatarState(await apiClient.equipAvatarItem(token, { avatarId: currentAvatar.id, itemId }));
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
      setAvatarState(await apiClient.unequipAvatarItem(token, {
        avatarId: currentAvatar.id,
        slot,
      }));
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

function sceneLabel(avatarName: string | undefined, state: AvatarRuntimeState) {
  return `${avatarName ?? 'Avatar'} scene in ${state} state`;
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
  scene: {
    alignItems: 'center',
    backgroundColor: '#1F1636',
    borderColor: colors.border.strong,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 210,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  avatarBase: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderColor: colors.brand.blue,
    borderRadius: 58,
    borderWidth: 2,
    height: 132,
    justifyContent: 'center',
    width: 112,
  },
  hairLayer: {
    backgroundColor: '#E9D5FF',
    borderRadius: 40,
    height: 38,
    position: 'absolute',
    top: 8,
    width: 86,
  },
  face: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  eye: {
    backgroundColor: colors.text.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  outfitLayer: {
    backgroundColor: colors.brand.pink,
    borderRadius: radius.md,
    bottom: 18,
    height: 40,
    position: 'absolute',
    width: 76,
  },
  speakingOutfit: {
    backgroundColor: colors.brand.blue,
  },
  accessoryLayer: {
    backgroundColor: colors.state.warning,
    borderRadius: 9,
    height: 18,
    position: 'absolute',
    right: 22,
    top: 58,
    width: 18,
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
