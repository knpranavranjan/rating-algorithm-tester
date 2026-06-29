import { useMemo } from "react";
import { calculateTournamentRatings } from "./tournament-engine";

export function TournamentEngineLab() {
  const tournamentResult = useMemo(() => {
    return calculateTournamentRatings({
      players: [
        {
          id: "P1",
          name: "Arjun",
          rating: 1800,
        },
        {
          id: "P2",
          name: "Meera",
          rating: 1500,
        },
        {
          id: "P3",
          name: "Rahul",
          rating: 1200,
        },
        {
          id: "P4",
          name: "Kavin",
          rating: null,
          estimatedRatingProfile: {
            skillLevel: "INTERMEDIATE",
            clubVerified: true,
            coachVerified: false,
            practiceMatches: 12,
            practiceWins: 9,
            practiceLosses: 3,
          },
        },
        {
          id: "P5",
          name: "Nila",
          rating: null,
          estimatedRatingProfile: {
            skillLevel: "ADVANCED",
            clubVerified: true,
            coachVerified: true,
            practiceMatches: 20,
            practiceWins: 15,
            practiceLosses: 5,
          },
        },
      ],
      matches: [
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
      ],
    });
  }, []);

  return (
    <section style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            5. Full Tournament Rating Engine Tester
          </h2>

          <p style={styles.smallText}>
            This uses 5 test players and 5 matches. Rated players keep their
            current rating as starting rating. Unrated players first receive an
            initial rating, then all match deltas are calculated.
          </p>
        </div>

        <div style={styles.engineBadge}>Engine V1</div>
      </div>

      {tournamentResult.warnings.length > 0 && (
        <div style={styles.warningBox}>
          <h3>Warnings</h3>
          <ul>
            {tournamentResult.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Rated Before</th>
              <th style={styles.th}>Starting</th>
              <th style={styles.th}>Net</th>
              <th style={styles.th}>Final</th>
              <th style={styles.th}>Initial Case</th>
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
                  {player.estimatedRatingUsed ?? "Not used"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.playerGrid}>
        {tournamentResult.players.map((player) => (
          <div key={player.playerId} style={styles.playerCard}>
            <div style={styles.playerTop}>
              <div>
                <h3 style={styles.playerName}>{player.name}</h3>
                <p style={styles.playerSub}>
                  {player.wasRatedBeforeTournament
                    ? "Rated player"
                    : "Unrated player"}
                </p>
              </div>

              <div style={styles.finalRatingBox}>
                <span style={styles.finalRatingLabel}>Final</span>
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

                    <p style={styles.deltaExplanation}>{delta.explanation}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
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
  engineBadge: {
    background: "#020617",
    color: "white",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  warningBox: {
    marginTop: "20px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "18px",
    padding: "18px",
    lineHeight: 1.6,
  },
  tableWrap: {
    marginTop: "22px",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
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
  playerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
    marginTop: "24px",
    alignItems: "start",
  },
  playerCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "18px",
    lineHeight: 1.6,
    minHeight: "260px",
  },
  playerTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  playerName: {
    margin: 0,
    fontSize: "21px",
  },
  playerSub: {
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
  finalRatingLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
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
