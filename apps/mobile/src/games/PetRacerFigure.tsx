import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { PetCardRacePet, PetCardRaceSilhouette } from '@voxora/contracts';

type Geometry = {
  legHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyLeft: number;
  headSize: number;
  headDrop: number;
  earHeight: number;
  earWidth: number;
  tailWidth: number;
  tailHeight: number;
  tailLift: number;
  neckLift: number;
};

/**
 * A racing pet drawn from its own species silhouette.
 *
 * Placeholder art until the Pet Foundation and the Rive pipeline provide produced pets, but the
 * shapes are deliberately different per species: the panther is long and low, the wolf stands taller
 * on longer legs, the small mystic creature is compact with oversized ears and a big tail, and the
 * dragon carries a crest and a wing. One movement system, four different bodies.
 *
 * Geometry is measured from the ground line up, so heads, ears and tails stay attached at any size.
 */
export function PetRacerFigure({
  pet,
  size = 44,
  gaitPhase = 0,
  running = false,
  faded = false,
  effort = 1,
}: {
  pet: PetCardRacePet;
  size?: number;
  /** 0..1 through the stride cycle. */
  gaitPhase?: number;
  running?: boolean;
  faded?: boolean;
  /** Below 1 the pet labours, above 1 it stretches out. */
  effort?: number;
}) {
  const unit = size / 44;
  const geometry = geometryFor(pet.silhouette, unit);
  const { palette } = pet;

  const stretch = Math.min(Math.max(effort, 0.8), 1.3);
  const swing = running ? Math.sin(gaitPhase * Math.PI * 2) : 0;
  const bounce = running ? Math.abs(Math.sin(gaitPhase * Math.PI * 2)) * 1.6 * unit : 0;

  const bodyBottom = geometry.legHeight + bounce;
  const headBottom = bodyBottom + geometry.bodyHeight - geometry.headDrop + geometry.neckLift;
  const earBottom = headBottom + geometry.headSize - 2 * unit;
  const outline = 'rgba(255,255,255,0.38)';

  return (
    <View
      accessibilityLabel={`${pet.displayName}, ${pet.speciesFamily}`}
      style={[styles.figure, { height: 44 * unit, width: 56 * unit, opacity: faded ? 0.5 : 1 }]}
    >
      {/* Tail */}
      <View
        style={{
          position: 'absolute',
          left: geometry.bodyLeft - geometry.tailWidth * 0.7,
          bottom: bodyBottom + geometry.tailLift,
          width: geometry.tailWidth,
          height: geometry.tailHeight,
          borderRadius: geometry.tailHeight,
          backgroundColor: palette.accent,
          transform: [{ rotate: `${-14 + swing * 10}deg` }],
        }}
      />

      {/* Back leg then front leg, swinging in opposition */}
      <View
        style={{
          position: 'absolute',
          left: geometry.bodyLeft + geometry.bodyWidth * 0.18,
          bottom: 0,
          width: 4 * unit,
          height: geometry.legHeight + bounce,
          borderRadius: 2 * unit,
          backgroundColor: palette.shade,
          transform: [{ rotate: `${-swing * 22 * stretch}deg` }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: geometry.bodyLeft + geometry.bodyWidth * 0.7,
          bottom: 0,
          width: 4 * unit,
          height: geometry.legHeight + bounce,
          borderRadius: 2 * unit,
          backgroundColor: palette.shade,
          transform: [{ rotate: `${swing * 22 * stretch}deg` }],
        }}
      />

      {/* Body */}
      <View
        style={{
          position: 'absolute',
          left: geometry.bodyLeft,
          bottom: bodyBottom,
          width: geometry.bodyWidth,
          height: geometry.bodyHeight,
          borderRadius: geometry.bodyHeight * 0.55,
          backgroundColor: palette.body,
          borderColor: outline,
          borderWidth: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: geometry.bodyLeft + geometry.bodyWidth * 0.16,
          bottom: bodyBottom + geometry.bodyHeight * 0.15,
          width: geometry.bodyWidth * 0.45,
          height: geometry.bodyHeight * 0.5,
          borderRadius: geometry.bodyHeight * 0.3,
          backgroundColor: palette.shade,
          opacity: 0.6,
        }}
      />

      {/* Species marking on the flank */}
      <View
        style={{
          position: 'absolute',
          left: geometry.bodyLeft + geometry.bodyWidth * 0.62,
          bottom: bodyBottom + geometry.bodyHeight * 0.45,
          width: 4 * unit,
          height: 4 * unit,
          borderRadius: 1 * unit,
          backgroundColor: palette.accent,
          transform: [{ rotate: '45deg' }],
        }}
      />

      {pet.silhouette === 'DRAGON' ? (
        <View
          style={{
            position: 'absolute',
            left: geometry.bodyLeft + geometry.bodyWidth * 0.3,
            bottom: bodyBottom + geometry.bodyHeight * 0.7,
            width: geometry.bodyWidth * 0.5,
            height: 9 * unit,
            borderRadius: 5 * unit,
            backgroundColor: palette.accent,
            opacity: 0.85,
            transform: [{ rotate: `${-20 + swing * 8}deg` }],
          }}
        />
      ) : null}

      {/* Head */}
      <View
        style={{
          position: 'absolute',
          right: 2 * unit,
          bottom: headBottom,
          width: geometry.headSize * (pet.silhouette === 'DRAGON' ? 1.15 : 1),
          height: geometry.headSize,
          borderRadius: geometry.headSize * 0.5,
          backgroundColor: palette.body,
          borderColor: outline,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: geometry.headSize * 0.24,
            top: geometry.headSize * 0.3,
            width: 3 * unit,
            height: 3 * unit,
            borderRadius: 2 * unit,
            backgroundColor: palette.eye,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: geometry.headSize * 0.16,
            width: geometry.headSize * 0.48,
            height: geometry.headSize * 0.3,
            borderRadius: geometry.headSize * 0.2,
            backgroundColor: palette.shade,
          }}
        />
      </View>

      {/* Ears, or a dragon crest */}
      {pet.silhouette === 'DRAGON' ? (
        <>
          <Spike
            bottom={earBottom - 2 * unit}
            colour={palette.accent}
            height={geometry.earHeight}
            right={8 * unit}
            width={geometry.earWidth}
          />
          <Spike
            bottom={earBottom - 2 * unit}
            colour={palette.accent}
            height={geometry.earHeight * 0.7}
            right={14 * unit}
            width={geometry.earWidth}
          />
        </>
      ) : (
        <>
          <Spike
            bottom={earBottom}
            colour={palette.body}
            height={geometry.earHeight}
            right={4 * unit}
            width={geometry.earWidth}
          />
          <Spike
            bottom={earBottom}
            colour={palette.body}
            height={geometry.earHeight}
            right={12 * unit}
            width={geometry.earWidth}
          />
        </>
      )}
    </View>
  );
}

function Spike({
  bottom,
  colour,
  height,
  right,
  width,
}: {
  bottom: number;
  colour: string;
  height: number;
  right: number;
  width: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        right,
        bottom,
        width: 0,
        height: 0,
        borderLeftWidth: width / 2,
        borderRightWidth: width / 2,
        borderBottomWidth: height,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: colour,
      }}
    />
  );
}

