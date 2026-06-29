export type MatchResult = "WIN" | "LOSS";

export type RatingChartResult = {
  ratingDifference: number;
  higherRatedWinsPoints: number;
  lowerRatedWinsPoints: number;
};

export type MatchDeltaInput = {
  playerRating: number;
  opponentRating: number;
  result: MatchResult;
};

export type MatchDeltaOutput = {
  playerRating: number;
  opponentRating: number;
  result: MatchResult;
  ratingDifference: number;
  playerWasHigherRated: boolean;
  points: number;
  explanation: string;
};

export type SpecialAdjustmentInput = {
  wins: number[];
  losses: number[];
};

export type SpecialAdjustmentStep = {
  step: string;
  includedValues: number[];
  excludedValues: number[];
  currentMean: number;
  explanation: string;
};

export type SpecialAdjustmentOutput = {
  adjustedRating: number;
  sortedWins: number[];
  sortedLosses: number[];
  includedValues: number[];
  excludedValues: number[];
  steps: SpecialAdjustmentStep[];
};