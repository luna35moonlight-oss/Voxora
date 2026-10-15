import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@voxora/design-system';
import {
  bankDice,
  diceCategories,
  diceMatchOver,
  holdDie,
  newDiceMatch,
  rollDice,
  scoreDice,
  sheetTotal,
} from './moonDice';

export function MoonDiceCard() {
  const [match, setMatch] = useState(newDiceMatch);
  const over = diceMatchOver(match);
  const you = sheetTotal(match.player);
  const alpha = sheetTotal(match.alpha);
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>VOXORA LOCAL ARCADE</Text>
      <Text style={styles.title} accessibilityRole="header">
        Moon Dice
      </Text>
      <Text style={styles.body}>Five dice. Three rolls. One clever wolf.</Text>
      <Text style={styles.body}>
        Local practice against a rules-based Alpha opponent. No AI connection, money or rewards.
        Progress lasts while this game stays open.
      </Text>
      <View style={styles.scorebar}>
        <Text style={styles.score}>YOU {you}</Text>
        <Text style={styles.score}>ALPHA {alpha}</Text>
      </View>
      <Text style={styles.body}>
        Round {Math.min(Object.keys(match.player).length + 1, 13)} / 13 · Rolls left{' '}
        {3 - match.rolls}
      </Text>
      <View style={styles.dice}>
        {match.dice.map((value, index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Die ${index + 1}: ${match.rolls ? value : 'not rolled'}, ${match.held[index] ? 'held' : 'not held'}`}
            accessibilityState={{
              selected: match.held[index],
              disabled: !match.rolls || match.rolls >= 3 || over,
            }}
            disabled={!match.rolls || match.rolls >= 3 || over}
            onPress={() => setMatch((current) => holdDie(current, index))}
            style={[styles.die, match.held[index] && styles.held]}
          >
            <Text style={styles.dieText}>{match.rolls ? value : '–'}</Text>
            <Text style={styles.holdText}>{match.held[index] ? 'HELD' : 'HOLD'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.body}>
        Tap dice to hold them between rolls. Choose an unused category to bank your score; zero is
        allowed. Upper-section scores of 63 earn a 35-point bonus. No extra five-of-a-kind bonuses.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={match.rolls >= 3 || over}
        onPress={() => setMatch((current) => rollDice(current))}
        style={[styles.button, (match.rolls >= 3 || over) && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {over
            ? 'Match complete'
            : match.rolls >= 3
              ? 'Choose a score below'
              : `Roll dice (${3 - match.rolls})`}
        </Text>
      </Pressable>
      <Text style={styles.body} accessibilityLiveRegion="polite">
        {match.lastAlpha ?? 'Alpha takes a turn after you bank a score.'}
      </Text>
      <View style={styles.row}>
        <Text style={styles.category}>SCORECARD</Text>
        <Text style={styles.column}>YOU</Text>
        <Text style={styles.column}>ALPHA</Text>
      </View>
      {diceCategories.map((category) => {
        const used = match.player[category] !== undefined;
        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityLabel={`${category}: ${used ? `scored ${match.player[category]}` : match.rolls ? `bank ${scoreDice(match.dice, category)} points` : 'roll first'}`}
            disabled={used || match.rolls === 0 || over}
            onPress={() => setMatch((current) => bankDice(current, category))}
            style={[styles.row, used && styles.used]}
          >
            <Text style={styles.category}>{category}</Text>
            <Text style={styles.column}>
              {match.player[category] ??
                (match.rolls ? `+${scoreDice(match.dice, category)}` : '–')}
            </Text>
            <Text style={styles.column}>{match.alpha[category] ?? '–'}</Text>
          </Pressable>
        );
      })}
      {over && (
        <Text style={styles.result} accessibilityLiveRegion="polite">
          {you === alpha
            ? 'A moonlit draw.'
            : you > alpha
              ? 'You win. Well played!'
              : 'Alpha wins. Fancy a rematch?'}
        </Text>
      )}
      {over && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setMatch(newDiceMatch())}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Play again</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: colors.background.elevated,
    borderRadius: radius.lg,
    borderColor: colors.border.strong,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  eyebrow: { color: colors.brand.blue, letterSpacing: 2, fontSize: 12 },
  title: { color: colors.text.primary, fontSize: 28, fontWeight: '700', marginTop: spacing.sm },
  body: { color: colors.text.secondary, marginVertical: spacing.sm, lineHeight: 21 },
  scorebar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.soft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  score: { color: colors.brand.blue, fontWeight: '700', fontSize: 18 },
  dice: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.sm },
  die: {
    minWidth: 44,
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border.strong,
    paddingVertical: spacing.sm,
  },
  held: { borderColor: colors.brand.blue },
  dieText: { color: colors.text.primary, fontSize: 26, fontWeight: '700' },
  holdText: { color: colors.text.secondary, fontSize: 10 },
  button: {
    backgroundColor: colors.brand.purple,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    alignItems: 'center',
  },
  category: { flex: 1, color: colors.text.primary },
  column: { width: 58, textAlign: 'right', color: colors.brand.blue },
  used: { opacity: 0.6 },
  result: { color: colors.brand.blue, fontSize: 20, marginVertical: spacing.md },
});
