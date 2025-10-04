import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { maxLogsToDomain } from '@/shared/utils/transformations';

export interface PRAlert {
  exerciseId: string;
  exerciseName: string;
  newRecord: {
    weight: number;
    reps: number;
    date: Date;
  };
  previousRecord?: {
    weight: number;
    reps: number;
    date: Date;
  };
  improvement: {
    weightIncrease: number;
    percentageIncrease: number;
  };
  type: 'new_pr' | 'first_pr' | 'rep_pr' | 'volume_pr';
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  achievedDate: Date;
  workoutId?: string;
}

export interface PRHistory {
  exerciseId: string;
  exerciseName: string;
  records: PersonalRecord[];
  totalPRs: number;
  lastPRDate: Date;
}

interface UsePersonalRecordAlertsResult {
  checkForPRs: (workoutData: WorkoutLogModel) => PRAlert[];
  recentPRs: PersonalRecord[];
  prHistory: PRHistory[];
  celebratePR: (prId: string) => void;
}

/**
 * Hook for detecting and celebrating personal records using workout and max log data.
 *
 * Automatically identifies personal records during workout logging and provides
 * celebration functionality. Analyzes completed sets against historical max logs
 * to detect new achievements and motivate users through progress recognition.
 *
 * @param profileId The profile ID to track personal records for
 * @returns Object with PR detection, recent records, and celebration functions
 *
 * @example
 * ```typescript
 * const { checkForPRs, recentPRs, celebratePR } = usePersonalRecordAlerts(profileId);
 *
 * // Check for PRs after workout completion
 * const handleWorkoutComplete = (workout: WorkoutLogModel) => {
 *   const prs = checkForPRs(workout);
 *
 *   prs.forEach(pr => {
 *     showPRNotification(pr);
 *     celebratePR(pr.exerciseId);
 *   });
 * };
 *
 * return (
 *   <Box>
 *     <Typography variant="h6">Recent PRs</Typography>
 *     {recentPRs.map(pr => (
 *       <PRCard key={pr.id} record={pr} />
 *     ))}
 *   </Box>
 * );
 * ```
 */
