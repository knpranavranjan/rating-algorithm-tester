import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  calculateFullTournamentRating,
  type FullEngineMatchInput,
  type FullEnginePlayerInput,
} from "./ratings/full-rating-engine";
import type { EstimatedSkillLevel } from "./ratings/estimated-rating";

type EditablePlayer = {
  id: string;
  name: string;
  ratingText: string;
  skillLevel: EstimatedSkillLevel;
  clubVerified: boolean;
  coachVerified: boolean;
  practiceMatches: string;
  practiceWins: string;
  practiceLosses: string;
};

type EditableMatch = {
  id: string;
  playerAId: string;
  playerBId: string;
  winnerId: string;
};

const defaultPlayers: EditablePlayer[] = [
  {
    id: "P1",
    name: "Arjun",
    ratingText: "1800",
    skillLevel: "ADVANCED",
    clubVerified: true,
    coachVerified: true,
    practiceMatches: "30",
    practiceWins: "22",
    practiceLosses: "8",
  },
  {
    id: "P2",
    name: "Meera",
    ratingText: "1500",
    skillLevel: "ADVANCED",
    clubVerified: true,
    coachVerified: true,
    practiceMatches: "25",
    practiceWins: "17",
    practiceLosses: "8",
  },
  {
    id: "P3",
    name: "Rahul",
    ratingText: "1200",
    skillLevel: "INTERMEDIATE",
    clubVerified: true,
    coachVerified: false,
    practiceMatches: "15",
    practiceWins: "8",
    practiceLosses: "7",
  },
  {
    id: "P4",
    name: "Kavin",
    ratingText: "",
    skillLevel: "INTERMEDIATE",
    clubVerified: true,
    coachVerified: false,
    practiceMatches: "12",
    practiceWins: "9",
    practiceLosses: "3",
  },
  {
    id: "P5",
    name: "Nila",
    ratingText: "",
    skillLevel: "ADVANCED",
    clubVerified: true,
    coachVerified: true,
    practiceMatches: "20",
    practiceWins: "15",
    practiceLosses: "5",
  },
];

const defaultMatches: EditableMatch[] = [
  {
    id: "M1",
    playerAId: "P1",
    playerBId: "P3",
    winnerId: "P1",
  },
  {
    id: "M2",
    playerAId: "P1",
    playerBId: "P2",
    winnerId: "P2",
  },
  {
    id: "M3",
    playerAId: "P1",
    playerBId: "P3",
    winnerId: "P1",
  },
  {
    id: "M4",
    playerAId: "P5",
    playerBId: "P2",
    winnerId: "P5",
  },
  {
    id: "M5",
    playerAId: "P5",
    playerBId: "P1",
    winnerId: "P1",
  },
];

