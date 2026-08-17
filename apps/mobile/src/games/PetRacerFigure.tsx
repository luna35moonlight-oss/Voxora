import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { PetCardRaceRacerId } from '@voxora/contracts';

type Palette = {
  body: string;
  shade: string;
  accent: string;
  eye: string;
  crest: 'POINTED_EARS' | 'TALL_EARS' | 'WOLF_EARS' | 'DRAGON_CREST';
};

/** Lane-sized racer figures tinted to match the Voxora pet art. */
const palettes: Record<PetCardRaceRacerId, Palette> = {
  // Lifted well off true black so the panther still reads against the dark lane behind it.
  'shadow-panther': {
    body: '#4A3680',
    shade: '#6B51B0',
    accent: '#C4B5FD',
    eye: '#F5F3FF',
    crest: 'POINTED_EARS',
  },
  'star-kitten': {
    body: '#E6D8FF',
    shade: '#F7EDFF',
    accent: '#FF9BD2',
    eye: '#6D28D9',
    crest: 'TALL_EARS',
  },
  'moonlit-wolf': {
    body: '#EEF3FF',
    shade: '#CBD8FF',
    accent: '#A5B4FC',
    eye: '#6D28D9',
    crest: 'WOLF_EARS',
  },
  'aurora-dragon': {
    body: '#1F9E93',
    shade: '#2DD4BF',
    accent: '#86EFAC',
    eye: '#0B4F45',
    crest: 'DRAGON_CREST',
  },
};

export function PetRacerFigure({
  racerId,
  faded = false,
}: {
  racerId: PetCardRaceRacerId;
  faded?: boolean;
}) {
  const palette = palettes[racerId];

  return (
    <View style={[styles.figure, faded && styles.faded]}>
      <View
        style={[
          styles.tail,
          { backgroundColor: palette.accent },
          palette.crest === 'TALL_EARS' && styles.fluffyTail,
        ]}
      />
      <View style={[styles.body, { backgroundColor: palette.body }]} />
      <View style={[styles.haunch, { backgroundColor: palette.shade }]} />
      {palette.crest === 'DRAGON_CREST' ? (
        <>
          <View
            style={[styles.crestSpike, styles.crestBack, { borderBottomColor: palette.accent }]}
          />
          <View
            style={[styles.crestSpike, styles.crestFront, { borderBottomColor: palette.accent }]}
          />
        </>
      ) : (
        <>
          <View
            style={[
              styles.ear,
              styles.earBack,
              { borderBottomColor: palette.body },
              palette.crest === 'TALL_EARS' && styles.tallEar,
            ]}
          />
          <View
            style={[
              styles.ear,
              styles.earFront,
              { borderBottomColor: palette.body },
              palette.crest === 'TALL_EARS' && styles.tallEar,
            ]}
          />
        </>
      )}
      <View style={[styles.head, { backgroundColor: palette.body }]}>
        <View style={[styles.eye, { backgroundColor: palette.eye }]} />
        <View style={[styles.muzzle, { backgroundColor: palette.shade }]} />
      </View>
      <View style={[styles.gem, { backgroundColor: palette.accent }]} />
      <View style={[styles.leg, styles.frontLeg, { backgroundColor: palette.shade }]} />
      <View style={[styles.leg, styles.backLeg, { backgroundColor: palette.shade }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  figure: {
    height: 30,
    width: 34,
  },
  faded: {
    opacity: 0.45,
  },
  tail: {
    borderRadius: 4,
    height: 5,
    left: 0,
    position: 'absolute',
    top: 9,
    transform: [{ rotate: '-24deg' }],
    width: 14,
  },
  fluffyTail: {
    height: 8,
    borderRadius: 6,
  },
  // A hairline outline keeps every racer readable against the dark lane.
  body: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 9,
    borderWidth: 1,
    bottom: 6,
    height: 13,
    left: 8,
    position: 'absolute',
    width: 20,
  },
  haunch: {
    borderRadius: 6,
    bottom: 8,
    height: 9,
    left: 10,
    opacity: 0.7,
    position: 'absolute',
    width: 9,
  },
  head: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 8,
    borderWidth: 1,
    height: 14,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 5,
    width: 14,
  },
  eye: {
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    right: 4,
    top: 4,
    width: 3,
  },
  muzzle: {
    borderRadius: 3,
    bottom: 2,
    height: 4,
    position: 'absolute',
    right: 1,
    width: 6,
  },
  ear: {
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderLeftWidth: 3,
    borderRightColor: 'transparent',
    borderRightWidth: 3,
    height: 0,
    position: 'absolute',
    top: 0,
    width: 0,
  },
  earBack: { right: 10 },
  earFront: { right: 2 },
  tallEar: {
    borderBottomWidth: 10,
    top: -3,
  },
  crestSpike: {
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderLeftWidth: 3,
    borderRightColor: 'transparent',
    borderRightWidth: 3,
    height: 0,
    position: 'absolute',
    top: -2,
    width: 0,
  },
  crestBack: { right: 11 },
  crestFront: { right: 3 },
  gem: {
    borderRadius: 2,
    bottom: 12,
    height: 4,
    position: 'absolute',
    right: 12,
    transform: [{ rotate: '45deg' }],
    width: 4,
  },
  leg: {
    borderRadius: 2,
    bottom: 1,
    height: 6,
    position: 'absolute',
    width: 4,
  },
  frontLeg: { right: 6 },
  backLeg: { left: 10 },
});
