import type {
    SpecialAdjustmentInput,
    SpecialAdjustmentOutput,
    SpecialAdjustmentStep,
  } from "./types";
  
  function roundedMean(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
  
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }
  
  function addStep(
    steps: SpecialAdjustmentStep[],
    step: string,
    includedValues: number[],
    excludedValues: number[],
    explanation: string
  ) {
    steps.push({
      step,
      includedValues: [...includedValues],
      excludedValues: [...excludedValues],
      currentMean: roundedMean(includedValues),
      explanation,
    });
  }
  
  export function calculateSpecialAdjustment(
    input: SpecialAdjustmentInput
  ): SpecialAdjustmentOutput {
    const sortedWins = [...input.wins].sort((a, b) => b - a);
    const sortedLosses = [...input.losses].sort((a, b) => a - b);
  
    const includedValues: number[] = [];
    const excludedValues: number[] = [];
    const steps: SpecialAdjustmentStep[] = [];
  
    if (sortedWins.length === 0) {
      throw new Error("Special Adjustment requires at least one win.");
    }
  
    // PDF rule: if Special Adjustment player has no losses,
    // use average of two best wins.
    if (sortedLosses.length === 0) {
      const bestTwoWins = sortedWins.slice(0, 2);
  
      if (bestTwoWins.length < 2) {
        throw new Error(
          "No-loss Special Adjustment requires at least two wins."
        );
      }
  
      includedValues.push(...bestTwoWins);
      excludedValues.push(...sortedWins.slice(2));
  
      addStep(
        steps,
        "NO_LOSSES_AVERAGE_TWO_BEST_WINS",
        includedValues,
        excludedValues,
        "Player has no losses, so adjusted rating is the average of the two best wins."
      );
  
      return {
        adjustedRating: roundedMean(includedValues),
        sortedWins,
        sortedLosses,
        includedValues,
        excludedValues,
        steps,
      };
    }
  
    let winIndex = 0;
    let lossIndex = 0;
    let stoppedPairing = false;
  
    while (
      winIndex < sortedWins.length &&
      lossIndex < sortedLosses.length &&
      !stoppedPairing
    ) {
      const win = sortedWins[winIndex];
      const loss = sortedLosses[lossIndex];
  
      const currentMean = roundedMean(includedValues);
  
      // PDF example rule:
      // if loss rating is higher than win rating, exclude that pair and stop.
      if (loss > win) {
        excludedValues.push(win, loss);
  
        addStep(
          steps,
          `PAIR_${winIndex + 1}_STOP_LOSS_HIGHER_THAN_WIN`,
          includedValues,
          excludedValues,
          `Loss ${loss} is higher than win ${win}, so this pair is excluded and pair processing stops.`
        );
  
        winIndex += 1;
        lossIndex += 1;
        stoppedPairing = true;
        break;
      }
  
      // First pair is always included.
      if (includedValues.length === 0) {
        includedValues.push(win, loss);
  
        addStep(
          steps,
          `PAIR_${winIndex + 1}_FIRST_PAIR_INCLUDED`,
          includedValues,
          excludedValues,
          `First pair included: win ${win}, loss ${loss}.`
        );
  
        winIndex += 1;
        lossIndex += 1;
        continue;
      }
  
      // PDF rule:
      // if both ratings are above mean, exclude the loss.
      if (win > currentMean && loss > currentMean) {
        includedValues.push(win);
        excludedValues.push(loss);
  
        addStep(
          steps,
          `PAIR_${winIndex + 1}_LOSS_EXCLUDED`,
          includedValues,
          excludedValues,
          `Both win ${win} and loss ${loss} are above current mean ${currentMean}. Include win, exclude loss, then stop pair processing.`
        );
  
        winIndex += 1;
        lossIndex += 1;
        stoppedPairing = true;
        break;
      }
  
      // PDF rule:
      // if both ratings are below mean, exclude the win.
      if (win < currentMean && loss < currentMean) {
        includedValues.push(loss);
        excludedValues.push(win);
  
        addStep(
          steps,
          `PAIR_${winIndex + 1}_WIN_EXCLUDED`,
          includedValues,
          excludedValues,
          `Both win ${win} and loss ${loss} are below current mean ${currentMean}. Include loss, exclude win, then stop pair processing.`
        );
  
        winIndex += 1;
        lossIndex += 1;
        stoppedPairing = true;
        break;
      }
  
      // Normal case: one above and one below/equal,
      // or equality case. Include both.
      includedValues.push(win, loss);
  
      addStep(
        steps,
        `PAIR_${winIndex + 1}_BOTH_INCLUDED`,
        includedValues,
        excludedValues,
        `Pair included: win ${win}, loss ${loss}.`
      );
  
      winIndex += 1;
      lossIndex += 1;
    }
  
    // TT Arena extension:
    // If wins remain after losses are used,
    // include remaining wins only if they do not lower the mean.
    while (winIndex < sortedWins.length) {
      const win = sortedWins[winIndex];
      const currentMean = roundedMean(includedValues);
  
      if (win >= currentMean) {
        includedValues.push(win);
  
        addStep(
          steps,
          `REMAINING_WIN_${winIndex + 1}_INCLUDED`,
          includedValues,
          excludedValues,
          `Remaining win ${win} is greater than or equal to current mean ${currentMean}, so it is included.`
        );
  
        winIndex += 1;
      } else {
        excludedValues.push(...sortedWins.slice(winIndex));
  
        addStep(
          steps,
          `REMAINING_WIN_${winIndex + 1}_STOP`,
          includedValues,
          excludedValues,
          `Remaining win ${win} is below current mean ${currentMean}, so it and all remaining wins are excluded.`
        );
  
        break;
      }
    }
  
    // TT Arena extension:
    // If losses remain after wins are used,
    // include remaining losses only if they do not raise the mean.
    while (lossIndex < sortedLosses.length) {
      const loss = sortedLosses[lossIndex];
      const currentMean = roundedMean(includedValues);
  
      if (loss <= currentMean) {
        includedValues.push(loss);
  
        addStep(
          steps,
          `REMAINING_LOSS_${lossIndex + 1}_INCLUDED`,
          includedValues,
          excludedValues,
          `Remaining loss ${loss} is less than or equal to current mean ${currentMean}, so it is included.`
        );
  
        lossIndex += 1;
      } else {
        excludedValues.push(...sortedLosses.slice(lossIndex));
  
        addStep(
          steps,
          `REMAINING_LOSS_${lossIndex + 1}_STOP`,
          includedValues,
          excludedValues,
          `Remaining loss ${loss} is above current mean ${currentMean}, so it and all remaining losses are excluded.`
        );
  
        break;
      }
    }
  
    return {
      adjustedRating: roundedMean(includedValues),
      sortedWins,
      sortedLosses,
      includedValues,
      excludedValues,
      steps,
    };
  }