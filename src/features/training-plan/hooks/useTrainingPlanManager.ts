import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { TrainingCycleModel, TrainingPlanModel } from '@/features/training-plan/domain';
import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { TrainingPlanService } from '@/features/training-plan/services/TrainingPlanService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { trainingCyclesToDomain, trainingPlansToDomain } from '@/shared/utils/transformations';

export interface CreateTrainingPlanInput {
  profileId: string;
  name: string;
  description?: string;
  duration: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general';
  sessions: {
    name: string;
    exercises: Array<{
      exerciseId: string;
      sets: number;
      reps: string; // e.g., "8-10", "5", "AMRAP"
      rest: number; // seconds
      intensity?: string; // e.g., "RPE 8", "70% 1RM"
    }>;
  }[];
}

export interface CreateTrainingCycleInput {
  trainingPlanId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

/**
 * Comprehensive training plan and cycle management aggregate hook.
 *
 * This hook provides a unified interface for:
 * - Training plan CRUD operations (create, update, delete, archive)
 * - Training cycle management and scheduling
 * - Plan progression and adaptation tracking
 * - Plan templates and customization
 * - Workout scheduling from plans
 *
 * Consolidates 10+ training-plan hooks into a single, cohesive API while
 * maintaining reactive updates through WatermelonDB.
 *
 * @param profileId - The profile ID for scoping operations
 * @returns Comprehensive training plan management interface
 */
export function useTrainingPlanManager(profileId: string) {
  const trainingPlanQueryService = container.resolve(TrainingPlanQueryService);
  const trainingPlanService = container.resolve(TrainingPlanService);

  // Training plans for profile
  const trainingPlansQuery = profileId
    ? trainingPlanQueryService.getTrainingPlans(profileId)
    : null;
  const { data: trainingPlans = [], isObserving: isLoadingPlans } =
    useObserveQuery<TrainingPlanModel>(trainingPlansQuery, {
      transform: trainingPlansToDomain,
      enabled: !!profileId,
    });

  // Training cycles for profile
  const trainingCyclesQuery = profileId
    ? trainingPlanQueryService.getTrainingCycles(profileId)
    : null;
  const { data: trainingCycles = [], isObserving: isLoadingCycles } =
    useObserveQuery<TrainingCycleModel>(trainingCyclesQuery, {
      transform: trainingCyclesToDomain,
      enabled: !!profileId,
    });

  // Active training cycles
  const activeCycles = useMemo(() => {
    const now = new Date();
    return trainingCycles.filter(
      (cycle) => new Date(cycle.startDate) <= now && new Date(cycle.endDate) >= now
    );
  }, [trainingCycles]);

  // Get specific training plan with full details - returns a function that creates the query
  const getTrainingPlanDetails = useCallback(
    (planId: string) => {
      return trainingPlanService.getTrainingPlanDetails(planId);
    },
    [trainingPlanService]
  );

  // Get specific training plan - returns a function to fetch the data
  const getTrainingPlan = useCallback(
    async (planId: string) => {
      if (!planId) return null;
      try {
        const plan = await trainingPlanQueryService.getTrainingPlan(planId);
        return plan;
      } catch (_error) {
        console.error('Failed to get training plan:', _error);
        return null;
      }
    },
    [trainingPlanQueryService]
  );

  // Get specific training cycle - returns a function to fetch the data
  const getTrainingCycle = useCallback(
    async (cycleId: string) => {
      if (!cycleId) return null;
      try {
        const cycle = await trainingPlanQueryService.getTrainingCycle(cycleId);
        return cycle;
      } catch (_error) {
        console.error('Failed to get training cycle:', _error);
        return null;
      }
    },
    [trainingPlanQueryService]
  );

  // Training plan operations
  const createPlan = useMutation({
    mutationFn: async (input: CreateTrainingPlanInput) => {
      const result = await trainingPlanService.createTrainingPlan(
        input.profileId,
        input.name,
        input.description
      );
      if (result.isFailure) {
        throw new Error(result.error.message);
      }
      return result.value;
    },
  });

  const updatePlan = useMutation({
    mutationFn: async (input: {
      id: string;
      updates: { name?: string; description?: string; notes?: string; cycleId?: string | null };
    }) => {
      const result = await trainingPlanService.updateTrainingPlan(input.id, input.updates);
      if (result.isFailure) {
        throw new Error(result.error.message);
      }
      return result.value;
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      await trainingPlanService.deleteTrainingPlan(planId);
    },
  });

  const archivePlan = useMutation({
    mutationFn: async (planId: string) => {
      return await trainingPlanService.archiveTrainingPlan(planId);
    },
  });

  // Training cycle operations
  const createCycle = useMutation({
    mutationFn: async (input: CreateTrainingCycleInput) => {
      return await trainingPlanService.createTrainingCycle(input);
    },
  });

  const updateCycle = useMutation({
    mutationFn: async (input: { id: string; updates: Partial<CreateTrainingCycleInput> }) => {
      return await trainingPlanService.updateTrainingCycle(input.id, input.updates);
    },
  });

  const deleteCycle = useMutation({
    mutationFn: async (cycleId: string) => {
      await trainingPlanService.deleteTrainingCycle(cycleId);
    },
  });

  // Plan progression tracking
  const planProgress = useMemo(() => {
    const progressMap = new Map();

    activeCycles.forEach((cycle) => {
      const plan = trainingPlans.find((p) => p.id === cycle.trainingPlanId);
      if (!plan) return;

      const totalDuration = new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime();
      const elapsed = Date.now() - new Date(cycle.startDate).getTime();
      const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

      progressMap.set(cycle.id, {
        cycleId: cycle.id,
        planId: plan.id,
        planName: plan.name,
        cycleName: cycle.name,
        progress: Math.round(progress * 100),
        daysRemaining: Math.max(
          0,
          Math.ceil((new Date(cycle.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        ),
        isActive: true,
      });
    });

    return Array.from(progressMap.values());
  }, [activeCycles, trainingPlans]);

  // Plan templates and recommendations
  const planHelpers = useMemo(
    () => ({
      getByDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
        return trainingPlans.filter((plan) => plan.difficulty === difficulty);
      },

      getByGoal: (goal: string) => {
        return trainingPlans.filter((plan) => plan.goal === goal);
      },

      getRecommendedDuration: (goal: string, difficulty: string) => {
        // Simple recommendation logic
        if (goal === 'strength' && difficulty === 'advanced') return 16;
        if (goal === 'hypertrophy') return 12;
        if (goal === 'endurance') return 8;
        return 10; // default
      },

      validatePlanStructure: (plan: Partial<CreateTrainingPlanInput>) => {
        const errors: string[] = [];

        if (!plan.name?.trim()) errors.push('Plan name is required');
        if (!plan.duration || plan.duration < 1 || plan.duration > 52) {
          errors.push('Duration must be between 1-52 weeks');
        }
        if (!plan.sessions || plan.sessions.length === 0) {
          errors.push('At least one session is required');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },
    }),
    [trainingPlans]
  );

  // Plan scheduling helpers
  const scheduling = useMemo(
    () => ({
      getNextWorkoutFromPlan: (planId: string) => {
        const plan = trainingPlans.find((p) => p.id === planId);
        if (!plan) return null;

        // Simple logic - return first session
        // In real implementation, this would consider workout history
        return plan.sessions?.[0] || null;
      },

      getWeeklySchedule: (cycleId: string) => {
        const cycle = trainingCycles.find((c) => c.id === cycleId);
        if (!cycle) return [];

        const plan = trainingPlans.find((p) => p.id === cycle.trainingPlanId);
        if (!plan) return [];

        // Return schedule for current week
        return (
          plan.sessions?.map((session, index) => ({
            sessionId: `${cycle.id}-${index}`,
            sessionName: session.name,
            dayOfWeek: index % 7,
            exercises: session.exercises,
          })) || []
        );
      },
    }),
    [trainingPlans, trainingCycles]
  );

  // Statistics
  const statistics = useMemo(() => {
    const totalPlans = trainingPlans.length;
    const activePlansCount = activeCycles.length;
    const archivedPlans = trainingPlans.filter((plan) => plan.isArchived).length;
    const totalCycles = trainingCycles.length;
    const completedCycles = trainingCycles.filter(
      (cycle) => new Date(cycle.endDate) < new Date()
    ).length;

    return {
      totalPlans,
      activePlans: activePlansCount,
      archivedPlans,
      totalCycles,
      completedCycles,
      averagePlanDuration:
        totalPlans > 0
          ? Math.round(trainingPlans.reduce((sum, plan) => sum + plan.duration, 0) / totalPlans)
          : 0,
    };
  }, [trainingPlans, trainingCycles, activeCycles]);

  return {
    // Data queries
    plans: trainingPlans,
    cycles: trainingCycles,
    activeCycles,
    planProgress,
    statistics,

    // Individual operations
    getPlanDetails: getTrainingPlanDetails,
    getPlan: getTrainingPlan,
    getCycle: getTrainingCycle,

    // Plan operations
    plan: {
      create: createPlan,
      update: updatePlan,
      delete: deletePlan,
      archive: archivePlan,
    },

    // Cycle operations
    cycle: {
      create: createCycle,
      update: updateCycle,
      delete: deleteCycle,
    },

    // Helpers
    helpers: planHelpers,
    scheduling,

    // Loading states
    isLoadingPlans,
    isLoadingCycles,
    isCreatingPlan: createPlan.isPending,
    isUpdatingPlan: updatePlan.isPending,
    isDeletingPlan: deletePlan.isPending,
    isArchivingPlan: archivePlan.isPending,
    isCreatingCycle: createCycle.isPending,
    isUpdatingCycle: updateCycle.isPending,
    isDeletingCycle: deleteCycle.isPending,

    // Error states
    planError: createPlan.error || updatePlan.error || deletePlan.error || archivePlan.error,
    cycleError: createCycle.error || updateCycle.error || deleteCycle.error,
  };
}

/**
 * Type definition for the useTrainingPlanManager hook return value
 */
export type UseTrainingPlanManagerResult = ReturnType<typeof useTrainingPlanManager>;