function numberOrZero(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratingOrNull(value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function nextPlayerId(players: EditablePlayer[]) {
  return `P${players.length + 1}`;
}

function nextMatchId(matches: EditableMatch[]) {
  return `M${matches.length + 1}`;
}

function formatMeanValue(value: number | null) {
  if (value === null) {
    return "Not applicable";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function App() {
  const [players, setPlayers] = useState<EditablePlayer[]>(defaultPlayers);
  const [matches, setMatches] = useState<EditableMatch[]>(defaultMatches);

  const playerOptions = players.map((player) => ({
    id: player.id,
    label: `${player.id} - ${player.name || "Unnamed"}`,
  }));

  const engineInput = useMemo(() => {
    const preparedPlayers: FullEnginePlayerInput[] = players.map((player) => ({
      id: player.id,
      name: player.name.trim() || player.id,
      rating: ratingOrNull(player.ratingText),
      estimatedRatingProfile: {
        skillLevel: player.skillLevel,
        clubVerified: player.clubVerified,
        coachVerified: player.coachVerified,
        practiceMatches: numberOrZero(player.practiceMatches),
        practiceWins: numberOrZero(player.practiceWins),
        practiceLosses: numberOrZero(player.practiceLosses),
      },
    }));

    const preparedMatches: FullEngineMatchInput[] = matches
      .filter((match) => {
        return (
          match.playerAId &&
          match.playerBId &&
          match.winnerId &&
          match.playerAId !== match.playerBId &&
          (match.winnerId === match.playerAId ||
            match.winnerId === match.playerBId)
        );
      })
      .map((match) => ({
        id: match.id,
        playerAId: match.playerAId,
        playerBId: match.playerBId,
        winnerId: match.winnerId,
      }));

    return {
      players: preparedPlayers,
      matches: preparedMatches,
    };
  }, [players, matches]);

  const calculation = useMemo(() => {
    return calculateFullTournamentRating(engineInput);
  }, [engineInput]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (players.length < 2) {
      messages.push("At least two players are required.");
    }

    for (const player of players) {
      if (!player.name.trim()) {
        messages.push(`${player.id}: Player name is empty.`);
      }
    }

    for (const match of matches) {
      if (match.playerAId === match.playerBId) {
        messages.push(`${match.id}: Player A and Player B cannot be same.`);
      }

      if (match.winnerId !== match.playerAId && match.winnerId !== match.playerBId) {
        messages.push(`${match.id}: Winner must be either Player A or Player B.`);
      }
    }

    return messages;
  }, [players, matches]);

  function updatePlayer(
    playerId: string,
    field: keyof EditablePlayer,
    value: string | boolean
  ) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === playerId ? { ...player, [field]: value } : player
      )
    );
  }

  function updateMatch(
    matchId: string,
    field: keyof EditableMatch,
    value: string
  ) {
    setMatches((current) =>
      current.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        const updated = {
          ...match,
          [field]: value,
        };

        if (field === "playerAId" || field === "playerBId") {
          if (
            updated.winnerId !== updated.playerAId &&
            updated.winnerId !== updated.playerBId
          ) {
            updated.winnerId = updated.playerAId;
          }
        }

        return updated;
      })
    );
  }

  function addPlayer() {
    const id = nextPlayerId(players);

    setPlayers((current) => [
      ...current,
      {
        id,
        name: `Player ${players.length + 1}`,
        ratingText: "",
        skillLevel: "BEGINNER",
        clubVerified: false,
        coachVerified: false,
        practiceMatches: "0",
        practiceWins: "0",
        practiceLosses: "0",
      },
    ]);
  }

  function removePlayer(playerId: string) {
    setPlayers((current) => current.filter((player) => player.id !== playerId));
    setMatches((current) =>
      current.filter(
        (match) => match.playerAId !== playerId && match.playerBId !== playerId
      )
    );
  }

  function addMatch() {
    if (players.length < 2) {
      return;
    }

    const id = nextMatchId(matches);

    setMatches((current) => [
      ...current,
      {
        id,
        playerAId: players[0].id,
        playerBId: players[1].id,
        winnerId: players[0].id,
      },
    ]);
  }

  function removeMatch(matchId: string) {
    setMatches((current) => current.filter((match) => match.id !== matchId));
  }

  function resetSample() {
    setPlayers(defaultPlayers);
    setMatches(defaultMatches);
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.label}>TT Arena Rating Engine</p>
          <h1 style={styles.title}>Complete Tournament Rating Calculator</h1>
          <p style={styles.description}>
            Enter players, schedule matches, select winners, and view the full
            rating calculation from Pass 1 to Final Pass.
          </p>
        </div>

        <div style={styles.heroActions}>
          <button type="button" style={styles.secondaryButton} onClick={resetSample}>
            Reset Sample
          </button>
          <button type="button" style={styles.primaryButton} onClick={addPlayer}>
            Add Player
          </button>
          <button type="button" style={styles.primaryButton} onClick={addMatch}>
            Add Match
          </button>
        </div>
      </section>

      {(validationMessages.length > 0 || calculation.warnings.length > 0) && (
        <section style={styles.warningBox}>
          <h2>Warnings</h2>
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
            {calculation.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section style={styles.card}>
        <h2>1. Player Manual Setup</h2>

        <div style={styles.playerGrid}>
          {players.map((player) => (
            <div key={player.id} style={styles.editorCard}>
              <div style={styles.cardHeader}>
                <strong>{player.id}</strong>
                <button
                  type="button"
                  style={styles.dangerButton}
                  disabled={players.length <= 2}
                  onClick={() => removePlayer(player.id)}
                >
                  Remove
                </button>
              </div>

              <label style={styles.field}>
                Player Name
                <input
                  value={player.name}
                  onChange={(event) =>
                    updatePlayer(player.id, "name", event.target.value)
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                Current Rating
                <input
                  value={player.ratingText}
                  onChange={(event) =>
                    updatePlayer(player.id, "ratingText", event.target.value)
                  }
                  style={styles.input}
                  placeholder="Leave empty for unrated"
                />
              </label>

              <label style={styles.field}>
                Skill Level
                <select
                  value={player.skillLevel}
                  onChange={(event) =>
                    updatePlayer(
                      player.id,
                      "skillLevel",
                      event.target.value as EstimatedSkillLevel
                    )
                  }
                  style={styles.input}
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                  <option value="PRO">PRO</option>
                  <option value="ELITE">ELITE</option>
                </select>
              </label>

              <div style={styles.checkboxRow}>
                <label style={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={player.clubVerified}
                    onChange={(event) =>
                      updatePlayer(player.id, "clubVerified", event.target.checked)
                    }
                  />
                  Club Verified
                </label>

                <label style={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={player.coachVerified}
                    onChange={(event) =>
                      updatePlayer(player.id, "coachVerified", event.target.checked)
                    }
                  />
                  Coach Verified
                </label>
              </div>

              <div style={styles.gridThree}>
                <label style={styles.field}>
                  Practice Matches
                  <input
                    value={player.practiceMatches}
                    onChange={(event) =>
                      updatePlayer(player.id, "practiceMatches", event.target.value)
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.field}>
                  Wins
                  <input
                    value={player.practiceWins}
                    onChange={(event) =>
                      updatePlayer(player.id, "practiceWins", event.target.value)
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.field}>
                  Losses
                  <input
                    value={player.practiceLosses}
                    onChange={(event) =>
                      updatePlayer(player.id, "practiceLosses", event.target.value)
                    }
                    style={styles.input}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2>2. Manual Match Schedule</h2>

        <div style={styles.matchGrid}>
          {matches.map((match) => (
            <div key={match.id} style={styles.editorCard}>
              <div style={styles.cardHeader}>
                <strong>{match.id}</strong>
                <button
                  type="button"
                  style={styles.dangerButton}
                  onClick={() => removeMatch(match.id)}
                >
                  Remove
                </button>
              </div>

              <label style={styles.field}>
                Player A
                <select
                  value={match.playerAId}
                  onChange={(event) =>
                    updateMatch(match.id, "playerAId", event.target.value)
                  }
                  style={styles.input}
                >
                  {playerOptions.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                Player B
                <select
                  value={match.playerBId}
                  onChange={(event) =>
                    updateMatch(match.id, "playerBId", event.target.value)
                  }
                  style={styles.input}
                >
                  {playerOptions.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                Winner
                <select
                  value={match.winnerId}
                  onChange={(event) =>
                    updateMatch(match.id, "winnerId", event.target.value)
                  }
                  style={styles.input}
                >
                  {[match.playerAId, match.playerBId].map((playerId) => {
                    const player = players.find((item) => item.id === playerId);
                    return (
                      <option key={playerId} value={playerId}>
                        {player?.name || playerId}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2>3. Pass 1: Net Gain Calculation for Rated Players</h2>

        <p style={styles.helpText}>
          Pass 1 uses only matches between already-rated players. Unrated
          players are ignored in this pass.
        </p>

        <div style={styles.resultGrid}>
          {calculation.players.map((player) => (
            <div key={player.playerId} style={styles.resultCard}>
              <h3>{player.name}</h3>

              <p>
                <strong>Rated Before:</strong>{" "}
                {player.wasRatedBeforeTournament ? "Yes" : "No"}
              </p>

              <p>
                <strong>Pre-rating:</strong>{" "}
                {player.preTournamentRating ?? "Unrated"}
              </p>

              <p>
                <strong>Pass 1 Net:</strong> {player.passOne.netPoints}
              </p>

              <p>
                <strong>20+ Wins:</strong>{" "}
                {player.passOne.twentyPointWinsCount}
              </p>

              <p>
                <strong>50-point Wins:</strong>{" "}
                {player.passOne.fiftyPointWinsCount}
              </p>

              <details>
                <summary style={styles.summary}>View Pass 1 Match Deltas</summary>
                <div style={styles.deltaList}>
                  {player.passOne.matchDeltas.length === 0 && (
                    <p style={styles.helpText}>No eligible Pass 1 matches.</p>
                  )}

                  {player.passOne.matchDeltas.map((delta) => (
                    <DeltaCard key={delta.matchId} delta={delta} />
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2>4. Standard Adjustment Check</h2>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Pre-rating</th>
                <th style={styles.th}>Net Gain</th>
                <th style={styles.th}>20+ Wins</th>
                <th style={styles.th}>Qualifies</th>
                <th style={styles.th}>Standard Adjusted Rating</th>
                <th style={styles.th}>Reason</th>
              </tr>
            </thead>

            <tbody>
              {calculation.players.map((player) => (
                <tr key={player.playerId}>
                  <td style={styles.td}>
                    <strong>{player.name}</strong>
                  </td>
                  <td style={styles.td}>
                    {player.preTournamentRating ?? "Unrated"}
                  </td>
                  <td style={styles.td}>{player.passOne.netPoints}</td>
                  <td style={styles.td}>
                    {player.passOne.twentyPointWinsCount}
                  </td>
                  <td style={styles.td}>
                    {player.standardAdjustment.qualifies ? "Yes" : "No"}
                  </td>
                  <td style={styles.td}>
                    {player.standardAdjustment.adjustedRating || "-"}
                  </td>
                  <td style={styles.td}>{player.standardAdjustment.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.card}>
        <h2>5. Adjusted Rating Calculation for Every Rated Player</h2>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Pre-rating</th>
                <th style={styles.th}>Standard Applies</th>
                <th style={styles.th}>Special Applies</th>
                <th style={styles.th}>Adjusted Rating After Pass 1</th>
              </tr>
            </thead>

            <tbody>
              {calculation.players.map((player) => (
                <tr key={player.playerId}>
                  <td style={styles.td}>
                    <strong>{player.name}</strong>
                  </td>
                  <td style={styles.td}>
                    {player.preTournamentRating ?? "Unrated"}
                  </td>
                  <td style={styles.td}>
                    {player.standardAdjustment.qualifies ? "Yes" : "No"}
                  </td>
                  <td style={styles.td}>
                    {player.specialAdjustment.applies ? "Yes" : "No"}
                  </td>
                  <td style={styles.td}>
                    {player.adjustedRatingAfterPassOne ?? "Not applicable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.card}>
        <h2>6. Special Adjustment Calculation</h2>

        <div style={styles.resultGrid}>
          {calculation.players.map((player) => (
            <div key={player.playerId} style={styles.resultCard}>
              <h3>{player.name}</h3>

              <p>
                <strong>Special Adjustment:</strong>{" "}
                {player.specialAdjustment.applies ? "Applicable" : "Not applicable"}
              </p>

              {player.specialAdjustment.triggerReasons.length > 0 && (
                <>
                  <p>
                    <strong>Triggers:</strong>
                  </p>
                  <ul>
                    {player.specialAdjustment.triggerReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </>
              )}

              {player.specialAdjustment.applies && (
                <>
                  <p>
                    <strong>Special Adjusted Rating:</strong>{" "}
                    {player.specialAdjustment.adjustedRating}
                  </p>

                  <p>
                    <strong>Included:</strong>{" "}
                    {player.specialAdjustment.includedValues.join(", ") || "-"}
                  </p>

                  <p>
                    <strong>Excluded:</strong>{" "}
                    {player.specialAdjustment.excludedValues.join(", ") || "-"}
                  </p>

                  <details>
                    <summary style={styles.summary}>View Special Steps</summary>
                    <div style={styles.deltaList}>
                      {player.specialAdjustment.steps.map((step) => (
                        <div key={step.step} style={styles.deltaCard}>
                          <p>
                            <strong>{step.step}</strong>
                          </p>
                          <p>
                            <strong>Current Mean:</strong>{" "}
                            {formatMeanValue(step.currentMean)}
                          </p>
                          <p>
                            <strong>Comparison Mean:</strong>{" "}
                            {formatMeanValue(step.comparisonMean)}
                          </p>
                          <p>
                            <strong>Included:</strong>{" "}
                            {step.includedValues.join(", ") || "-"}
                          </p>
                          <p>
                            <strong>Excluded:</strong>{" "}
                            {step.excludedValues.join(", ") || "-"}
                          </p>
                          <p>{step.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2>7. Pass 2: Unrated Players Estimated + Initial Rating</h2>

        <p style={styles.helpText}>
          Unrated players get an initial rating only from their matches against
          rated/adjusted players. Initial rating is protected with minimum 200.
        </p>

        <div style={styles.resultGrid}>
          {calculation.players.map((player) => (
            <div key={player.playerId} style={styles.resultCard}>
              <h3>{player.name}</h3>

              <p>
                <strong>Pass 2 Applicable:</strong>{" "}
                {player.passTwo.applicable ? "Yes" : "No"}
              </p>

              <p>
                <strong>Case:</strong> {player.passTwo.caseType}
              </p>

              <p>
                <strong>Wins Against Rated:</strong>{" "}
                {player.passTwo.winsAgainstRated.join(", ") || "-"}
              </p>

              <p>
                <strong>Losses Against Rated:</strong>{" "}
                {player.passTwo.lossesAgainstRated.join(", ") || "-"}
              </p>

              <p>
                <strong>Generated Estimate:</strong>{" "}
                {player.passTwo.generatedEstimatedRating ?? "Not generated"}
              </p>

              <p>
                <strong>Estimate Used:</strong>{" "}
                {player.passTwo.estimatedRatingUsed ?? "Not used"}
              </p>

              <p>
                <strong>Estimate Corrected:</strong>{" "}
                {player.passTwo.estimateWasCorrected ? "Yes" : "No"}
              </p>

              <p>
                <strong>Initial Rating:</strong>{" "}
                {player.passTwo.initialRating ?? "Not calculated"}
              </p>

              {player.passTwo.specialAdjustmentIncludedValues.length > 0 && (
                <p>
                  <strong>Special Included:</strong>{" "}
                  {player.passTwo.specialAdjustmentIncludedValues.join(", ")}
                </p>
              )}

              {player.passTwo.specialAdjustmentExcludedValues.length > 0 && (
                <p>
                  <strong>Special Excluded:</strong>{" "}
                  {player.passTwo.specialAdjustmentExcludedValues.join(", ")}
                </p>
              )}

              <p>{player.passTwo.reason}</p>

              {player.passTwo.specialAdjustmentSteps.length > 0 && (
                <details>
                  <summary style={styles.summary}>
                    View Initial Rating Special Adjustment Steps
                  </summary>

                  <div style={styles.deltaList}>
                    {player.passTwo.specialAdjustmentSteps.map((step) => (
                      <div key={step.step} style={styles.deltaCard}>
                        <p>
                          <strong>{step.step}</strong>
                        </p>

                        <p>
                          <strong>Current Mean:</strong>{" "}
                          {formatMeanValue(step.currentMean)}
                        </p>

                        <p>
                          <strong>Comparison Mean:</strong>{" "}
                          {formatMeanValue(step.comparisonMean)}
                        </p>

                        <p>
                          <strong>Included:</strong>{" "}
                          {step.includedValues.join(", ") || "-"}
                        </p>

                        <p>
                          <strong>Excluded:</strong>{" "}
                          {step.excludedValues.join(", ") || "-"}
                        </p>

                        <p>{step.explanation}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2>8. Final Pass: Complete Calculation Logic</h2>

        <p style={styles.helpText}>
          Final Pass uses the adjusted rating for rated players and initial
          rating for unrated players. All valid matches are then calculated.
          Low-rating protection is applied if a player starts below 100.
        </p>

        <div style={styles.resultGrid}>
          {calculation.players.map((player) => (
            <div key={player.playerId} style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div>
                  <h3>{player.name}</h3>
                  <p style={styles.helpText}>
                    {player.wasRatedBeforeTournament
                      ? "Rated player"
                      : "Unrated player"}
                  </p>
                </div>

                <div style={styles.finalBox}>
                  <span>Final</span>
                  <strong>{player.finalRating ?? "-"}</strong>
                </div>
              </div>

              <div style={styles.metricGrid}>
                <Metric
                  label="Starting"
                  value={player.startingRatingForFinalPass ?? "-"}
                />
                <Metric label="Net" value={player.finalPassNetPoints} />
                <Metric
                  label="Matches"
                  value={player.finalPassDeltas.length}
                />
              </div>

              <details>
                <summary style={styles.summary}>View Final Pass Deltas</summary>
                <div style={styles.deltaList}>
                  {player.finalPassDeltas.length === 0 && (
                    <p style={styles.helpText}>No final pass match deltas.</p>
                  )}

                  {player.finalPassDeltas.map((delta) => (
                    <DeltaCard key={delta.matchId} delta={delta} />
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2>9. Final Result Summary</h2>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Pre-rating</th>
                <th style={styles.th}>Adjusted / Initial Start</th>
                <th style={styles.th}>Final Pass Net</th>
                <th style={styles.th}>Final Rating</th>
                <th style={styles.th}>Pass 2 Case</th>
              </tr>
            </thead>

            <tbody>
              {calculation.players.map((player) => (
                <tr key={player.playerId}>
                  <td style={styles.td}>
                    <strong>{player.name}</strong>
                  </td>
                  <td style={styles.td}>
                    {player.preTournamentRating ?? "Unrated"}
                  </td>
                  <td style={styles.td}>
                    {player.startingRatingForFinalPass ?? "-"}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(player.finalPassNetPoints > 0
                          ? styles.good
                          : player.finalPassNetPoints < 0
                          ? styles.bad
                          : styles.neutral),
                      }}
                    >
                      {player.finalPassNetPoints > 0 ? "+" : ""}
                      {player.finalPassNetPoints}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <strong>{player.finalRating ?? "-"}</strong>
                  </td>
                  <td style={styles.td}>{player.passTwo.caseType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.notes}>
          <h3>Calculation Notes</h3>
          <ul>
            {calculation.calculationNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.metricBox}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DeltaCard({
  delta,
}: {
  delta: {
    matchId: string;
    opponentName: string;
    playerRatingUsed: number;
    opponentRatingUsed: number;
    result: "WIN" | "LOSS";
    points: number;
    originalPoints: number;
    explanation: string;
    lowRatingProtectionApplied: boolean;
  };
}) {
  return (
    <div style={styles.deltaCard}>
      <div style={styles.deltaTop}>
        <strong>
          {delta.matchId} vs {delta.opponentName}
        </strong>

        <span
          style={{
            ...styles.badge,
            ...(delta.points > 0
              ? styles.good
              : delta.points < 0
              ? styles.bad
              : styles.neutral),
          }}
        >
          {delta.points > 0 ? "+" : ""}
          {delta.points}
        </span>
      </div>

      <p>
        <strong>Player rating used:</strong> {delta.playerRatingUsed}
      </p>

      <p>
        <strong>Opponent rating used:</strong> {delta.opponentRatingUsed}
      </p>

      <p>
        <strong>Result:</strong> {delta.result}
      </p>

      <p>{delta.explanation}</p>

      {delta.lowRatingProtectionApplied && (
        <p style={styles.protectionText}>
          Low-rating protection changed original points from{" "}
          {delta.originalPoints} to {delta.points}.
        </p>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f8fafc",
    color: "#020617",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
  },
  heroActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  label: {
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  title: {
    fontSize: "44px",
    margin: "8px 0",
  },
  description: {
    fontSize: "17px",
    color: "#475569",
    lineHeight: 1.6,
    maxWidth: "900px",
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.05)",
    marginTop: "24px",
  },
  warningBox: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "20px",
    padding: "20px",
    lineHeight: 1.6,
  },
  primaryButton: {
    border: "0",
    borderRadius: "999px",
    background: "#020617",
    color: "white",
    padding: "10px 15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    background: "white",
    color: "#020617",
    padding: "10px 15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "999px",
    background: "#fff1f2",
    color: "#991b1b",
    padding: "7px 11px",
    fontWeight: 800,
    cursor: "pointer",
  },
  playerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "18px",
  },
  matchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    alignItems: "start",
  },
  editorCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
  },
  resultCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    lineHeight: 1.6,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  field: {
    display: "block",
    marginTop: "14px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    marginTop: "8px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "15px",
    background: "white",
  },
  checkboxRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },
  checkboxField: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
  },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  helpText: {
    color: "#64748b",
    lineHeight: 1.6,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    marginTop: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "950px",
  },
  th: {
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    padding: "14px",
    textAlign: "left",
    fontSize: "12px",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "14px",
    verticalAlign: "top",
    fontSize: "14px",
  },
  summary: {
    cursor: "pointer",
    fontWeight: 800,
    marginTop: "12px",
  },
  deltaList: {
    display: "grid",
    gap: "12px",
    marginTop: "12px",
  },
  deltaCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
  },
  deltaTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "52px",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "13px",
    fontWeight: 900,
  },
  good: {
    background: "#dcfce7",
    color: "#166534",
  },
  bad: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  neutral: {
    background: "#e2e8f0",
    color: "#334155",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
  },
  finalBox: {
    minWidth: "78px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "10px",
    textAlign: "center",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "16px",
  },
  metricBox: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "10px",
  },
  protectionText: {
    color: "#991b1b",
    fontWeight: 700,
  },
  notes: {
    marginTop: "20px",
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "18px",
    lineHeight: 1.7,
  },
};
