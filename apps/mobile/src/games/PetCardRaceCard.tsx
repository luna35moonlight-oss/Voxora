import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import {
  PET_CARD_RACE_ROSTER,
  PET_CARD_RACE_TACTIC_DEFINITIONS,
  PetCardRacePlayCooldownMs,
  PetCardRaceRivalTickMs,
  PetCardRaceStationCount,
  type PetCardRaceCard as PetCardRaceCardModel,
  type PetCardRaceEvent,
  type PetCardRaceLane,
  type PetCardRaceMeetView,
  type PetCardRaceRacerId,
  type PetCardRaceRaceResult,
  type PetCardRaceResponse,
  type PetCardRaceStatusResponse,
} from '@voxora/contracts';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';
import { PetRacerFigure } from './PetRacerFigure';
import {
  applyPetCardRaceEvent,
  formatPetCardRaceCooldown,
  formatPetCardRacePosition,
  petCardRaceLaneProgress,
  petCardRaceRacerName,
  petCardRaceSelectionNeedsTarget,
  reconcilePetCardRaceLanes,
  summarisePetCardRaceSelection,
} from './petCardRace';

const revealIntervalMs = 320;
const logLength = 4;

export function PetCardRaceCard() {
  const [status, setStatus] = useState<PetCardRaceStatusResponse | null>(null);
  const [meet, setMeet] = useState<PetCardRaceMeetView | null>(null);
  const [lanes, setLanes] = useState<PetCardRaceLane[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetRacerId, setTargetRacerId] = useState<PetCardRaceRacerId | null>(null);
  const [championChoice, setChampionChoice] = useState<PetCardRaceRacerId | null>(null);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queue = useRef<PetCardRaceEvent[]>([]);
  const meetRef = useRef<PetCardRaceMeetView | null>(null);
  const busyRef = useRef(false);
  const raceKey = useRef<string | null>(null);
  const needsReconcile = useRef(false);

  const roster = status?.roster ?? [...PET_CARD_RACE_ROSTER];
  const race = meet?.currentRace ?? null;
  const hand = race?.hand ?? [];
  const racing = meet?.meetPhase === 'RACING' && race?.phase === 'RUNNING';
  const lastResult = meet?.completedRaces[meet.completedRaces.length - 1] ?? null;

  const selectedCards = useMemo(
    () => selectedIds.flatMap((id) => hand.filter((card) => card.cardId === id)),
    [hand, selectedIds],
  );
  const summary = useMemo(() => summarisePetCardRaceSelection(selectedCards), [selectedCards]);
  const needsTarget = petCardRaceSelectionNeedsTarget(selectedCards);
  const rivals = lanes.filter((lane) => !lane.isChampion && lane.finishPosition === null);
  const attemptsRemaining = status?.attemptsRemainingToday ?? 0;

  const championPickerRacers = useMemo(() => {
    if (!meet || meet.meetPhase === 'COMPLETE' || meet.meetPhase === 'FORFEITED') {
      return roster;
    }

    return roster.filter((racer) => meet.availableRacerIds.includes(racer.racerId));
  }, [meet, roster]);

  useEffect(() => {
    void refreshStatus();
  }, []);

  // Reveals server events one at a time so rival run cards animate instead of jumping.
  useEffect(() => {
    const timer = setInterval(() => {
      const next = queue.current.shift();
      if (next) {
        setLanes((current) => applyPetCardRaceEvent(current, next));
        setLog((current) => [next.message, ...current].slice(0, logLength));
        return;
      }

      if (needsReconcile.current) {
        needsReconcile.current = false;
        const snapshot = meetRef.current?.currentRace?.lanes;
        if (snapshot) {
          setLanes(reconcilePetCardRaceLanes(snapshot));
        }
      }
    }, revealIntervalMs);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setCooldownMs((remaining) => (remaining > 0 ? Math.max(0, remaining - 250) : 0)),
      250,
    );

    return () => clearInterval(timer);
  }, []);

  // The server advances rivals on its own clock, so the client keeps asking what happened.
  useEffect(() => {
    const timer = setInterval(() => {
      void syncRace();
    }, PetCardRaceRivalTickMs);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Card race</Text>
          <Text style={styles.title}>Voxora Pet Card Race</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>10 meets/day</Text>
        </View>
      </View>

      <Text style={styles.intro}>
        Three races, a different pet each race. Cards run your champion: singles crawl, pairs and
        full houses surge, and 10, J, Q, and K run faster than the rest. Rivals move on the server
        clock while you wait {Math.round(PetCardRacePlayCooldownMs / 1000)} seconds between
        selections.
      </Text>

      <View style={styles.meetStrip}>
        <Text style={styles.meetStripText}>
          Race {meet?.raceNumber ?? 1} of {meet?.racesTotal ?? 3}
          {race ? ` · station ${race.stationsDealt}/${PetCardRaceStationCount}` : ''}
        </Text>
        <Text style={styles.meetStripText}>Meet score {meet?.meetScore ?? 0}</Text>
      </View>

      <View style={styles.track}>
        {(lanes.length > 0 ? lanes : placeholderLanes()).map((lane) => (
          <Lane
            key={lane.racerId}
            lane={lane}
            mudSteps={race?.mudSteps ?? []}
            name={petCardRaceRacerName(roster, lane.racerId)}
            trackLength={race?.trackLength ?? 14}
          />
        ))}
      </View>

      {log.length > 0 ? (
        <View style={styles.logBox} accessibilityLiveRegion="polite">
          {log.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={index === 0 ? styles.logLead : styles.logText}>
              {entry}
            </Text>
          ))}
        </View>
      ) : null}

      {racing ? (
        <>
          <View style={styles.handHeader}>
            <Text style={styles.sectionTitle}>Your hand ({hand.length})</Text>
            <Text style={styles.sectionMeta}>{race?.cardsLeftToDeal ?? 0} still to deal</Text>
          </View>

          <View style={styles.hand}>
            {hand.map((card) => (
              <HandCard
                key={card.cardId}
                card={card}
                disabled={busy}
                onPress={() => toggleCard(card)}
                selected={selectedIds.includes(card.cardId)}
              />
            ))}
            {hand.length === 0 ? (
              <Text style={styles.sectionMeta}>
                Your hand is empty until the pack reaches the next station.
              </Text>
            ) : null}
          </View>

          <View style={styles.summaryBox}>
            <Text style={summary.valid ? styles.summaryValid : styles.summaryInvalid}>
              {summary.headline}
            </Text>
            {summary.detail ? <Text style={styles.summaryDetail}>{summary.detail}</Text> : null}
          </View>

          {needsTarget ? (
            <View style={styles.targetRow}>
              <Text style={styles.sectionMeta}>Send the chaser after</Text>
              <View style={styles.chipRow}>
                {rivals.map((lane) => (
                  <Pressable
                    accessibilityRole="button"
                    key={lane.racerId}
                    onPress={() => setTargetRacerId(lane.racerId)}
                    style={[styles.chip, targetRacerId === lane.racerId && styles.chipSelected]}
                  >
                    <Text style={styles.chipText}>
                      {petCardRaceRacerName(roster, lane.racerId)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: runDisabled() }}
            disabled={runDisabled()}
            onPress={() => void playSelection()}
            style={[styles.primaryButton, runDisabled() && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {cooldownMs > 0 ? formatPetCardRaceCooldown(cooldownMs) : 'Run these cards'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void forfeitMeet()}
            style={[styles.secondaryButton, busy && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>Forfeit this meet</Text>
          </Pressable>
        </>
      ) : (
        <>
          {lastResult ? <RaceResultPanel result={lastResult} roster={roster} /> : null}

          {meet?.result ? (
            <View style={styles.resultBox}>
              <Text style={styles.sectionTitle}>Meet complete</Text>
              <Text style={styles.resultText}>
                {meet.result.totalScore} points · {meet.result.wins} win
                {meet.result.wins === 1 ? '' : 's'} · best finish{' '}
                {formatPetCardRacePosition(meet.result.bestPosition)}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            {meet?.meetPhase === 'RACE_INTERMISSION'
              ? `Choose your pet for race ${(meet.completedRaces.length ?? 0) + 1}`
              : 'Choose the pet for race 1'}
          </Text>
          <View style={styles.chipRow}>
            {championPickerRacers.map((racer) => (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                key={racer.racerId}
                onPress={() => setChampionChoice(racer.racerId)}
                style={[styles.petChip, championChoice === racer.racerId && styles.chipSelected]}
              >
                <PetRacerFigure racerId={racer.racerId} />
                <View style={styles.petChipText}>
                  <Text style={styles.chipText}>{racer.displayName}</Text>
                  <Text style={styles.petChipMeta}>{racer.speciesFamily}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: startDisabled() }}
            disabled={startDisabled()}
            onPress={() => void startRace()}
            style={[styles.primaryButton, startDisabled() && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{startLabel()}</Text>
          </Pressable>
        </>
      )}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>Tactic cards in the deck</Text>
        {PET_CARD_RACE_TACTIC_DEFINITIONS.map((definition) => (
          <Text key={definition.kind} style={styles.infoText}>
            {definition.title}: {definition.description}
          </Text>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.infoText}>
          Meets used: {status?.attemptsUsedToday ?? 0}/{status?.dailyAttemptLimit ?? 10} · best meet
          score: {status?.bestScore ?? 0} · your rank:{' '}
          {status?.bestRank ? `#${status.bestRank}` : 'not ranked yet'}
        </Text>
        {status?.leaderboard.map((entry) => (
          <Text key={`${entry.rank}-${entry.playerLabel}`} style={styles.infoText}>
            #{entry.rank} {entry.playerLabel}: {entry.score}
          </Text>
        ))}
        <Text style={styles.infoText}>{status?.rewardNote ?? ''}</Text>
      </View>

      <Text style={styles.finePrint}>
        Voxora shuffles the deck, deals every station, moves the rivals, and calculates the score.
        The app never awards prizes, currencies, or pet progression for this race.
      </Text>
    </View>
  );

  function runDisabled(): boolean {
    return (
      busy || !racing || !summary.valid || cooldownMs > 0 || (needsTarget && targetRacerId === null)
    );
  }

  function startDisabled(): boolean {
    if (busy || championChoice === null) {
      return true;
    }

    if (meet?.meetPhase === 'RACE_INTERMISSION') {
      return false;
    }

    return attemptsRemaining <= 0;
  }

  function startLabel(): string {
    if (busy) {
      return 'Syncing…';
    }

    if (meet?.meetPhase === 'RACE_INTERMISSION') {
      const nextRace = meet.completedRaces.length + 1;
      return championChoice
        ? `Start race ${nextRace} with ${petCardRaceRacerName(roster, championChoice)}`
        : `Choose a pet for race ${nextRace}`;
    }

    if (attemptsRemaining <= 0) {
      return 'Daily meet limit reached';
    }

    return championChoice
      ? `Start meet with ${petCardRaceRacerName(roster, championChoice)}`
      : 'Choose your first pet';
  }

  function toggleCard(card: PetCardRaceCardModel) {
    setSelectedIds((current) =>
      current.includes(card.cardId)
        ? current.filter((id) => id !== card.cardId)
        : [...current, card.cardId],
    );
    setTargetRacerId(null);
  }

  async function refreshStatus() {
    await guard(async (token) => {
      setStatus(await apiClient.petCardRaceStatus(token));
    });
  }

  async function startRace() {
    if (!championChoice) {
      return;
    }

    await guard(async (token) => {
      const response =
        meet && meet.meetPhase === 'RACE_INTERMISSION'
          ? await apiClient.startNextPetCardRace(token, meet.attemptId, {
              championRacerId: championChoice,
            })
          : await apiClient.startPetCardRaceMeet(token, { championRacerId: championChoice });

      ingest(response);
      setChampionChoice(null);
    });
  }

  async function playSelection() {
    if (!meet || selectedCards.length === 0) {
      return;
    }

    await guard(async (token) => {
      const response = await apiClient.playPetCardRaceCards(token, meet.attemptId, {
        cardIds: selectedCards.map((card) => card.cardId),
        ...(needsTarget && targetRacerId ? { targetRacerId } : {}),
      });

      ingest(response);
      setSelectedIds([]);
      setTargetRacerId(null);
    });
  }

  async function forfeitMeet() {
    if (!meet) {
      return;
    }

    await guard(async (token) => {
      ingest(await apiClient.forfeitPetCardRace(token, meet.attemptId));
    });
  }

  /** Background refresh: rivals keep running whether or not the player plays a card. */
  async function syncRace() {
    const current = meetRef.current;
    if (
      !current ||
      busyRef.current ||
      current.meetPhase !== 'RACING' ||
      current.currentRace?.phase !== 'RUNNING'
    ) {
      return;
    }

    try {
      const token = await secureSessionStore.getAccessToken();
      if (!token) {
        return;
      }

      ingest(await apiClient.syncPetCardRace(token, current.attemptId));
    } catch {
      // A missed background sync is harmless: the next response carries the authoritative lanes.
    }
  }

  async function guard(action: (token: string) => Promise<void>) {
    setBusy(true);
    busyRef.current = true;
    setError(null);
    try {
      const token = await secureSessionStore.getAccessToken();
      if (!token) {
        throw new Error('Sign in again to play the Pet Card Race');
      }

      await action(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pet Card Race request failed');
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  function ingest(response: PetCardRaceResponse) {
    setStatus(response.status);
    setMeet(response.meet);
    meetRef.current = response.meet;

    const current = response.meet.currentRace;
    if (!current) {
      queue.current = [];
      setLanes([]);
      raceKey.current = null;
      return;
    }

    const key = `${response.meet.attemptId}:${current.raceNumber}`;
    if (raceKey.current !== key) {
      raceKey.current = key;
      queue.current = [];
      setLog([]);
      setSelectedIds([]);
      setTargetRacerId(null);
      setLanes(reconcilePetCardRaceLanes(current.lanes));
    }

    queue.current = [...queue.current, ...current.events];
    needsReconcile.current = true;
    setCooldownMs(current.cooldownRemainingMs);
  }
}

function Lane({
  lane,
  mudSteps,
  name,
  trackLength,
}: {
  lane: PetCardRaceLane;
  mudSteps: readonly number[];
  name: string;
  trackLength: number;
}) {
  const progress = petCardRaceLaneProgress(lane.step, trackLength);

  return (
    <View style={styles.lane}>
      <View style={styles.laneLabel}>
        <Text style={lane.isChampion ? styles.laneNameChampion : styles.laneName}>{name}</Text>
        <Text style={styles.laneMeta}>
          {lane.finishPosition ? formatPetCardRacePosition(lane.finishPosition) : `${lane.step}`}
        </Text>
      </View>
      <View style={styles.laneTrack} accessibilityLabel={`${name} on step ${lane.step}`}>
        {mudSteps.map((step, index) => (
          <View
            key={`mud-${step}-${index}`}
            style={[styles.mud, { left: `${petCardRaceLaneProgress(step, trackLength) * 100}%` }]}
          />
        ))}
        <View style={styles.finishLine} />
        <View style={[styles.racerMarker, { left: `${progress * 100}%` }]}>
          <PetRacerFigure racerId={lane.racerId} faded={lane.finishPosition !== null} />
        </View>
      </View>
      <View style={styles.laneFlags}>
        {lane.shielded ? <Text style={styles.flagShield}>shield</Text> : null}
        {lane.slowedSteps > 0 ? <Text style={styles.flagSlow}>-{lane.slowedSteps}</Text> : null}
      </View>
    </View>
  );
}

function HandCard({
  card,
  disabled,
  onPress,
  selected,
}: {
  card: PetCardRaceCardModel;
  disabled: boolean;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.handCard,
        card.type === 'TACTIC' && styles.tacticCard,
        card.type === 'JOKER' && styles.jokerCard,
        card.fast && styles.fastCard,
        selected && styles.handCardSelected,
      ]}
    >
      <Text style={styles.handCardLabel}>{card.label}</Text>
      {card.fast ? <Text style={styles.handCardTag}>fast</Text> : null}
      {card.type === 'JOKER' ? <Text style={styles.handCardTag}>wild</Text> : null}
    </Pressable>
  );
}

function RaceResultPanel({
  result,
  roster,
}: {
  result: PetCardRaceRaceResult;
  roster: PetCardRaceStatusResponse['roster'];
}) {
  return (
    <View style={styles.resultBox}>
      <Text style={styles.sectionTitle}>
        Race {result.raceNumber}: {petCardRaceRacerName(roster, result.championRacerId)} finished{' '}
        {formatPetCardRacePosition(result.championPosition)}
      </Text>
      <Text style={styles.resultText}>
        {result.score} points — {result.breakdown.positionPoints} finish,{' '}
        {result.breakdown.comboPoints} combinations, {result.breakdown.tacticPoints} tactics,{' '}
        {result.breakdown.marginBonus} margin
        {result.photoFinish ? `, ${result.breakdown.photoFinishBonus} photo finish` : ''}
      </Text>
      <Text style={styles.resultText}>
        {result.order
          .map(
            (entry) =>
              `${formatPetCardRacePosition(entry.position)} ${petCardRaceRacerName(roster, entry.racerId)}`,
          )
          .join(' · ')}
      </Text>
    </View>
  );
}

function placeholderLanes(): PetCardRaceLane[] {
  return PET_CARD_RACE_ROSTER.map((racer, index) => ({
    racerId: racer.racerId,
    isChampion: index === 0,
    step: 0,
    slowedSteps: 0,
    shielded: false,
    finishPosition: null,
  }));
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
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headerText: { flexShrink: 1 },
  kicker: {
    color: colors.brand.pink,
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
  intro: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  meetStrip: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  meetStripText: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  track: {
    backgroundColor: '#1A1030',
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  lane: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  laneLabel: { width: 64 },
  laneName: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
  },
  laneNameChampion: {
    color: colors.brand.blue,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  laneMeta: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  laneTrack: {
    backgroundColor: '#241844',
    borderRadius: radius.pill,
    flexGrow: 1,
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mud: {
    backgroundColor: '#7A5A2E',
    borderRadius: 3,
    height: 22,
    marginLeft: -3,
    opacity: 0.85,
    position: 'absolute',
    width: 6,
  },
  finishLine: {
    backgroundColor: colors.brand.pink,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 3,
  },
  racerMarker: {
    marginLeft: -30,
    position: 'absolute',
  },
  laneFlags: {
    alignItems: 'flex-end',
    width: 44,
  },
  flagShield: {
    color: colors.brand.blue,
    fontSize: typography.size.xs,
  },
  flagSlow: {
    color: colors.state.warning,
    fontSize: typography.size.xs,
  },
  logBox: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  logLead: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
  },
  logText: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  handHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  sectionMeta: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  hand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  handCard: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 58,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  fastCard: {
    borderColor: colors.brand.blue,
  },
  jokerCard: {
    borderColor: colors.state.focus,
  },
  tacticCard: {
    backgroundColor: '#2A1B44',
    borderColor: colors.brand.purple,
    minWidth: 104,
  },
  handCardSelected: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.text.primary,
  },
  handCardLabel: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  handCardTag: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  summaryBox: {
    marginTop: spacing.sm,
  },
  summaryValid: {
    color: colors.state.success,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  summaryInvalid: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  summaryDetail: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  targetRow: {
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  petChip: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  petChipText: { alignItems: 'flex-start' },
  petChipMeta: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  chipSelected: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.text.primary,
  },
  chipText: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.purple,
    borderRadius: radius.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontWeight: typography.weight.semibold,
  },
  disabledButton: {
    backgroundColor: colors.state.locked,
    opacity: 0.6,
  },
  resultBox: {
    backgroundColor: '#201735',
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  resultText: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  infoBox: {
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  error: {
    color: colors.state.error,
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  finePrint: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
  },
});
