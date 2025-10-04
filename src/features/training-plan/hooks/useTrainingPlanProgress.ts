import { useMemo } from 'react';
import { container } from 'tsyringe';

import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { trainingPlansToDomain, workoutLogsToDomain } from '@/shared/utils/transformations';

export interface Session {
  id: string;
  name: string;
  cycleId: string;
  cycleName: string;
  orderIndex: number;
  exerciseCount: number;
  estimatedDuration: number;
  isCompleted: boolean;
  lastCompletedDate?: Date;
}

export interface PlanProgressMetrics {
  sessionsCompleted: number;
  totalSessions: number;
  progressPercentage: number;
  currentCycle: string | null;
  currentSession: string | null;
  estimatedTimeRemaining: number; // in minutes
  averageSessionDuration: number;
  consistencyScore: number; // 0-100 based on adherence to schedule
}

interface UseTrainingPlanProgressResult {
  plan: TrainingPlanModel | null;
  completedSessions: number;
  totalSessions: number;
  progressPercentage: number;
  upcomingSessions: Session[];
  lastCompleted: WorkoutLogModel | null;
  progressMetrics: PlanProgressMetrics;
  isLoading: boolean;
  hasData: boolean;
}

/**
 * Hook for combining training plan data with workout execution for progress tracking.
 *
 * Aggregates training plan structure with actual workout logs to show plan completion
 * progress, upcoming sessions, and performance metrics. Provides a comprehensive
 * view of training plan adherence and progress.
 *
 * @param planId The training plan ID to track progress for
 * @param profileId The profile ID to get execution data for
 * @returns Object with plan structure and progress data
 *
 * @example
 * ```typescript
 * const {
 *   plan,
 *   completedSessions,
 *   totalSessions,
 *   progressPercentage,
 *   upcomingSessions,
 *   lastCompleted,
 *   progressMetrics
 * } = useTrainingPlanProgress(planId, profileId);
 *
 * return (
 *   <Box>
 *     <PlanHeader plan={plan} progress={progressPercentage} />
 *     <ProgressBar
 *       completed={completedSessions}
 *       total={totalSessions}
 *     />
 *     <UpcomingSessionsList sessions={upcomingSessions} />
 *     <MetricsCard metrics={progressMetrics} />
 *     {lastCompleted && (
 *       <LastCompletedCard workout={lastCompleted} />
 *     )}
 *   </Box>
 * );
 * ```
 */
