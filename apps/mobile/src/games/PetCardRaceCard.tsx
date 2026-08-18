import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@voxora/design-system';
import {
  PET_CARD_RACE_PETS,
  PET_CARD_RACE_TACTIC_DEFINITIONS,
  PetCardRacePlayCooldownMs,
  PetCardRaceSyncIntervalMs,
  type PetCardRaceCard as PetCardRaceCardModel,
  type PetCardRaceCheckpoint,
  type PetCardRaceCompetitor,
  type PetCardRaceMeetView,
  type PetCardRaceObstacle,
  type PetCardRacePet,
  type PetCardRacePetId,
  type PetCardRaceRaceResult,
  type PetCardRaceResponse,
  type PetCardRaceStatusResponse,
} from '@voxora/contracts';
import { apiClient } from '../services/apiClient';
import { secureSessionStore } from '../services/secureSessionStore';
import { PetRacerFigure } from './PetRacerFigure';
import {
  describePetCardRaceStatus,
  formatPetCardRaceCooldown,
  formatPetCardRacePosition,
  interpolatePetCardRaceProgress,
  orderPetCardRaceLiveRacers,
  petCardRaceCountdownLabel,
  petCardRaceGaitPhase,
  petCardRaceSelectionNeedsTarget,
  summarisePetCardRaceSelection,
} from './petCardRace';

const frameIntervalMs = 60;
const logLength = 3;

