import { useMemo, useState } from "react";
import { calculateTournamentRatings } from "./tournament-engine";
import type { EstimatedSkillLevel } from "./estimated-rating";
import type { TournamentMatch, TournamentPlayer } from "./tournament-engine";

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
    playerAId: "P4",
    playerBId: "P3",
    winnerId: "P4",
  },
  {
    id: "M2",
    playerAId: "P4",
    playerBId: "P2",
    winnerId: "P2",
  },
  {
    id: "M3",
    playerAId: "P5",
    playerBId: "P3",
    winnerId: "P5",
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
  const cleaned = value.trim();

  if (cleaned === "") {
    return null;
  }

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function createPlayerId(index: number) {
  return `P${index + 1}`;
}

function createMatchId(index: number) {
  return `M${index + 1}`;
}

export function CustomTournamentLab() {
  const [players, setPlayers] = useState<EditablePlayer[]>(defaultPlayers);
  const [matches, setMatches] = useState<EditableMatch[]>(defaultMatches);

  const playerOptions = players.map((player) => ({
    id: player.id,
    label: `${player.id} - ${player.name || "Unnamed Player"}`,
  }));

  const engineInput = useMemo(() => {
    const preparedPlayers: TournamentPlayer[] = players.map((player) => {
      const rating = ratingOrNull(player.ratingText);

      return {
        id: player.id,
        name: player.name.trim() || player.id,
        rating,
        estimatedRatingProfile: {
          skillLevel: player.skillLevel,
          clubVerified: player.clubVerified,
          coachVerified: player.coachVerified,
          practiceMatches: numberOrZero(player.practiceMatches),
          practiceWins: numberOrZero(player.practiceWins),
          practiceLosses: numberOrZero(player.practiceLosses),
        },
      };
    });

    const preparedMatches: TournamentMatch[] = matches
      .filter((match) => {
        return (
          match.playerAId &&
          match.playerBId &&
          match.winnerId &&
          match.playerAId !== match.playerBId &&
          (match.winnerId === match.playerAId || match.winnerId === match.playerBId)
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

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (players.length < 2) {
      messages.push("At least two players are required.");
    }

    const playerIds = new Set<string>();

    for (const player of players) {
      if (!player.name.trim()) {
        messages.push(`${player.id}: Player name is empty.`);
      }

      if (playerIds.has(player.id)) {
        messages.push(`Duplicate player id found: ${player.id}.`);
      }

      playerIds.add(player.id);
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

  const tournamentResult = useMemo(() => {
    try {
      return calculateTournamentRatings(engineInput);
    } catch (error) {
      return {
        players: [],
        warnings: [
          error instanceof Error
            ? error.message
            : "Unknown tournament engine error.",
        ],
      };
    }
  }, [engineInput]);

  function updatePlayer(
    playerId: string,
    field: keyof EditablePlayer,
    value: string | boolean
  ) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => {
        if (player.id !== playerId) {
          return player;
        }

        return {
          ...player,
          [field]: value,
        };
      })
    );
  }

  function updateMatch(
    matchId: string,
    field: keyof EditableMatch,
    value: string
  ) {
    setMatches((currentMatches) =>
      currentMatches.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        const updatedMatch = {
          ...match,
          [field]: value,
        };

        if (
          field === "playerAId" ||
          field === "playerBId"
        ) {
          if (
            updatedMatch.winnerId !== updatedMatch.playerAId &&
            updatedMatch.winnerId !== updatedMatch.playerBId
          ) {
            updatedMatch.winnerId = updatedMatch.playerAId;
          }
        }

        return updatedMatch;
      })
    );
  }

  function addPlayer() {
    const nextId = createPlayerId(players.length);

    setPlayers((currentPlayers) => [
      ...currentPlayers,
      {
        id: nextId,
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
    setPlayers((currentPlayers) =>
      currentPlayers.filter((player) => player.id !== playerId)
    );

    setMatches((currentMatches) =>
      currentMatches.filter(
        (match) => match.playerAId !== playerId && match.playerBId !== playerId
      )
    );
  }

  function addMatch() {
    if (players.length < 2) {
      return;
    }

    const nextId = createMatchId(matches.length);
    const playerAId = players[0].id;
    const playerBId = players[1].id;

    setMatches((currentMatches) => [
      ...currentMatches,
      {
        id: nextId,
        playerAId,
        playerBId,
        winnerId: playerAId,
      },
    ]);
  }

  function removeMatch(matchId: string) {
    setMatches((currentMatches) =>
      currentMatches.filter((match) => match.id !== matchId)
    );
  }

  function resetSample() {
    setPlayers(defaultPlayers);
    setMatches(defaultMatches);
  }

  return (
    <section style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            6. Custom Tournament Calculation Engine
          </h2>

          <p style={styles.smallText}>
            Enter full tournament details, add players, add matches, select
            winners, and calculate the complete rating result.
          </p>
        </div>

        <div style={styles.actions}>
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
      </div>

      {(validationMessages.length > 0 || tournamentResult.warnings.length > 0) && (
        <div style={styles.warningBox}>
          <h3>Warnings / Validation</h3>
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}

            {tournamentResult.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.subSection}>
        <h3 style={styles.subTitle}>Players</h3>

        <div style={styles.playerEditorGrid}>
          {players.map((player) => (
            <div key={player.id} style={styles.editorCard}>
              <div style={styles.editorCardHeader}>
                <strong>{player.id}</strong>

                <button
                  type="button"
                  style={styles.dangerButton}
                  onClick={() => removePlayer(player.id)}
                  disabled={players.length <= 2}
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
                      updatePlayer(
                        player.id,
                        "clubVerified",
                        event.target.checked
                      )
                    }
                  />
                  Club Verified
                </label>

                <label style={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={player.coachVerified}
                    onChange={(event) =>
                      updatePlayer(
                        player.id,
                        "coachVerified",
                        event.target.checked
                      )
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
                      updatePlayer(
                        player.id,
                        "practiceMatches",
                        event.target.value
                      )
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
                      updatePlayer(
                        player.id,
                        "practiceLosses",
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.subSection}>
        <h3 style={styles.subTitle}>Matches</h3>

        <div style={styles.matchGrid}>
          {matches.map((match) => (
            <div key={match.id} style={styles.editorCard}>
              <div style={styles.editorCardHeader}>
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
      </div>

      <div style={styles.subSection}>
        <h3 style={styles.subTitle}>Complete Calculation Result</h3>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Rated Before</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>Net</th>
                <th style={styles.th}>Final</th>
                <th style={styles.th}>Initial Case</th>
                <th style={styles.th}>Generated Estimate</th>
                <th style={styles.th}>Estimate Used</th>
              </tr>
            </thead>

            <tbody>
              {tournamentResult.players.map((player) => (
                <tr key={player.playerId}>
                  <td style={styles.td}>
                    <strong>{player.name}</strong>
                  </td>

                  <td style={styles.td}>
                    {player.wasRatedBeforeTournament ? "Yes" : "No"}
                  </td>

                  <td style={styles.td}>{player.startingRating ?? "-"}</td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.netBadge,
                        ...(player.netPoints > 0
                          ? styles.netPositive
                          : player.netPoints < 0
                          ? styles.netNegative
                          : styles.netNeutral),
                      }}
                    >
                      {player.netPoints > 0 ? "+" : ""}
                      {player.netPoints}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <strong>{player.finalRating ?? "-"}</strong>
                  </td>

                  <td style={styles.td}>
                    {player.initialRatingCase ?? "Already rated"}
                  </td>

                  <td style={styles.td}>
                    {player.generatedEstimatedRating ?? "Not generated"}
                  </td>

                  <td style={styles.td}>
                    {player.estimatedRatingUsed ?? "Not used"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.resultGrid}>
          {tournamentResult.players.map((player) => (
            <div key={player.playerId} style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div>
                  <h3 style={styles.resultName}>{player.name}</h3>
                  <p style={styles.resultSub}>
                    {player.wasRatedBeforeTournament
                      ? "Rated player"
                      : "Unrated player"}
                  </p>
                </div>

                <div style={styles.finalRatingBox}>
                  <span>Final</span>
                  <strong>{player.finalRating ?? "-"}</strong>
                </div>
              </div>

              <div style={styles.metricGrid}>
                <Metric label="Starting" value={player.startingRating ?? "-"} />
                <Metric
                  label="Net"
                  value={`${player.netPoints > 0 ? "+" : ""}${player.netPoints}`}
                />
                <Metric
                  label="Matches"
                  value={String(player.matchDeltas.length)}
                />
              </div>

              {!player.wasRatedBeforeTournament && (
                <div style={styles.initialBox}>
                  <p>
                    <strong>Initial Case:</strong>{" "}
                    {player.initialRatingCase ?? "None"}
                  </p>

                  <p>
                    <strong>Initial Reason:</strong>{" "}
                    {player.initialRatingReason ?? "None"}
                  </p>

                  <p>
                    <strong>Generated Estimate:</strong>{" "}
                    {player.generatedEstimatedRating ?? "Not generated"}
                  </p>

                  <p>
                    <strong>Estimate Used:</strong>{" "}
                    {player.estimatedRatingUsed ?? "Not used"}
                  </p>

                  <p>
                    <strong>Validation:</strong>{" "}
                    {player.estimateValidationReason ?? "Not required"}
                  </p>
                </div>
              )}

              <details style={styles.details}>
                <summary style={styles.summary}>View Match Deltas</summary>

                <div style={styles.deltaList}>
                  {player.matchDeltas.length === 0 && (
                    <p style={styles.emptyText}>No match deltas.</p>
                  )}

                  {player.matchDeltas.map((delta) => (
                    <div key={delta.matchId} style={styles.deltaCard}>
                      <div style={styles.deltaTop}>
                        <strong>
                          {delta.matchId} vs {delta.opponentName}
                        </strong>

                        <span
                          style={{
                            ...styles.netBadge,
                            ...(delta.points > 0
                              ? styles.netPositive
                              : delta.points < 0
                              ? styles.netNegative
                              : styles.netNeutral),
                          }}
                        >
                          {delta.points > 0 ? "+" : ""}
                          {delta.points}
                        </span>
                      </div>

                      <p>
                        <strong>Opponent Rating:</strong>{" "}
                        {delta.opponentRatingUsed}
                      </p>

                      <p>
                        <strong>Result:</strong> {delta.result}
                      </p>

                      <p style={styles.deltaExplanation}>
                        {delta.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
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

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.05)",
    marginTop: "24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "26px",
  },
  smallText: {
    color: "#64748b",
    lineHeight: 1.6,
    marginTop: "8px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  primaryButton: {
    border: "0",
    borderRadius: "999px",
    background: "#020617",
    color: "white",
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    background: "white",
    color: "#020617",
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "999px",
    background: "#fff1f2",
    color: "#991b1b",
    padding: "7px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },
  warningBox: {
    marginTop: "20px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "18px",
    padding: "18px",
    lineHeight: 1.6,
  },
  subSection: {
    marginTop: "28px",
  },
  subTitle: {
    margin: "0 0 14px",
    fontSize: "22px",
  },
  playerEditorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "18px",
  },
  matchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  editorCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
  },
  editorCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  field: {
    display: "block",
    marginTop: "16px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    marginTop: "8px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "15px",
    background: "white",
  },
  checkboxRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  checkboxField: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#334155",
  },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  tableWrap: {
    marginTop: "18px",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },
  th: {
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    padding: "14px",
    textAlign: "left",
    fontSize: "13px",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "14px",
    fontSize: "14px",
    verticalAlign: "top",
  },
  netBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "52px",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "13px",
    fontWeight: 800,
  },
  netPositive: {
    background: "#dcfce7",
    color: "#166534",
  },
  netNegative: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  netNeutral: {
    background: "#e2e8f0",
    color: "#334155",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginTop: "20px",
    alignItems: "start",
  },
  resultCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "18px",
    lineHeight: 1.6,
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  resultName: {
    margin: 0,
    fontSize: "21px",
  },
  resultSub: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  finalRatingBox: {
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
  initialBox: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    marginTop: "16px",
    fontSize: "14px",
  },
  details: {
    marginTop: "16px",
  },
  summary: {
    cursor: "pointer",
    fontWeight: 800,
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
    fontSize: "14px",
  },
  deltaTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  deltaExplanation: {
    color: "#475569",
  },
  emptyText: {
    color: "#64748b",
  },
};