export function useTrainingPlanProgress(
  planId: string,
  profileId: string
): UseTrainingPlanProgressResult {
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);
  const workoutQueryService = container.resolve(WorkoutQueryService);

  // Get training plan details
  const planQuery =
    planId && profileId ? trainingPlanQueryService.getTrainingPlanDetails(planId) : null;
  const { data: plans, isObserving: planObserving } = useObserveQuery(planQuery, {
    transform: trainingPlansToDomain,
    enabled: !!(planId && profileId),
  });

  // Get workout logs for this training plan
  const workoutHistoryQuery =
    planId && profileId
      ? workoutQueryService.getWorkoutLogsByTrainingPlan(profileId, planId)
      : null;
  const { data: workoutLogs, isObserving: workoutsObserving } = useObserveQuery(
    workoutHistoryQuery,
    {
      transform: workoutLogsToDomain,
      enabled: !!(planId && profileId),
    }
  );

  // Process plan progress data
  const progressData = useMemo(() => {
    const defaultResult: UseTrainingPlanProgressResult = {
      plan: null,
      completedSessions: 0,
      totalSessions: 0,
      progressPercentage: 0,
      upcomingSessions: [],
      lastCompleted: null,
      progressMetrics: {
        sessionsCompleted: 0,
        totalSessions: 0,
        progressPercentage: 0,
        currentCycle: null,
        currentSession: null,
        estimatedTimeRemaining: 0,
        averageSessionDuration: 0,
        consistencyScore: 0,
      },
      isLoading: false,
      hasData: false,
    };

    const plan = plans?.[0] || null;
    if (!plan || !workoutLogs) {
      return {
        ...defaultResult,
        plan,
      };
    }

    // Get completed workouts for this plan
    const completedWorkouts = workoutLogs.filter((w) => w.endTime);

    // Calculate total sessions in the plan
    const totalSessions =
      plan.trainingCycles?.reduce((total, cycle) => {
        return total + (cycle.sessions?.length || 0);
      }, 0) || 0;

    // Map sessions with completion status
    const allSessions: Session[] = [];
    const completedSessionIds = new Set<string>();

    // Track completed sessions by session ID
    completedWorkouts.forEach((workout) => {
      if (workout.sessionId) {
        completedSessionIds.add(workout.sessionId);
      }
    });

    // Create session objects with completion status
    plan.trainingCycles?.forEach((cycle) => {
      cycle.sessions?.forEach((session, index) => {
        const sessionData: Session = {
          id: session.id,
          name: session.name,
          cycleId: cycle.id,
          cycleName: cycle.name,
          orderIndex: index,
          exerciseCount:
            session.exerciseGroups?.reduce(
              (count, group) => count + (group.exercises?.length || 0),
              0
            ) || 0,
          estimatedDuration: session.estimatedDuration || 60, // Default to 60 minutes
          isCompleted: completedSessionIds.has(session.id),
          lastCompletedDate: undefined, // Will be filled below
        };

        // Find last completed date for this session
        const sessionWorkouts = completedWorkouts.filter((w) => w.sessionId === session.id);
        if (sessionWorkouts.length > 0) {
          const mostRecent = sessionWorkouts.reduce((latest, current) =>
            (current.endTime?.getTime() || 0) > (latest.endTime?.getTime() || 0) ? current : latest
          );
          sessionData.lastCompletedDate = mostRecent.endTime!;
        }

        allSessions.push(sessionData);
      });
    });

    // Calculate basic progress metrics
    const completedSessions = completedSessionIds.size;
    const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Find upcoming sessions (next incomplete sessions in order)
    const incompleteSessions = allSessions
      .filter((session) => !session.isCompleted)
      .sort((a, b) => {
        // Sort by cycle order first, then session order within cycle
        if (a.cycleId !== b.cycleId) {
          const aCycle = plan.trainingCycles?.find((c) => c.id === a.cycleId);
          const bCycle = plan.trainingCycles?.find((c) => c.id === b.cycleId);
          return (aCycle?.orderIndex || 0) - (bCycle?.orderIndex || 0);
        }
        return a.orderIndex - b.orderIndex;
      });

    const upcomingSessions = incompleteSessions.slice(0, 3); // Next 3 sessions

    // Find last completed workout
    const lastCompleted =
      completedWorkouts.length > 0
        ? completedWorkouts.reduce((latest, current) =>
            (current.endTime?.getTime() || 0) > (latest.endTime?.getTime() || 0) ? current : latest
          )
        : null;

    // Calculate advanced metrics
    const totalEstimatedDuration = allSessions.reduce(
      (sum, session) => sum + session.estimatedDuration,
      0
    );
    const completedEstimatedDuration = allSessions
      .filter((session) => session.isCompleted)
      .reduce((sum, session) => sum + session.estimatedDuration, 0);
    const estimatedTimeRemaining = totalEstimatedDuration - completedEstimatedDuration;

    // Calculate average session duration from actual workouts
    const workoutDurations = completedWorkouts
      .map((w) => w.getDurationInMinutes())
      .filter((duration) => duration !== undefined) as number[];
    const averageSessionDuration =
      workoutDurations.length > 0
        ? workoutDurations.reduce((sum, duration) => sum + duration, 0) / workoutDurations.length
        : 0;

    // Calculate consistency score (simplified - could be enhanced)
    let consistencyScore = 0;
    if (totalSessions > 0) {
      // Base score on completion percentage
      consistencyScore = progressPercentage;

      // Bonus points for recent activity
      if (lastCompleted) {
        const daysSinceLastWorkout =
          (Date.now() - lastCompleted.endTime!.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastWorkout <= 7) {
          consistencyScore = Math.min(100, consistencyScore + 10);
        }
      }
    }

    // Determine current cycle and session
    let currentCycle: string | null = null;
    let currentSession: string | null = null;

    if (upcomingSessions.length > 0) {
      const nextSession = upcomingSessions[0];
      currentCycle = nextSession.cycleName;
      currentSession = nextSession.name;
    } else if (completedSessions === totalSessions) {
      // Plan is complete
      currentCycle = 'Plan Complete';
      currentSession = null;
    }

    const progressMetrics: PlanProgressMetrics = {
      sessionsCompleted: completedSessions,
      totalSessions,
      progressPercentage: Math.round(progressPercentage * 10) / 10,
      currentCycle,
      currentSession,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      averageSessionDuration: Math.round(averageSessionDuration),
      consistencyScore: Math.round(consistencyScore),
    };

    return {
      plan,
      completedSessions,
      totalSessions,
      progressPercentage: Math.round(progressPercentage),
      upcomingSessions,
      lastCompleted,
      progressMetrics,
      isLoading: false,
      hasData: totalSessions > 0 || completedWorkouts.length > 0,
    };
  }, [plans, workoutLogs, planId]);

  return {
    ...progressData,
    isLoading: !planObserving || !workoutsObserving,
  };
}
