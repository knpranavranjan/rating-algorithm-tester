import { calculateMatchDelta } from "./rating-chart";
import { calculateInitialRatingForUnratedPlayer } from "./initial-rating";
import type { EstimatedRatingInput } from "./estimated-rating";

export type TournamentPlayer = {
  id: string;
  name: string;
  rating: number | null;
  estimatedRatingProfile?: EstimatedRatingInput;
};

export type TournamentMatch = {
  id: string;
  playerAId: string;
  playerBId: string;
  winnerId: string;
};

export type TournamentPlayerResult = {
  playerId: string;
  name: string;
  wasRatedBeforeTournament: boolean;
  startingRating: number | null;
  finalRating: number | null;
  netPoints: number;
  winsAgainstRated: number[];
  lossesAgainstRated: number[];
  initialRatingCase?: string;
  initialRatingReason?: string;
  estimatedRatingUsed?: number | null;
  generatedEstimatedRating?: number | null;
  estimateValidationReason?: string;
  matchDeltas: {
    matchId: string;
    opponentId: string;
    opponentName: string;
    opponentRatingUsed: number;
    result: "WIN" | "LOSS";
    points: number;
    explanation: string;
  }[];
};

export type TournamentEngineResult = {
  players: TournamentPlayerResult[];
  warnings: string[];
};

function getPlayerById(players: TournamentPlayer[], playerId: string) {
  const player = players.find((item) => item.id === playerId);

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  return player;
}

function getOpponentId(match: TournamentMatch, playerId: string) {
  if (match.playerAId === playerId) {
    return match.playerBId;
  }

  if (match.playerBId === playerId) {
    return match.playerAId;
  }

  throw new Error(`Player ${playerId} is not part of match ${match.id}`);
}

function didPlayerWin(match: TournamentMatch, playerId: string) {
  return match.winnerId === playerId;
}

export function calculateTournamentRatings({
  players,
  matches,
}: {
  players: TournamentPlayer[];
  matches: TournamentMatch[];
}): TournamentEngineResult {
  const warnings: string[] = [];

  const startingRatings = new Map<string, number | null>();

  for (const player of players) {
    startingRatings.set(player.id, player.rating);
  }

  /**
   * PASS 2 FOUNDATION:
   * Create initial ratings for unrated players using only matches
   * against players who already have ratings.
   */
  for (const player of players) {
    if (player.rating !== null) {
      continue;
    }

    const winsAgainstRated: number[] = [];
    const lossesAgainstRated: number[] = [];

    const playerMatches = matches.filter(
      (match) => match.playerAId === player.id || match.playerBId === player.id
    );

    for (const match of playerMatches) {
      const opponentId = getOpponentId(match, player.id);
      const opponent = getPlayerById(players, opponentId);

      if (opponent.rating === null) {
        continue;
      }

      if (didPlayerWin(match, player.id)) {
        winsAgainstRated.push(opponent.rating);
      } else {
        lossesAgainstRated.push(opponent.rating);
      }
    }

    const initialRating = calculateInitialRatingForUnratedPlayer({
      winsAgainstRated,
      lossesAgainstRated,
      estimatedRating: null,
      estimatedRatingProfile: player.estimatedRatingProfile ?? null,
    });

    if (!initialRating.isValid || initialRating.initialRating === null) {
      warnings.push(
        `${player.name}: Initial rating not calculated. ${initialRating.reason}`
      );

      startingRatings.set(player.id, null);
      continue;
    }

    startingRatings.set(player.id, initialRating.initialRating);
  }

  /**
   * FINAL PASS FOUNDATION:
   * Use starting ratings after initial rating assignment.
   * For now, calculate all match deltas from starting ratings and apply net once.
   */
  const results: TournamentPlayerResult[] = players.map((player) => {
    const startingRating = startingRatings.get(player.id) ?? null;

    const winsAgainstRated: number[] = [];
    const lossesAgainstRated: number[] = [];

    let initialRatingCase: string | undefined;
    let initialRatingReason: string | undefined;
    let estimatedRatingUsed: number | null | undefined;
    let generatedEstimatedRating: number | null | undefined;
    let estimateValidationReason: string | undefined;

    if (player.rating === null) {
      const playerMatches = matches.filter(
        (match) =>
          match.playerAId === player.id || match.playerBId === player.id
      );

      for (const match of playerMatches) {
        const opponentId = getOpponentId(match, player.id);
        const opponent = getPlayerById(players, opponentId);

        if (opponent.rating === null) {
          continue;
        }

        if (didPlayerWin(match, player.id)) {
          winsAgainstRated.push(opponent.rating);
        } else {
          lossesAgainstRated.push(opponent.rating);
        }
      }

      const initialRating = calculateInitialRatingForUnratedPlayer({
        winsAgainstRated,
        lossesAgainstRated,
        estimatedRating: null,
        estimatedRatingProfile: player.estimatedRatingProfile ?? null,
      });

      initialRatingCase = initialRating.caseType;
      initialRatingReason = initialRating.reason;
      estimatedRatingUsed = initialRating.estimatedRatingUsed;
      generatedEstimatedRating =
        initialRating.generatedEstimate?.estimatedRating ?? null;
      estimateValidationReason = initialRating.estimateValidationReason;
    }

    if (startingRating === null) {
      return {
        playerId: player.id,
        name: player.name,
        wasRatedBeforeTournament: player.rating !== null,
        startingRating: null,
        finalRating: null,
        netPoints: 0,
        winsAgainstRated,
        lossesAgainstRated,
        initialRatingCase,
        initialRatingReason,
        estimatedRatingUsed,
        generatedEstimatedRating,
        estimateValidationReason,
        matchDeltas: [],
      };
    }

    let netPoints = 0;

    const matchDeltas: TournamentPlayerResult["matchDeltas"] = [];

    const playerMatches = matches.filter(
      (match) => match.playerAId === player.id || match.playerBId === player.id
    );

    for (const match of playerMatches) {
      const opponentId = getOpponentId(match, player.id);
      const opponent = getPlayerById(players, opponentId);
      const opponentRatingUsed = startingRatings.get(opponent.id) ?? null;

      if (opponentRatingUsed === null) {
        warnings.push(
          `${player.name}: Match ${match.id} skipped because opponent ${opponent.name} has no starting rating.`
        );
        continue;
      }

      const result = didPlayerWin(match, player.id) ? "WIN" : "LOSS";

      const delta = calculateMatchDelta({
        playerRating: startingRating,
        opponentRating: opponentRatingUsed,
        result,
      });

      netPoints += delta.points;

      matchDeltas.push({
        matchId: match.id,
        opponentId: opponent.id,
        opponentName: opponent.name,
        opponentRatingUsed,
        result,
        points: delta.points,
        explanation: delta.explanation,
      });
    }

    const finalRating = Math.max(0, startingRating + netPoints);

    return {
      playerId: player.id,
      name: player.name,
      wasRatedBeforeTournament: player.rating !== null,
      startingRating,
      finalRating,
      netPoints,
      winsAgainstRated,
      lossesAgainstRated,
      initialRatingCase,
      initialRatingReason,
      estimatedRatingUsed,
      generatedEstimatedRating,
      estimateValidationReason,
      matchDeltas,
    };
  });

  return {
    players: results,
    warnings,
  };
}
