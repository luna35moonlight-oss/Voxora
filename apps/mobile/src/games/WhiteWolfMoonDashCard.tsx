import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import type { WhiteWolfAttemptOutcome, WhiteWolfGameStatusResponse } from '@voxora/contracts';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';
import {
  applyWhiteWolfMove,
  createInitialWhiteWolfGame,
  getWhiteWolfPrompt,
  WHITE_WOLF_MAX_ENERGY,
  WHITE_WOLF_TARGET_SCORE,
  type WhiteWolfMove,
} from './whiteWolfMoonDash';

const moves: Array<{
  id: WhiteWolfMove;
  title: string;
  hint: string;
}> = [
  { id: 'sniff', title: 'Sniff flowers', hint: '+crystals, +bond' },
  { id: 'pounce', title: 'Snow pounce', hint: 'big score, costs 2' },
  { id: 'howl', title: 'Moon howl', hint: '+moonlight, +bond' },
];

export function WhiteWolfMoonDashCard() {
  const [game, setGame] = useState(createInitialWhiteWolfGame);
  const [remoteStatus, setRemoteStatus] = useState<WhiteWolfGameStatusResponse | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [submittedAttemptId, setSubmittedAttemptId] = useState<string | null>(null);
  const [finalOutcome, setFinalOutcome] = useState<WhiteWolfAttemptOutcome | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const progress = Math.min(game.score / WHITE_WOLF_TARGET_SCORE, 1);
  const moonlight = Math.min(game.energy / WHITE_WOLF_MAX_ENERGY, 1);
  const pendingSubmission = attemptId !== null && submittedAttemptId === attemptId;
  const activeAttempt = attemptId !== null && !pendingSubmission;
  const prompt = activeAttempt
    ? getWhiteWolfPrompt(game)
    : 'Start a daily try when you are ready to guide Lumi.';
  const gameOver = game.status !== 'playing';
  const attemptsRemaining = remoteStatus?.attemptsRemainingToday ?? 0;
  const primaryDisabled =
    syncing ||
    remoteStatus === null ||
    (attemptsRemaining <= 0 && !pendingSubmission && !activeAttempt);
  const primaryActionLabel = useMemo(() => {
    if (syncing) {
      return 'Syncing...';
    }

    if (pendingSubmission) {
      return 'Retry score submit';
    }

    if (activeAttempt && !gameOver) {
      return 'Forfeit and submit score';
    }

    if (remoteStatus === null) {
      return 'Load daily tries';
    }

    if (attemptsRemaining <= 0) {
      return 'Daily limit reached';
    }

    return gameOver ? 'Start next daily try' : 'Start daily try';
  }, [activeAttempt, attemptsRemaining, gameOver, pendingSubmission, remoteStatus, syncing]);

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    if (!activeAttempt || !gameOver || !attemptId || submittedAttemptId === attemptId) {
      return;
    }

    setSubmittedAttemptId(attemptId);
    void completeAttempt(attemptId, game.score, finalOutcome ?? getOutcomeFromStatus(game.status));
  }, [
    activeAttempt,
    attemptId,
    finalOutcome,
    game.score,
    game.status,
    gameOver,
    submittedAttemptId,
  ]);

  const onMove = (move: WhiteWolfMove) => {
    setGame((current) => applyWhiteWolfMove(current, move));
  };

  const onPrimaryAction = () => {
    if (pendingSubmission && attemptId) {
      void completeAttempt(
        attemptId,
        game.score,
        finalOutcome ?? getOutcomeFromStatus(game.status),
      );
      return;
    }

    if (activeAttempt && !gameOver) {
      setFinalOutcome('forfeited');
      setGame((current) => ({
        ...current,
        status: 'resting',
        lastMessage: 'Lumi trots home. This reserved try is forfeited and will not win a prize.',
      }));
      return;
    }

    void startAttempt();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Mini game</Text>
          <Text style={styles.title}>White Wolf Moon Dash</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>10 tries/day</Text>
        </View>
      </View>

      <View
        style={styles.wolfStage}
        accessibilityLabel="Cute white wolf Lumi in a snowy moonlit scene"
      >
        <View style={styles.moon} />
        <View style={[styles.star, styles.starOne]} />
        <View style={[styles.star, styles.starTwo]} />
        <View style={[styles.star, styles.starThree]} />
        <WhiteWolfIllustration />
      </View>

      <Text style={styles.prompt}>{prompt}</Text>
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {game.lastMessage}
      </Text>

      <View style={styles.ruleBox}>
        <Text style={styles.ruleTitle}>Daily challenge rules</Text>
        <Text style={styles.ruleText}>
          Tries today: {remoteStatus?.attemptsUsedToday ?? 0}/
          {remoteStatus?.dailyAttemptLimit ?? 10}. Best score: {remoteStatus?.bestScore ?? 0}.
        </Text>
        <Text style={styles.ruleText}>
          Prize: First and Second place can receive a legendary avatar redeem code issued by the
          Voxora team after review.
        </Text>
        <Text style={styles.ruleText}>
          Your rank: {formatRank(remoteStatus?.bestRank)} ({formatReward(remoteStatus)})
        </Text>
      </View>

      {remoteStatus?.leaderboard.length ? (
        <View style={styles.leaderboard}>
          <Text style={styles.ruleTitle}>Prize positions</Text>
          {remoteStatus.leaderboard.map((entry) => (
            <Text key={`${entry.rank}-${entry.playerLabel}`} style={styles.ruleText}>
              #{entry.rank} {entry.playerLabel}: {entry.score} crystals
            </Text>
          ))}
        </View>
      ) : null}

      {remoteError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {remoteError}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <Stat label="Crystals" value={`${game.score}/${WHITE_WOLF_TARGET_SCORE}`} />
        <Stat label="Moonlight" value={`${game.energy}/${WHITE_WOLF_MAX_ENERGY}`} />
        <Stat label="Bond" value={`${game.bond}`} />
        <Stat label="Streak" value={`${game.streak}`} />
      </View>

      <Meter label="Crystal trail" progress={progress} color={colors.brand.blue} />
      <Meter label="Moonlight" progress={moonlight} color={colors.brand.pink} />

      <View style={styles.movesRow}>
        {moves.map((move) => {
          const disabled =
            !activeAttempt || gameOver || syncing || (move.id === 'pounce' && game.energy < 2);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              disabled={disabled}
              key={move.id}
              onPress={() => onMove(move.id)}
              style={[styles.moveButton, disabled && styles.disabledButton]}
            >
              <Text style={styles.moveTitle}>{move.title}</Text>
              <Text style={styles.moveHint}>{move.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: primaryDisabled }}
        disabled={primaryDisabled}
        onPress={onPrimaryAction}
        style={[
          styles.resetButton,
          game.status === 'won' && styles.winButton,
          primaryDisabled && styles.disabledButton,
        ]}
      >
        <Text style={styles.resetText}>{primaryActionLabel}</Text>
      </Pressable>

      <Text style={styles.finePrint}>
        Scores submit to Voxora for validation. Redeem codes are never auto-issued by the app.
      </Text>
    </View>
  );

  async function refreshStatus() {
    setSyncing(true);
    setRemoteError(null);
    try {
      const token = await requireAccessToken();
      setRemoteStatus(await apiClient.whiteWolfStatus(token));
    } catch (err) {
      setRemoteError(err instanceof Error ? err.message : 'Could not load daily game status');
    } finally {
      setSyncing(false);
    }
  }

  async function startAttempt() {
    setSyncing(true);
    setRemoteError(null);
    try {
      const token = await requireAccessToken();
      const response = await apiClient.startWhiteWolfAttempt(token);
      setRemoteStatus(response.status);
      setAttemptId(response.attemptId);
      setSubmittedAttemptId(null);
      setStartedAt(Date.now());
      setFinalOutcome(null);
      setGame(createInitialWhiteWolfGame());
    } catch (err) {
      setRemoteError(err instanceof Error ? err.message : 'Could not start daily try');
    } finally {
      setSyncing(false);
    }
  }

  async function completeAttempt(
    completedAttemptId: string,
    score: number,
    outcome: WhiteWolfAttemptOutcome,
  ) {
    setSyncing(true);
    setRemoteError(null);
    try {
      const token = await requireAccessToken();
      const response = await apiClient.completeWhiteWolfAttempt(token, completedAttemptId, {
        score,
        outcome,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
      });
      setRemoteStatus(response.status);
      setAttemptId(null);
      setStartedAt(null);
      setFinalOutcome(null);
    } catch (err) {
      setRemoteError(err instanceof Error ? err.message : 'Could not submit score');
    } finally {
      setSyncing(false);
    }
  }
}

async function requireAccessToken(): Promise<string> {
  const token = await secureSessionStore.getAccessToken();
  if (!token) {
    throw new Error('Sign in again to play the daily challenge');
  }

  return token;
}

function formatRank(rank: number | null | undefined): string {
  return rank ? `#${rank}` : 'not ranked yet';
}

function formatReward(status: WhiteWolfGameStatusResponse | null): string {
  if (!status) {
    return 'loading prize status';
  }

  switch (status.rewardStatus) {
    case 'CURRENT_LEADER':
      return 'current leader, not a verified prize winner';
    case 'PROVISIONAL_WINNER':
      return 'provisional prize position pending owner review';
    case 'VERIFIED_WINNER':
      return 'verified winner awaiting code issue';
    case 'PRIZE_ISSUED':
      return 'legendary avatar code issued';
    case 'PRIZE_REDEEMED':
      return 'legendary avatar code redeemed';
    case 'NOT_IN_PRIZE_POSITION':
      return 'outside First/Second place';
    case 'NOT_RANKED':
      return 'submit a score to enter';
  }
}

function getOutcomeFromStatus(status: 'playing' | 'won' | 'resting'): WhiteWolfAttemptOutcome {
  if (status === 'won') {
    return 'won';
  }

  return 'resting';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Meter({ label, progress, color }: { label: string; progress: number; color: string }) {
  return (
    <View style={styles.meterBlock}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { backgroundColor: color, flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

function WhiteWolfIllustration() {
  return (
    <View style={styles.wolfWrap}>
      <View style={styles.tail} />
      <View style={styles.body} />
      <View style={styles.chest} />
      <View style={[styles.paw, styles.frontPaw]} />
      <View style={[styles.paw, styles.backPaw]} />
      <View style={[styles.ear, styles.leftEar]} />
      <View style={[styles.ear, styles.rightEar]} />
      <View style={styles.head}>
        <View style={[styles.eye, styles.leftEye]} />
        <View style={[styles.eye, styles.rightEye]} />
        <View style={styles.snout}>
          <View style={styles.nose} />
          <View style={styles.smile} />
        </View>
        <View style={[styles.blush, styles.leftBlush]} />
        <View style={[styles.blush, styles.rightBlush]} />
      </View>
      <View style={styles.snowPuff} />
    </View>
  );
}

const wolfWhite = '#F7FCFF';
const wolfShadow = '#D7E8F7';
const wolfLine = '#9AB6CE';
const blushPink = '#FFC5DD';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  badge: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  wolfStage: {
    backgroundColor: '#21183A',
    borderColor: colors.border.strong,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 210,
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  moon: {
    backgroundColor: '#FDF5BA',
    borderRadius: 26,
    height: 52,
    position: 'absolute',
    right: 26,
    top: 22,
    width: 52,
  },
  star: {
    backgroundColor: colors.brand.blue,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    width: 8,
  },
  starOne: { left: 34, top: 34 },
  starTwo: { left: 78, top: 78 },
  starThree: { right: 104, top: 48 },
  wolfWrap: {
    alignSelf: 'center',
    height: 164,
    marginBottom: 8,
    width: 210,
  },
  tail: {
    backgroundColor: wolfWhite,
    borderColor: wolfLine,
    borderRadius: 34,
    borderWidth: 2,
    height: 34,
    position: 'absolute',
    right: 12,
    top: 82,
    transform: [{ rotate: '-28deg' }],
    width: 76,
  },
  body: {
    backgroundColor: wolfWhite,
    borderColor: wolfLine,
    borderRadius: 52,
    borderWidth: 2,
    bottom: 22,
    height: 76,
    left: 44,
    position: 'absolute',
    width: 122,
  },
  chest: {
    backgroundColor: wolfShadow,
    borderRadius: 28,
    bottom: 31,
    height: 48,
    left: 72,
    position: 'absolute',
    width: 58,
  },
  paw: {
    backgroundColor: wolfWhite,
    borderColor: wolfLine,
    borderRadius: 16,
    borderWidth: 2,
    bottom: 10,
    height: 28,
    position: 'absolute',
    width: 38,
  },
  frontPaw: { left: 72 },
  backPaw: { left: 124 },
  ear: {
    borderBottomColor: wolfWhite,
    borderBottomWidth: 44,
    borderLeftColor: 'transparent',
    borderLeftWidth: 20,
    borderRightColor: 'transparent',
    borderRightWidth: 20,
    height: 0,
    position: 'absolute',
    top: 10,
    width: 0,
  },
  leftEar: {
    left: 62,
    transform: [{ rotate: '-18deg' }],
  },
  rightEar: {
    left: 112,
    transform: [{ rotate: '18deg' }],
  },
  head: {
    backgroundColor: wolfWhite,
    borderColor: wolfLine,
    borderRadius: 48,
    borderWidth: 2,
    height: 92,
    left: 60,
    position: 'absolute',
    top: 32,
    width: 92,
  },
  eye: {
    backgroundColor: '#233247',
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    top: 34,
    width: 12,
  },
  leftEye: { left: 24 },
  rightEye: { right: 24 },
  snout: {
    alignItems: 'center',
    backgroundColor: wolfShadow,
    borderRadius: 20,
    height: 34,
    justifyContent: 'center',
    left: 27,
    position: 'absolute',
    top: 48,
    width: 38,
  },
  nose: {
    backgroundColor: '#25314A',
    borderRadius: 7,
    height: 10,
    width: 14,
  },
  smile: {
    borderBottomColor: '#25314A',
    borderBottomWidth: 2,
    borderRadius: 10,
    height: 8,
    marginTop: -1,
    width: 18,
  },
  blush: {
    backgroundColor: blushPink,
    borderRadius: 7,
    height: 10,
    opacity: 0.8,
    position: 'absolute',
    top: 55,
    width: 14,
  },
  leftBlush: { left: 12 },
  rightBlush: { right: 12 },
  snowPuff: {
    alignSelf: 'center',
    backgroundColor: '#DFF7FF',
    borderRadius: 30,
    bottom: 0,
    height: 18,
    opacity: 0.9,
    position: 'absolute',
    width: 150,
  },
  prompt: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
  },
  message: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  ruleBox: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  leaderboard: {
    backgroundColor: '#201735',
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  ruleTitle: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  ruleText: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  error: {
    color: colors.state.error,
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  stat: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 92,
    padding: spacing.sm,
  },
  statLabel: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xxs,
  },
  meterBlock: {
    marginTop: spacing.sm,
  },
  meterLabel: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginBottom: spacing.xxs,
  },
  meterTrack: {
    backgroundColor: colors.background.soft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    height: 10,
    overflow: 'hidden',
  },
  meterFill: {
    borderRadius: radius.pill,
  },
  movesRow: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  moveButton: {
    backgroundColor: colors.brand.purple,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  disabledButton: {
    backgroundColor: colors.state.locked,
    opacity: 0.6,
  },
  moveTitle: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  moveHint: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  winButton: {
    backgroundColor: colors.state.success,
    borderColor: colors.state.success,
  },
  resetText: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  finePrint: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
  },
});
