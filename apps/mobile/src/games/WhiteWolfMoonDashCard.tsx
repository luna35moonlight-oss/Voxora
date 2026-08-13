import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
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
  const progress = Math.min(game.score / WHITE_WOLF_TARGET_SCORE, 1);
  const moonlight = Math.min(game.energy / WHITE_WOLF_MAX_ENERGY, 1);
  const prompt = getWhiteWolfPrompt(game);
  const gameOver = game.status !== 'playing';

  const onMove = (move: WhiteWolfMove) => {
    setGame((current) => applyWhiteWolfMove(current, move));
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Mini game</Text>
          <Text style={styles.title}>White Wolf Moon Dash</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Local prototype</Text>
        </View>
      </View>

      <View style={styles.wolfStage} accessibilityLabel="Cute white wolf Lumi in a snowy moonlit scene">
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
          const disabled = gameOver || (move.id === 'pounce' && game.energy < 2);

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
        onPress={() => setGame(createInitialWhiteWolfGame())}
        style={[styles.resetButton, game.status === 'won' && styles.winButton]}
      >
        <Text style={styles.resetText}>{gameOver ? 'Play again' : 'Restart run'}</Text>
      </Pressable>

      <Text style={styles.finePrint}>
        Scores stay on-device for this prototype. Rewards and leaderboards still require server
        validation.
      </Text>
    </View>
  );
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
