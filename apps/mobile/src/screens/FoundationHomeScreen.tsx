import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import { useAuth } from '../auth/AuthContext';
import type { ConnectivityState } from '../hooks/useConnectivity';
import { MoonDiceCard } from '../games/MoonDiceCard';
import { WhiteWolfMoonDashCard } from '../games/WhiteWolfMoonDashCard';
import { alphaProfile, homeSpaces, spaceDescriptions, type HomeSpace } from '../buddy/home';

export function FoundationHomeScreen({
  connectivity,
  onOpenSettings,
}: {
  connectivity: ConnectivityState;
  onOpenSettings: () => void;
}) {
  const { user, signOut } = useAuth();
  const [space, setSpace] = useState<HomeSpace>('Buddy');
  const content = spaceDescriptions[space];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.topline}>
        <Text style={styles.brand} accessibilityRole="header">
          VOXORA
        </Text>
        <Text style={styles.meta}>Alpha’s home</Text>
      </View>
      <Text style={styles.eyebrow}>YOUR VOICE. YOUR WORLD.</Text>
      <Text style={styles.title}>A home for your ideas.{'\n'}And your independent buddy.</Text>
      <Text style={styles.body}>
        Think, create, plan and play with Alpha. One companion, at your pace.
      </Text>

      <View style={styles.navigation} accessibilityRole="tablist">
        {homeSpaces.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: space === item }}
            onPress={() => setSpace(item)}
            style={[styles.tab, space === item && styles.activeTab]}
          >
            <Text style={styles.buttonText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.eyebrow}>{space.toUpperCase()}</Text>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {content.title}
        </Text>
        <Text style={styles.body}>{content.description}</Text>
        {space === 'Buddy' && (
          <>
            <Text style={styles.label}>MEET {alphaProfile.name.toUpperCase()}</Text>
            <Text style={styles.value}>Curious. Witty. Supportive. Comfortable disagreeing.</Text>
            <Text style={styles.meta}>
              Humour {alphaProfile.humour}% · Independent judgement{' '}
              {alphaProfile.independentJudgement}%
            </Text>
            <Text style={styles.meta}>
              {alphaProfile.conversationStyle} conversation · {alphaProfile.voice} voice preference
            </Text>
            <Text style={styles.meta}>{alphaProfile.rules.join(' · ')}</Text>
            <Text style={styles.notice}>
              Design defaults, not an active AI connection. Voice and personality customisation are
              planned.
            </Text>
          </>
        )}
        {space === 'My World' && (
          <Text style={styles.notice}>
            Wellness support is intended for general wellbeing, not diagnosis or emergency care.
          </Text>
        )}
      </View>

      {space === 'Play' && (
        <>
          {' '}
          <MoonDiceCard /> <WhiteWolfMoonDashCard />{' '}
        </>
      )}
      {space === 'Buddy' && (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Your memories, your choice</Text>
          <Text style={styles.body}>
            The planned memory engine will separate work and personal spaces, with controls to view,
            correct, export, delete and disable memories.
          </Text>
          <Text style={styles.notice}>
            Memory collection is not implemented. This home does not save conversations or personal
            memories.
          </Text>
        </View>
      )}
      {space !== 'Buddy' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSpace('Buddy')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Return to Alpha Bondfire</Text>
        </Pressable>
      )}
      <View style={styles.footer}>
        <Text style={styles.meta}>
          Signed in as {user?.email} · {connectivity}
        </Text>
        <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.button}>
          <Text style={styles.buttonText}>Account settings</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={[styles.button, styles.secondary]}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background.base },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  brand: {
    color: colors.brand.blue,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  eyebrow: {
    color: colors.brand.blue,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: 2,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.hero,
    fontWeight: typography.weight.bold,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.sm,
  },
  body: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    lineHeight: 25,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background.soft,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  activeTab: { backgroundColor: colors.brand.purple, borderColor: colors.brand.purple },
  panel: {
    backgroundColor: colors.background.elevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  label: { color: colors.text.muted, fontSize: typography.size.sm, marginTop: spacing.md },
  value: { color: colors.text.primary, fontSize: typography.size.md, marginTop: spacing.sm },
  meta: { color: colors.text.secondary, marginTop: spacing.xs, fontSize: typography.size.sm },
  notice: {
    color: colors.text.muted,
    fontSize: typography.size.sm,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  footer: { marginTop: spacing.lg },
  button: {
    backgroundColor: colors.brand.purple,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondary: {
    backgroundColor: colors.background.soft,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  buttonText: { color: colors.text.primary, fontWeight: typography.weight.semibold },
});
