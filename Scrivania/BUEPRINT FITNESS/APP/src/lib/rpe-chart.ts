/**
 * A mapping of RPE (Rate of Perceived Exertion) values to their corresponding
 * percentage of 1-Rep Max (1RM). The key is the RPE, and the value is an array
 * where the index represents (reps - 1).
 * For example, rpeChart[10][0] is the percentage for 1 rep at RPE 10 (100%).
 * rpeChart[9][2] is the percentage for 3 reps at RPE 9 (81.4%).
 */
export const rpeChart: Record<number, number[]> = {
  10: [100.0, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.5],
  9.5: [97.8, 93.9, 90.8, 87.9, 85.1, 82.5, 79.9, 77.5, 75.1, 72.8, 70.6, 68.5],
  9: [95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.5, 67.4],
  8.5: [93.3, 90.4, 87.5, 84.8, 82.2, 79.6, 77.2, 74.8, 72.5, 70.3, 68.2, 66.1],
  8: [91.1, 88.5, 85.7, 83.1, 80.6, 78.1, 75.7, 73.4, 71.1, 69.0, 66.9, 64.9],
  7.5: [88.9, 86.5, 83.9, 81.4, 79.0, 76.6, 74.3, 72.0, 69.8, 67.7, 65.6, 63.6],
  7: [86.7, 84.4, 82.0, 79.6, 77.3, 75.0, 72.7, 70.5, 68.4, 66.3, 64.3, 62.4],
  6.5: [84.5, 82.4, 80.1, 77.8, 75.6, 73.4, 71.2, 69.1, 67.0, 65.0, 63.0, 61.1],
  6: [82.3, 80.3, 78.2, 76.1, 73.9, 71.8, 69.7, 67.6, 65.6, 63.6, 61.7, 59.9],
};

/**
 * Estimates the 1-Rep Max (e1RM) based on the weight lifted, reps performed,
 * and the Rate of Perceived Exertion (RPE).
 * @param weight The weight lifted.
 * @param counts The number of repetitions performed.
 * @param rpe The RPE for the set.
 * @returns The estimated 1-Rep Max, or 0 if the inputs are outside the chart's range.
 */
export const estimate1RM = (weight: number, counts: number, rpe: number): number => {
  const rpeRow = rpeChart[rpe];
  if (!rpeRow || counts < 1 || counts > rpeRow.length) {
    return 0; // RPE or reps are out of the chart's range
  }

  const percentage = rpeRow[counts - 1];
  if (!percentage) {
    return 0;
  }

  const e1RM = weight / (percentage / 100);
  return e1RM;
};