export function usePersonalRecordAlerts(profileId: string): UsePersonalRecordAlertsResult {
  const maxLogQueryService = container.resolve(MaxLogQueryService);

  // Get all max logs for the profile
  const maxLogsQuery = profileId ? maxLogQueryService.getAllMaxLogs(profileId) : null;
  const { data: allMaxLogs } = useObserveQuery(maxLogsQuery, {
    transform: maxLogsToDomain,
    enabled: !!profileId,
  });

  // Process max logs into structured PR data
  const { recentPRs, prHistory } = useMemo(() => {
    if (!allMaxLogs) {
      return {
        recentPRs: [],
        prHistory: [],
      };
    }

    // Convert max logs to personal records
    const personalRecords: PersonalRecord[] = allMaxLogs.map((maxLog) => ({
      id: maxLog.id,
      exerciseId: maxLog.exerciseId,
      exerciseName: maxLog.exerciseName || `Exercise ${maxLog.exerciseId}`,
      weight: maxLog.weight,
      reps: maxLog.reps,
      achievedDate: maxLog.achievedDate,
      workoutId: maxLog.workoutId,
    }));

    // Get recent PRs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPRs = personalRecords
      .filter((pr) => pr.achievedDate >= thirtyDaysAgo)
      .sort((a, b) => b.achievedDate.getTime() - a.achievedDate.getTime())
      .slice(0, 10); // Latest 10 PRs

    // Group PRs by exercise for history
    const prHistoryMap = new Map<string, PRHistory>();

    personalRecords.forEach((pr) => {
      if (!prHistoryMap.has(pr.exerciseId)) {
        prHistoryMap.set(pr.exerciseId, {
          exerciseId: pr.exerciseId,
          exerciseName: pr.exerciseName,
          records: [],
          totalPRs: 0,
          lastPRDate: pr.achievedDate,
        });
      }

      const history = prHistoryMap.get(pr.exerciseId)!;
      history.records.push(pr);
      history.totalPRs++;

      if (pr.achievedDate > history.lastPRDate) {
        history.lastPRDate = pr.achievedDate;
      }
    });

    // Sort records within each exercise by date
    prHistoryMap.forEach((history) => {
      history.records.sort((a, b) => b.achievedDate.getTime() - a.achievedDate.getTime());
    });

    const prHistory = Array.from(prHistoryMap.values()).sort(
      (a, b) => b.lastPRDate.getTime() - a.lastPRDate.getTime()
    );

    return {
      recentPRs,
      prHistory,
    };
  }, [allMaxLogs]);

  /**
   * Analyzes a completed workout for potential personal records
   */
  const checkForPRs = useCallback(
    (workoutData: WorkoutLogModel): PRAlert[] => {
      if (!allMaxLogs || !workoutData.endTime) {
        return [];
      }

      const prAlerts: PRAlert[] = [];

      // Check each exercise in the workout
      workoutData.getAllExercises().forEach((performedExercise) => {
        const exerciseId = performedExercise.exerciseId;
        const exerciseName = performedExercise.exerciseName;

        // Get existing max logs for this exercise
        const existingMaxLogs = allMaxLogs.filter((ml) => ml.exerciseId === exerciseId);

        // Find the heaviest set performed in this workout
        const completedSets = performedExercise.sets.filter(
          (set) => set.completed && set.weight && set.counts
        );

        if (completedSets.length === 0) return;

        // Check for different types of PRs
        completedSets.forEach((set) => {
          const weight = set.weight!;
          const reps = set.counts;

          // Find best existing record for comparison
          const bestExistingRecord = findBestRecord(existingMaxLogs, reps);

          if (!bestExistingRecord) {
            // First PR for this exercise
            prAlerts.push({
              exerciseId,
              exerciseName,
              newRecord: {
                weight,
                reps,
                date: workoutData.endTime!,
              },
              improvement: {
                weightIncrease: weight,
                percentageIncrease: 100,
              },
              type: 'first_pr',
            });
          } else if (weight > bestExistingRecord.weight) {
            // New weight PR
            const weightIncrease = weight - bestExistingRecord.weight;
            const percentageIncrease = (weightIncrease / bestExistingRecord.weight) * 100;

            prAlerts.push({
              exerciseId,
              exerciseName,
              newRecord: {
                weight,
                reps,
                date: workoutData.endTime!,
              },
              previousRecord: {
                weight: bestExistingRecord.weight,
                reps: bestExistingRecord.reps,
                date: bestExistingRecord.achievedDate,
              },
              improvement: {
                weightIncrease,
                percentageIncrease,
              },
              type: 'new_pr',
            });
          } else if (weight === bestExistingRecord.weight && reps > bestExistingRecord.reps) {
            // Rep PR (same weight, more reps)
            prAlerts.push({
              exerciseId,
              exerciseName,
              newRecord: {
                weight,
                reps,
                date: workoutData.endTime!,
              },
              previousRecord: {
                weight: bestExistingRecord.weight,
                reps: bestExistingRecord.reps,
                date: bestExistingRecord.achievedDate,
              },
              improvement: {
                weightIncrease: 0,
                percentageIncrease:
                  ((reps - bestExistingRecord.reps) / bestExistingRecord.reps) * 100,
              },
              type: 'rep_pr',
            });
          }

          // Check for volume PR (weight × reps) only if we have existing records
          if (existingMaxLogs.length > 0) {
            const currentVolume = weight * reps;
            const bestExistingVolume = existingMaxLogs.reduce((best, record) => {
              const recordVolume = record.weight * record.reps;
              return recordVolume > best ? recordVolume : best;
            }, 0);

            if (currentVolume > bestExistingVolume) {
              prAlerts.push({
                exerciseId,
                exerciseName,
                newRecord: {
                  weight,
                  reps,
                  date: workoutData.endTime!,
                },
                improvement: {
                  weightIncrease: 0,
                  percentageIncrease:
                    ((currentVolume - bestExistingVolume) / bestExistingVolume) * 100,
                },
                type: 'volume_pr',
              });
            }
          }
        });
      });

      // Remove duplicate alerts (keep the best one per exercise)
      const uniqueAlerts = new Map<string, PRAlert>();
      prAlerts.forEach((alert) => {
        const existing = uniqueAlerts.get(alert.exerciseId);
        if (
          !existing ||
          alert.improvement.percentageIncrease > existing.improvement.percentageIncrease
        ) {
          uniqueAlerts.set(alert.exerciseId, alert);
        }
      });

      return Array.from(uniqueAlerts.values());
    },
    [allMaxLogs]
  );

  /**
   * Celebrates a personal record (could trigger UI animations, sounds, etc.)
   */
  const celebratePR = useCallback((prId: string) => {
    // Implementation could include:
    // - Triggering confetti animation
    // - Playing celebration sound
    // - Showing achievement modal
    // - Logging celebration event
    console.log(`🎉 Celebrating PR: ${prId}`);
  }, []);

  return {
    checkForPRs,
    recentPRs,
    prHistory,
    celebratePR,
  };
}

/**
 * Helper function to find the best existing record for a given rep range
 */
function findBestRecord(maxLogs: MaxLogModel[], targetReps: number): MaxLogModel | null {
  if (maxLogs.length === 0) return null;

  // Find records with same or similar rep range
  const sameRepRangeRecords = maxLogs.filter(
    (record) => Math.abs(record.reps - targetReps) <= 2 // Within 2 reps
  );

  if (sameRepRangeRecords.length > 0) {
    // Return the heaviest weight in the same rep range
    return sameRepRangeRecords.reduce((best, current) =>
      current.weight > best.weight ? current : best
    );
  }

  // Fallback to overall best record
  return maxLogs.reduce((best, current) => (current.weight > best.weight ? current : best));
}