export function PetCardRaceCard() {
  const [status, setStatus] = useState<PetCardRaceStatusResponse | null>(null);
  const [meet, setMeet] = useState<PetCardRaceMeetView | null>(null);
  const [petChoice, setPetChoice] = useState<PetCardRacePetId | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetCompetitorId, setTargetCompetitorId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setFrame] = useState(0);

  const meetRef = useRef<PetCardRaceMeetView | null>(null);
  const busyRef = useRef(false);
  const snapshotAtRef = useRef(Date.now());
  const raceKeyRef = useRef<string | null>(null);

  const race = meet?.currentRace ?? null;
  const racing = race?.phase === 'RUNNING' || race?.phase === 'COUNTDOWN';
  const pets = status?.pets ?? [...PET_CARD_RACE_PETS];
  const hand = race?.hand ?? [];
  const sinceSnapshotMs = racing ? Math.max(0, Date.now() - snapshotAtRef.current) : 0;

  const selectedCards = useMemo(
    () => selectedIds.flatMap((id) => hand.filter((card) => card.cardId === id)),
    [hand, selectedIds],
  );
  const summary = useMemo(() => summarisePetCardRaceSelection(selectedCards), [selectedCards]);
  const needsTarget = petCardRaceSelectionNeedsTarget(selectedCards);

  const liveRacers = useMemo(
    () =>
      race ? orderPetCardRaceLiveRacers(race.competitors, sinceSnapshotMs, race.courseMetres) : [],
    [race, sinceSnapshotMs],
  );
  const liveById = useMemo(
    () => new Map(liveRacers.map((racer) => [racer.competitorId, racer])),
    [liveRacers],
  );

  const cooldownRemainingMs = Math.max(0, (race?.cooldownRemainingMs ?? 0) - sinceSnapshotMs);
  const countdownRemainingMs = Math.max(0, (race?.countdownRemainingMs ?? 0) - sinceSnapshotMs);
  const yourCompetitor = race?.competitors.find((competitor) => competitor.isYou) ?? null;
  const yourPosition = yourCompetitor
    ? (liveById.get(yourCompetitor.competitorId)?.position ?? yourCompetitor.position)
    : null;
  const lastResult = meet?.completedRaces[meet.completedRaces.length - 1] ?? null;
  const attemptsRemaining = status?.attemptsRemainingToday ?? 0;

  const selectablePets = useMemo(() => {
    if (!meet || meet.meetPhase === 'COMPLETE' || meet.meetPhase === 'FORFEITED') {
      return pets;
    }

    return pets.filter((pet) => meet.selectablePetIds.includes(pet.petId));
  }, [meet, pets]);

  const ingest = useCallback((response: PetCardRaceResponse) => {
    setStatus(response.status);
    setMeet(response.meet);
    meetRef.current = response.meet;
    snapshotAtRef.current = Date.now();

    const current = response.meet.currentRace;
    if (!current) {
      raceKeyRef.current = null;
      return;
    }

    const key = `${response.meet.attemptId}:${current.raceNumber}`;
    if (raceKeyRef.current !== key) {
      raceKeyRef.current = key;
      setSelectedIds([]);
      setTargetCompetitorId(null);
      setLog([]);
    }

    if (current.events.length > 0) {
      setLog((entries) =>
        [...current.events.map((event) => event.message).reverse(), ...entries].slice(0, logLength),
      );
    }
  }, []);

  const syncRace = useCallback(async () => {
    const current = meetRef.current;
    if (!current || busyRef.current || current.currentRace === null) {
      return;
    }

    if (current.currentRace.phase !== 'RUNNING' && current.currentRace.phase !== 'COUNTDOWN') {
      return;
    }

    try {
      const token = await secureSessionStore.getAccessToken();
      if (!token) {
        return;
      }

      ingest(await apiClient.syncPetCardRace(token, current.attemptId));
    } catch {
      // A missed background sync is harmless: the next snapshot carries authoritative positions.
    }
  }, [ingest]);

  useEffect(() => {
    void guard(async (token) => {
      setStatus(await apiClient.petCardRaceStatus(token));
    });
  }, []);

  // Keeps the pets moving on screen between server snapshots.
  useEffect(() => {
    const timer = setInterval(() => setFrame((frame) => frame + 1), frameIntervalMs);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void syncRace();
    }, PetCardRaceSyncIntervalMs);

    return () => clearInterval(timer);
  }, [syncRace]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Live card race</Text>
          <Text style={styles.title}>Voxora Pet Card Race</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>10 meets/day</Text>
        </View>
      </View>

      {racing && race ? (
        <>
          <View style={styles.meetStrip}>
            <Text style={styles.meetStripText}>
              Race {meet?.raceNumber ?? 1} of {meet?.racesTotal ?? 3} ·{' '}
              {yourPosition ? formatPetCardRacePosition(yourPosition) : '—'}
            </Text>
            <Text style={styles.meetStripText}>
              Checkpoint {race.checkpointsReached}/{race.checkpoints.length} · wins{' '}
              {status?.raceWins ?? 0}
            </Text>
          </View>

          <ProgressRail
            checkpoints={race.checkpoints}
            competitors={race.competitors}
            courseMetres={race.courseMetres}
            progressOf={(competitorId) => liveById.get(competitorId)?.progressFraction ?? 0}
          />

          <View style={styles.arena}>
            {race.competitors.map((competitor) => (
              <RaceLane
                key={competitor.competitorId}
                competitor={competitor}
                courseMetres={race.courseMetres}
                obstacles={race.obstacles}
                position={liveById.get(competitor.competitorId)?.position ?? competitor.position}
                progressFraction={
                  liveById.get(competitor.competitorId)?.progressFraction ??
                  competitor.progressFraction
                }
                progressMetres={interpolatePetCardRaceProgress(
                  competitor,
                  sinceSnapshotMs,
                  race.courseMetres,
                )}
                running={race.phase === 'RUNNING' && competitor.finishPosition === null}
              />
            ))}

            {race.phase === 'COUNTDOWN' ? (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>
                  {petCardRaceCountdownLabel(countdownRemainingMs)}
                </Text>
                <Text style={styles.countdownHint}>All four pets launch on GO</Text>
              </View>
            ) : null}
          </View>

          {log.length > 0 ? (
            <View style={styles.logBox} accessibilityLiveRegion="polite">
              {log.map((entry, index) => (
                <Text
                  key={`${entry}-${index}`}
                  style={index === 0 ? styles.logLead : styles.logText}
                >
                  {entry}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.handHeader}>
            <Text style={styles.sectionTitle}>Your cards ({hand.length})</Text>
            <Text style={styles.sectionMeta}>{race.cardsLeftToDeal} still to come</Text>
          </View>

          <View style={styles.hand}>
            {hand.map((card) => (
              <HandCard
                key={card.cardId}
                card={card}
                disabled={busy || race.phase !== 'RUNNING'}
                onPress={() => toggleCard(card)}
                selected={selectedIds.includes(card.cardId)}
              />
            ))}
          </View>

          <Text style={summary.valid ? styles.summaryValid : styles.summaryInvalid}>
            {summary.headline}
          </Text>
          {summary.detail ? <Text style={styles.summaryDetail}>{summary.detail}</Text> : null}

          {needsTarget ? (
            <View style={styles.targetRow}>
              <Text style={styles.sectionMeta}>Send the chaser after</Text>
              <View style={styles.chipRow}>
                {race.competitors
                  .filter((competitor) => !competitor.isYou && competitor.finishPosition === null)
                  .map((competitor) => (
                    <Pressable
                      accessibilityRole="button"
                      key={competitor.competitorId}
                      onPress={() => setTargetCompetitorId(competitor.competitorId)}
                      style={[
                        styles.chip,
                        targetCompetitorId === competitor.competitorId && styles.chipSelected,
                      ]}
                    >
                      <Text style={styles.chipText}>{competitor.pet.displayName}</Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: commitDisabled() }}
            disabled={commitDisabled()}
            onPress={() => void commitPlay()}
            style={[styles.primaryButton, commitDisabled() && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {formatPetCardRaceCooldown(cooldownRemainingMs)}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void forfeitMeet()}
            style={[styles.secondaryButton, busy && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>Leave this meet</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.intro}>
            Three races, a different pet each race. All four pets run the whole way: your cards make
            your pet faster, slow the rivals, put mud on the course, or shield your pet. You wait{' '}
            {Math.round(PetCardRacePlayCooldownMs / 1000)} seconds between plays while the race
            keeps going.
          </Text>

          {lastResult ? <RaceResultPanel result={lastResult} /> : null}

          {meet?.result ? (
            <View style={styles.resultBox}>
              <Text style={styles.sectionTitle}>Meet complete</Text>
              <Text style={styles.resultText}>
                {meet.result.totalScore} points · {meet.result.wins} win
                {meet.result.wins === 1 ? '' : 's'} · best finish{' '}
                {formatPetCardRacePosition(meet.result.bestPosition)}
              </Text>
              {meet.result.standings.map((standing) => (
                <Text key={standing.competitorId} style={styles.resultText}>
                  {standing.isYou ? 'You' : standing.trainerName}: {standing.points} points
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.trainerRow}>
            {status?.trainerAvatar ? (
              <>
                <View style={styles.trainerBadge}>
                  <Text style={styles.trainerInitial}>
                    {status.trainerAvatar.displayName.slice(0, 1)}
                  </Text>
                </View>
                <Text style={styles.trainerText}>
                  {status.trainerAvatar.displayName}, your Voxora avatar, enters the pet below
                </Text>
              </>
            ) : (
              <Text style={styles.trainerText}>
                Pick your Voxora avatar in the avatar card — your avatar enters the race with your
                pet
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>
            {meet?.meetPhase === 'RACE_RESULT'
              ? `Choose your pet for race ${meet.completedRaces.length + 1}`
              : 'Choose the pet for race 1'}
          </Text>

          <View style={styles.petGrid}>
            {selectablePets.map((pet) => (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                key={pet.petId}
                onPress={() => setPetChoice(pet.petId)}
                style={[styles.petCard, petChoice === pet.petId && styles.petCardSelected]}
              >
                <PetRacerFigure pet={pet} size={52} />
                <Text style={styles.petName}>{pet.displayName}</Text>
                <Text style={styles.petMeta}>{pet.speciesFamily}</Text>
              </Pressable>
            ))}
          </View>

          {petChoice ? <StartingGrid petId={petChoice} pets={pets} status={status} /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: startDisabled() }}
            disabled={startDisabled()}
            onPress={() => void startRace()}
            style={[styles.primaryButton, startDisabled() && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{startLabel()}</Text>
          </Pressable>

          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Tactic cards in the pool</Text>
            {PET_CARD_RACE_TACTIC_DEFINITIONS.map((definition) => (
              <Text key={definition.kind} style={styles.infoText}>
                {definition.title}: {definition.description}
              </Text>
            ))}
          </View>
        </>
      )}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.infoText}>
          Meets used: {status?.attemptsUsedToday ?? 0}/{status?.dailyAttemptLimit ?? 10} · races
          won: {status?.raceWins ?? 0} · best meet score: {status?.bestScore ?? 0} · rank:{' '}
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
        Voxora runs the race: the shuffle, every pet position, the cooldown and the score are
        server-owned. These racers are development placeholders until the Pet Foundation provides
        real pets, and no prizes, currencies, or pet progression are awarded.
      </Text>
    </View>
  );

  function commitDisabled(): boolean {
    return (
      busy ||
      race?.phase !== 'RUNNING' ||
      !summary.valid ||
      cooldownRemainingMs > 0 ||
      (needsTarget && targetCompetitorId === null)
    );
  }

  function startDisabled(): boolean {
    if (busy || petChoice === null) {
      return true;
    }

    return meet?.meetPhase === 'RACE_RESULT' ? false : attemptsRemaining <= 0;
  }

  function startLabel(): string {
    if (busy) {
      return 'Syncing…';
    }

    const chosen = petChoice ? pets.find((pet) => pet.petId === petChoice)?.displayName : null;

    if (meet?.meetPhase === 'RACE_RESULT') {
      const nextRace = meet.completedRaces.length + 1;
      return chosen ? `Race ${nextRace}: line up ${chosen}` : `Choose a pet for race ${nextRace}`;
    }

    if (attemptsRemaining <= 0) {
      return 'Daily meet limit reached';
    }

    return chosen ? `Start the meet with ${chosen}` : 'Choose your pet';
  }

  function toggleCard(card: PetCardRaceCardModel) {
    setSelectedIds((current) =>
      current.includes(card.cardId)
        ? current.filter((id) => id !== card.cardId)
        : [...current, card.cardId],
    );
    setTargetCompetitorId(null);
  }

  async function startRace() {
    if (!petChoice) {
      return;
    }

    await guard(async (token) => {
      const response =
        meet && meet.meetPhase === 'RACE_RESULT'
          ? await apiClient.startNextPetCardRace(token, meet.attemptId, { petId: petChoice })
          : await apiClient.startPetCardRaceMeet(token, { petId: petChoice });

      ingest(response);
      setPetChoice(null);
    });
  }

  async function commitPlay() {
    if (!meet || selectedCards.length === 0) {
      return;
    }

    await guard(async (token) => {
      const response = await apiClient.playPetCardRaceCards(token, meet.attemptId, {
        cardIds: selectedCards.map((card) => card.cardId),
        ...(needsTarget && targetCompetitorId ? { targetCompetitorId } : {}),
      });

      ingest(response);
      setSelectedIds([]);
      setTargetCompetitorId(null);
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

  async function guard(action: (token: string) => Promise<void>) {
    setBusy(true);
    busyRef.current = true;
    setError(null);
    try {
      const token = await secureSessionStore.getAccessToken();
      if (!token) {
        throw new Error('Sign in again to enter the Pet Card Race');
      }

      await action(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pet Card Race request failed');
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
}

/** START → checkpoints → final checkpoint → FINISH, with every racer's place on the course. */
function ProgressRail({
  checkpoints,
  competitors,
  courseMetres,
  progressOf,
}: {
  checkpoints: readonly PetCardRaceCheckpoint[];
  competitors: readonly PetCardRaceCompetitor[];
  courseMetres: number;
  progressOf: (competitorId: string) => number;
}) {
  return (
    <View style={styles.railBlock}>
      <View style={styles.railLabels}>
        <Text style={styles.railLabel}>START</Text>
        <Text style={styles.railLabel}>FINISH</Text>
      </View>
      <View style={styles.rail}>
        {checkpoints.map((checkpoint) => (
          <View
            key={checkpoint.index}
            style={[
              styles.railCheckpoint,
              checkpoint.isFinal && styles.railFinalCheckpoint,
              checkpoint.reached && styles.railCheckpointReached,
              { left: `${checkpoint.atFraction * 100}%` },
            ]}
          />
        ))}
        <View style={styles.railFinish} />
        {competitors.map((competitor) => (
          <View
            key={competitor.competitorId}
            style={[
              styles.railMarker,
              {
                backgroundColor: competitor.pet.palette.accent,
                borderColor: competitor.isYou ? colors.text.primary : 'transparent',
                left: `${progressOf(competitor.competitorId) * 100}%`,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.railLegendRow}>
        {checkpoints.map((checkpoint) => (
          <Text key={checkpoint.index} style={styles.railLegend}>
            {checkpoint.isFinal
              ? `final +${checkpoint.cardsAwarded}`
              : `+${checkpoint.cardsAwarded}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function RaceLane({
  competitor,
  courseMetres,
  obstacles,
  position,
  progressFraction,
  progressMetres,
  running,
}: {
  competitor: PetCardRaceCompetitor;
  courseMetres: number;
  obstacles: readonly PetCardRaceObstacle[];
  position: number;
  progressFraction: number;
  progressMetres: number;
  running: boolean;
}) {
  const laneMud = obstacles.filter((obstacle) => obstacle.affectsYou === competitor.isYou);
  const shielded = competitor.statuses.some((status) => status.kind === 'SHIELDED');
  const slowed = competitor.statuses.some(
    (status) => status.kind === 'WEIGHTS' || status.kind === 'CHASED' || status.kind === 'MUD',
  );
  const boosted = competitor.statuses.some(
    (status) => status.kind === 'SPRINT' || status.kind === 'BOOST',
  );

  return (
    <View style={[styles.lane, competitor.isYou && styles.laneYours]}>
      <View style={styles.laneHeader}>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{position}</Text>
        </View>
        <View style={styles.laneIdentity}>
          <Text style={competitor.isYou ? styles.lanePetYours : styles.lanePet}>
            {competitor.pet.displayName}
          </Text>
          <Text style={styles.laneTrainer}>
            {competitor.isYou
              ? (competitor.trainerAvatarName ?? 'You')
              : competitor.trainerName.replace(' (Voxora house trainer)', '')}
          </Text>
        </View>
        <View style={styles.laneStatuses}>
          {competitor.statuses.slice(0, 2).map((statusEffect, index) => (
            <Text
              key={`${statusEffect.kind}-${index}`}
              style={[
                styles.statusChip,
                statusEffect.kind === 'SHIELDED' && styles.statusShield,
                (statusEffect.kind === 'SPRINT' || statusEffect.kind === 'BOOST') &&
                  styles.statusBoost,
              ]}
            >
              {describePetCardRaceStatus(statusEffect)}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.laneTrack}>
        {laneMud.map((obstacle) => (
          <View
            key={obstacle.obstacleId}
            style={[
              styles.mud,
              {
                left: `${(obstacle.startMetres / courseMetres) * 100}%`,
                width: `${((obstacle.endMetres - obstacle.startMetres) / courseMetres) * 100}%`,
              },
            ]}
          />
        ))}
        <View style={styles.laneFinishLine} />
        <View style={styles.laneRail}>
          <View style={[styles.racerHolder, { left: `${progressFraction * 100}%` }]}>
            {shielded ? <View style={styles.shieldRing} /> : null}
            {boosted ? <View style={styles.speedTrail} /> : null}
            <PetRacerFigure
              pet={competitor.pet}
              size={44}
              gaitPhase={petCardRaceGaitPhase(progressMetres)}
              running={running}
              faded={competitor.finishPosition !== null}
              effort={slowed ? 0.85 : boosted ? 1.25 : 1}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/** The four teams that line up: each Voxora avatar with the pet running for them. */
function StartingGrid({
  petId,
  pets,
  status,
}: {
  petId: PetCardRacePetId;
  pets: readonly PetCardRacePet[];
  status: PetCardRaceStatusResponse | null;
}) {
  const yours = pets.find((pet) => pet.petId === petId);
  const houseNames = ['Vale', 'Orin', 'Sable'];
  const rivals = pets.filter((pet) => pet.petId !== petId);

  return (
    <View style={styles.gridBox}>
      <Text style={styles.sectionTitle}>Starting grid</Text>
      <View style={styles.gridRow}>
        <PetRacerFigure pet={yours ?? pets[0]!} size={40} />
        <View style={styles.gridIdentity}>
          <Text style={styles.gridTrainer}>
            {status?.trainerAvatar?.displayName ?? 'Your avatar'} · you
          </Text>
          <Text style={styles.gridPet}>
            {yours?.displayName} the {yours?.speciesFamily}
          </Text>
        </View>
      </View>
      {rivals.map((pet, index) => (
        <View key={pet.petId} style={styles.gridRow}>
          <PetRacerFigure pet={pet} size={40} />
          <View style={styles.gridIdentity}>
            <Text style={styles.gridTrainer}>
              {houseNames[index] ?? 'House'} · Voxora house trainer
            </Text>
            <Text style={styles.gridPet}>
              {pet.displayName} the {pet.speciesFamily}
            </Text>
          </View>
        </View>
      ))}
      <Text style={styles.infoText}>
        Opening deal follows the pet you enter. Per-pet card tendencies are not defined yet, so
        every pet currently opens on the same neutral mix.
      </Text>
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

function RaceResultPanel({ result }: { result: PetCardRaceRaceResult }) {
  return (
    <View style={styles.resultBox}>
      <Text style={styles.sectionTitle}>
        Race {result.raceNumber}: you finished {formatPetCardRacePosition(result.yourPosition)}
      </Text>
      <Text style={styles.resultText}>
        {result.score} points — {result.breakdown.positionPoints} finish,{' '}
        {result.breakdown.comboPoints} combinations, {result.breakdown.tacticPoints} tactics,{' '}
        {result.breakdown.marginPoints} margin
        {result.photoFinish ? `, ${result.breakdown.photoFinishPoints} photo finish` : ''}
      </Text>
      {result.order.map((entry) => (
        <Text key={entry.competitorId} style={styles.resultText}>
          {formatPetCardRacePosition(entry.position)} {entry.petId.split('-').slice(-1)[0]} ·{' '}
          {entry.isYou ? 'you' : entry.trainerName.replace(' (Voxora house trainer)', '')}
          {entry.crossedLine ? '' : ' (did not finish)'}
        </Text>
      ))}
    </View>
  );
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
  railBlock: { marginTop: spacing.sm },
  railLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  railLabel: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    letterSpacing: 1,
  },
  rail: {
    backgroundColor: '#241844',
    borderRadius: radius.pill,
    height: 14,
    justifyContent: 'center',
    marginTop: spacing.xxs,
    overflow: 'hidden',
  },
  railCheckpoint: {
    backgroundColor: colors.border.strong,
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 2,
  },
  railFinalCheckpoint: {
    backgroundColor: colors.state.warning,
    width: 3,
  },
  railCheckpointReached: {
    backgroundColor: colors.brand.blue,
  },
  railFinish: {
    backgroundColor: colors.brand.pink,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 3,
  },
  railMarker: {
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    marginLeft: -5,
    position: 'absolute',
    width: 10,
  },
  railLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  railLegend: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  arena: {
    backgroundColor: '#170F2C',
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    overflow: 'hidden',
    padding: spacing.sm,
    position: 'relative',
  },
  lane: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radius.sm,
    paddingBottom: spacing.xxs,
  },
  laneYours: {
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
  laneHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
    paddingTop: spacing.xxs,
  },
  positionBadge: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  positionText: {
    color: colors.text.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  laneIdentity: { flexGrow: 1 },
  lanePet: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  lanePetYours: {
    color: colors.brand.blue,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  laneTrainer: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  laneStatuses: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusChip: {
    color: colors.state.warning,
    fontSize: typography.size.xs,
  },
  statusBoost: { color: colors.state.success },
  statusShield: { color: colors.brand.blue },
  laneTrack: {
    height: 46,
    justifyContent: 'center',
    marginTop: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  laneRail: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 56,
    top: 0,
  },
  racerHolder: {
    bottom: 0,
    justifyContent: 'flex-end',
    position: 'absolute',
  },
  shieldRing: {
    borderColor: colors.brand.blue,
    borderRadius: 30,
    borderWidth: 2,
    height: 52,
    left: -4,
    opacity: 0.8,
    position: 'absolute',
    top: -4,
    width: 60,
  },
  speedTrail: {
    backgroundColor: colors.brand.blue,
    borderRadius: 3,
    height: 5,
    left: -22,
    opacity: 0.5,
    position: 'absolute',
    top: 22,
    width: 24,
  },
  mud: {
    backgroundColor: '#7A5A2E',
    borderRadius: 4,
    bottom: 4,
    height: 12,
    opacity: 0.9,
    position: 'absolute',
  },
  laneFinishLine: {
    backgroundColor: colors.brand.pink,
    bottom: 0,
    position: 'absolute',
    right: 12,
    top: 0,
    width: 3,
  },
  countdownOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,6,20,0.72)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  countdownText: {
    color: colors.text.primary,
    fontSize: typography.size.hero,
    fontWeight: typography.weight.bold,
  },
  countdownHint: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
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
    minHeight: 104,
  },
  handCard: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 46,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  fastCard: { borderColor: colors.brand.blue },
  jokerCard: { borderColor: colors.state.focus },
  tacticCard: {
    backgroundColor: '#2A1B44',
    borderColor: colors.brand.purple,
    minWidth: 92,
  },
  handCardSelected: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.text.primary,
    // Selected cards lift out of the row so the intended play is obvious.
    transform: [{ translateY: -6 }],
  },
  handCardLabel: {
    color: colors.text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  handCardTag: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  summaryValid: {
    color: colors.state.success,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.sm,
  },
  summaryInvalid: {
    color: colors.text.secondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.sm,
  },
  summaryDetail: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  targetRow: { marginTop: spacing.sm },
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
  chipSelected: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.text.primary,
  },
  chipText: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  trainerRow: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  trainerBadge: {
    alignItems: 'center',
    backgroundColor: colors.brand.purple,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  trainerInitial: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  trainerText: {
    color: colors.text.secondary,
    flexShrink: 1,
    fontSize: typography.size.xs,
  },
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  petCard: {
    alignItems: 'center',
    backgroundColor: colors.background.soft,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 104,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  petCardSelected: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.text.primary,
  },
  petName: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xxs,
  },
  petMeta: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  gridBox: {
    backgroundColor: '#201735',
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  gridRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  gridIdentity: { flexShrink: 1 },
  gridTrainer: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
  },
  gridPet: {
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