function geometryFor(silhouette: PetCardRaceSilhouette, unit: number): Geometry {
  switch (silhouette) {
    case 'PANTHER':
      // Long, low and level: a stalker at full stretch.
      return {
        legHeight: 9 * unit,
        bodyWidth: 34 * unit,
        bodyHeight: 12 * unit,
        bodyLeft: 8 * unit,
        headSize: 13 * unit,
        headDrop: 5 * unit,
        earHeight: 6 * unit,
        earWidth: 6 * unit,
        tailWidth: 18 * unit,
        tailHeight: 4 * unit,
        tailLift: 4 * unit,
        neckLift: 0,
      };
    case 'WOLF':
      // Taller on the leg with upright ears and a bushy tail.
      return {
        legHeight: 12 * unit,
        bodyWidth: 29 * unit,
        bodyHeight: 13 * unit,
        bodyLeft: 10 * unit,
        headSize: 14 * unit,
        headDrop: 4 * unit,
        earHeight: 9 * unit,
        earWidth: 7 * unit,
        tailWidth: 15 * unit,
        tailHeight: 8 * unit,
        tailLift: 3 * unit,
        neckLift: 2 * unit,
      };
    case 'SMALL_MYSTIC':
      // Compact and fluffy: oversized ears and a comet tail.
      return {
        legHeight: 8 * unit,
        bodyWidth: 23 * unit,
        bodyHeight: 14 * unit,
        bodyLeft: 13 * unit,
        headSize: 15 * unit,
        headDrop: 3 * unit,
        earHeight: 12 * unit,
        earWidth: 7 * unit,
        tailWidth: 17 * unit,
        tailHeight: 12 * unit,
        tailLift: 2 * unit,
        neckLift: 1 * unit,
      };
    case 'DRAGON':
      // Low reptile stance, crest and wing, long heavy tail.
      return {
        legHeight: 9 * unit,
        bodyWidth: 31 * unit,
        bodyHeight: 13 * unit,
        bodyLeft: 9 * unit,
        headSize: 13 * unit,
        headDrop: 4 * unit,
        earHeight: 9 * unit,
        earWidth: 7 * unit,
        tailWidth: 20 * unit,
        tailHeight: 5 * unit,
        tailLift: 3 * unit,
        neckLift: 0,
      };
  }
}

const styles = StyleSheet.create({
  figure: {
    position: 'relative',
  },
});
