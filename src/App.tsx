import { useMemo, useState } from "react";
import { calculateMatchDelta } from "./ratings/rating-chart";
import { calculateSpecialAdjustment } from "./ratings/special-adjustment";
import { calculateInitialRatingForUnratedPlayer } from "./ratings/initial-rating";
import type { EstimatedSkillLevel } from "./ratings/estimated-rating";
import { StandardAdjustmentLab } from "./ratings/StandardAdjustmentLab";
import { TournamentEngineLab } from "./ratings/TournamentEngineLab";
import { CustomTournamentLab } from "./ratings/CustomTournamentLab";

function parseNumberList(value: string): number[] {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export default function App() {
  const [playerRating, setPlayerRating] = useState("850");
  const [opponentRating, setOpponentRating] = useState("1200");
  const [result, setResult] = useState<"WIN" | "LOSS">("WIN");

  const [wins, setWins] = useState("2000,1800,1600,1520");
  const [losses, setLosses] = useState("1000,1200");

  const [initialWins, setInitialWins] = useState("1200,1400");
  const [initialLosses, setInitialLosses] = useState("");
  const [manualEstimatedRating, setManualEstimatedRating] = useState("");

  const [skillLevel, setSkillLevel] =
    useState<EstimatedSkillLevel>("INTERMEDIATE");
  const [clubVerified, setClubVerified] = useState(true);
  const [coachVerified, setCoachVerified] = useState(false);
  const [practiceMatches, setPracticeMatches] = useState("12");
  const [practiceWins, setPracticeWins] = useState("9");
  const [practiceLosses, setPracticeLosses] = useState("3");

  const matchDelta = useMemo(() => {
    return calculateMatchDelta({
      playerRating: Number(playerRating) || 0,
      opponentRating: Number(opponentRating) || 0,
      result,
    });
  }, [playerRating, opponentRating, result]);

  const specialAdjustment = useMemo(() => {
    return calculateSpecialAdjustment({
      wins: parseNumberList(wins),
      losses: parseNumberList(losses),
    });
  }, [wins, losses]);

  const initialRating = useMemo(() => {
    const manualEstimateNumber = Number(manualEstimatedRating);

    return calculateInitialRatingForUnratedPlayer({
      winsAgainstRated: parseNumberList(initialWins),
      lossesAgainstRated: parseNumberList(initialLosses),
      estimatedRating:
        manualEstimatedRating.trim() === "" ||
        !Number.isFinite(manualEstimateNumber)
          ? null
          : manualEstimateNumber,
      estimatedRatingProfile: {
        skillLevel,
        clubVerified,
        coachVerified,
        practiceMatches: Number(practiceMatches) || 0,
        practiceWins: Number(practiceWins) || 0,
        practiceLosses: Number(practiceLosses) || 0,
      },
    });
  }, [
    initialWins,
    initialLosses,
    manualEstimatedRating,
    skillLevel,
    clubVerified,
    coachVerified,
    practiceMatches,
    practiceWins,
    practiceLosses,
  ]);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <p style={styles.label}>TT Arena Rating Engine</p>
        <h1 style={styles.title}>Rating Algorithm Tester</h1>
        <p style={styles.description}>
          Test rating chart points, match deltas, Standard Adjustment, Special
          Adjustment, programmatic Estimated Rating, Initial Rating, and full
          tournament rating flow before integrating into TT Arena.
        </p>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h2>1. Match Delta Tester</h2>

          <label style={styles.field}>
            Player Rating
            <input
              value={playerRating}
              onChange={(event) => setPlayerRating(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            Opponent Rating
            <input
              value={opponentRating}
              onChange={(event) => setOpponentRating(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            Result
            <select
              value={result}
              onChange={(event) =>
                setResult(event.target.value as "WIN" | "LOSS")
              }
              style={styles.input}
            >
              <option value="WIN">WIN</option>
              <option value="LOSS">LOSS</option>
            </select>
          </label>

          <div style={styles.resultBox}>
            <p>
              <strong>Rating Difference:</strong>{" "}
              {matchDelta.ratingDifference}
            </p>
            <p>
              <strong>Player was higher rated:</strong>{" "}
              {matchDelta.playerWasHigherRated ? "Yes" : "No"}
            </p>
            <p>
              <strong>Points:</strong> {matchDelta.points}
            </p>
            <p>{matchDelta.explanation}</p>
          </div>
        </div>

        <div style={styles.card}>
          <h2>2. Special Adjustment Tester</h2>

          <label style={styles.field}>
            Wins
            <input
              value={wins}
              onChange={(event) => setWins(event.target.value)}
              style={styles.input}
              placeholder="Example: 2000,1800,1600"
            />
          </label>

          <label style={styles.field}>
            Losses
            <input
              value={losses}
              onChange={(event) => setLosses(event.target.value)}
              style={styles.input}
              placeholder="Example: 1000,1200"
            />
          </label>

          <div style={styles.resultBox}>
            <p>
              <strong>Adjusted Rating:</strong>{" "}
              {specialAdjustment.adjustedRating}
            </p>
            <p>
              <strong>Sorted Wins:</strong>{" "}
              {specialAdjustment.sortedWins.join(", ") || "None"}
            </p>
            <p>
              <strong>Sorted Losses:</strong>{" "}
              {specialAdjustment.sortedLosses.join(", ") || "None"}
            </p>
            <p>
              <strong>Included:</strong>{" "}
              {specialAdjustment.includedValues.join(", ") || "None"}
            </p>
            <p>
              <strong>Excluded:</strong>{" "}
              {specialAdjustment.excludedValues.join(", ") || "None"}
            </p>
          </div>
        </div>
      </section>

      <StandardAdjustmentLab />

      <section style={styles.card}>
        <h2>4. Programmatic Estimated Rating + Initial Rating Tester</h2>

        <p style={styles.smallText}>
          The system generates estimated rating from player profile data. For
          all-wins and all-losses unrated cases, the estimate is automatically
          validated against rated opponents.
        </p>

        <section style={styles.grid}>
          <label style={styles.field}>
            Wins Against Rated Players
            <input
              value={initialWins}
              onChange={(event) => setInitialWins(event.target.value)}
              style={styles.input}
              placeholder="Example: 1200,1400"
            />
          </label>

          <label style={styles.field}>
            Losses Against Rated Players
            <input
              value={initialLosses}
              onChange={(event) => setInitialLosses(event.target.value)}
              style={styles.input}
              placeholder="Example: 1000,1200"
            />
          </label>
        </section>

        <section style={styles.grid}>
          <label style={styles.field}>
            Skill Level
            <select
              value={skillLevel}
              onChange={(event) =>
                setSkillLevel(event.target.value as EstimatedSkillLevel)
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

          <label style={styles.field}>
            Manual Estimated Rating Override
            <input
              value={manualEstimatedRating}
              onChange={(event) => setManualEstimatedRating(event.target.value)}
              style={styles.input}
              placeholder="Optional. Leave empty for system estimate."
            />
          </label>
        </section>

        <section style={styles.grid}>
          <label style={styles.checkboxField}>
            <input
              type="checkbox"
              checked={clubVerified}
              onChange={(event) => setClubVerified(event.target.checked)}
            />
            Club Verified
          </label>

          <label style={styles.checkboxField}>
            <input
              type="checkbox"
              checked={coachVerified}
              onChange={(event) => setCoachVerified(event.target.checked)}
            />
            Coach Verified
          </label>
        </section>

        <section style={styles.gridThree}>
          <label style={styles.field}>
            Practice Matches
            <input
              value={practiceMatches}
              onChange={(event) => setPracticeMatches(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            Practice Wins
            <input
              value={practiceWins}
              onChange={(event) => setPracticeWins(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            Practice Losses
            <input
              value={practiceLosses}
              onChange={(event) => setPracticeLosses(event.target.value)}
              style={styles.input}
            />
          </label>
        </section>

        <div style={styles.resultBox}>
          <p>
            <strong>Generated Estimated Rating:</strong>{" "}
            {initialRating.generatedEstimate?.estimatedRating ??
              "Manual used / Not generated"}
          </p>

          <p>
            <strong>Estimated Rating Used:</strong>{" "}
            {initialRating.estimatedRatingUsed ?? "Not used"}
          </p>

          <p>
            <strong>Estimate Corrected:</strong>{" "}
            {initialRating.estimateWasCorrected ? "Yes" : "No"}
          </p>

          <p>
            <strong>Estimate Validation:</strong>{" "}
            {initialRating.estimateValidationReason ?? "Not required"}
          </p>

          <p>
            <strong>Initial Rating:</strong>{" "}
            {initialRating.initialRating ?? "Not calculated"}
          </p>

          <p>
            <strong>Valid:</strong> {initialRating.isValid ? "Yes" : "No"}
          </p>

          <p>
            <strong>Case:</strong> {initialRating.caseType}
          </p>

          <p>
            <strong>Best Win:</strong> {initialRating.bestWin ?? "None"}
          </p>

          <p>
            <strong>Worst Loss:</strong> {initialRating.worstLoss ?? "None"}
          </p>

          <p>
            <strong>Special Adjustment Included:</strong>{" "}
            {initialRating.specialAdjustmentIncludedValues?.join(", ") ||
              "Not used"}
          </p>

          <p>{initialRating.reason}</p>
        </div>

        {initialRating.generatedEstimate && (
          <div style={styles.resultBox}>
            <h3>Estimated Rating Breakdown</h3>

            <p>
              <strong>Base Rating:</strong>{" "}
              {initialRating.generatedEstimate.baseRating}
            </p>

            <p>
              <strong>Modifier Points:</strong>{" "}
              {initialRating.generatedEstimate.modifierPoints}
            </p>

            <p>
              <strong>Raw Estimate:</strong>{" "}
              {initialRating.generatedEstimate.rawEstimatedRating}
            </p>

            <p>
              <strong>Win Rate:</strong>{" "}
              {initialRating.generatedEstimate.winRate === null
                ? "No practice results"
                : `${Math.round(
                    initialRating.generatedEstimate.winRate * 100
                  )}%`}
            </p>

            <ul>
              {initialRating.generatedEstimate.breakdown.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <TournamentEngineLab />
      
      <CustomTournamentLab />

      <section style={styles.card}>
        <h2>Special Adjustment Steps</h2>

        <div style={styles.steps}>
          {specialAdjustment.steps.map((step) => (
            <div key={step.step} style={styles.step}>
              <p>
                <strong>{step.step}</strong>
              </p>
              <p>
                <strong>Current Mean:</strong> {step.currentMean}
              </p>
              <p>
                <strong>Included:</strong>{" "}
                {step.includedValues.join(", ") || "None"}
              </p>
              <p>
                <strong>Excluded:</strong>{" "}
                {step.excludedValues.join(", ") || "None"}
              </p>
              <p>{step.explanation}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f8fafc",
    color: "#020617",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    maxWidth: "900px",
    marginBottom: "32px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  title: {
    fontSize: "42px",
    margin: "8px 0",
  },
  description: {
    fontSize: "17px",
    color: "#475569",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.05)",
    marginTop: "24px",
  },
  field: {
    display: "block",
    marginTop: "16px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#334155",
  },
  checkboxField: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
  },
  resultBox: {
    marginTop: "20px",
    background: "#f1f5f9",
    borderRadius: "18px",
    padding: "18px",
    lineHeight: 1.6,
  },
  steps: {
    display: "grid",
    gap: "14px",
    marginTop: "12px",
  },
  step: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    lineHeight: 1.6,
  },
  smallText: {
    color: "#64748b",
    lineHeight: 1.6,
    marginTop: "8px",
  },
};
