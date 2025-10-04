import { differenceInSeconds } from 'date-fns';
import { z } from 'zod';

import {
  ExportFileData,
  PyramidalSetParamsData,
  TrainingPlanData,
  WorkoutLogData,
} from '@/shared/types';

/**
 * A collection of reusable, testable validation functions for Zod schemas.
 */

/**
 * Validates pyramidal set parameters based on the mode.
 * For ascending mode, start counts must be less than end counts.
 * For descending mode, start counts must be greater than end counts.
 *
 * @param data - The pyramidal set parameters to validate
 * @param ctx - Zod refinement context for adding issues
 */
export const validatePyramidalSet = (data: PyramidalSetParamsData, ctx: z.RefinementCtx) => {
  if (data.mode === 'ascending' && data.startCounts.min >= data.endCounts.min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'errors.validation.pyramidalSet.ascending.invalid',
      path: ['startCounts', 'min'],
    });
  }
  if (data.mode === 'descending' && data.startCounts.min <= data.endCounts.min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'errors.validation.pyramidalSet.descending.invalid',
      path: ['startCounts', 'min'],
    });
  }
};

/**
 * Validates that all IDs in an array are unique.
 *
 * @param ids - Array of ID strings to check for uniqueness
 * @param fieldName - Name of the field being validated (for error path)
 * @param ctx - Zod refinement context for adding issues
 */
export const validateUniqueIds = (ids: string[], fieldName: string, ctx: z.RefinementCtx) => {
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'errors.validation.common.duplicateIds',
      path: [fieldName],
    });
  }
};

/**
 * Validates training plan data consistency.
 * Ensures unique session IDs and proper cycle ordering.
 *
 * @param data - The training plan data to validate
 * @param ctx - Zod refinement context for adding issues
 */
export const validateTrainingPlan = (data: TrainingPlanData, ctx: z.RefinementCtx) => {
  validateUniqueIds(data.sessionIds, 'sessionIds', ctx);
  if (data.cycleId !== null && (data.order === undefined || data.order < 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'errors.validation.trainingPlan.cycleOrder.required',
      path: ['order'],
    });
  }
};

/**
 * Validates workout log time consistency.
 * Ensures end time is after start time and duration matches the time difference.
 *
 * @param data - The workout log data to validate
 * @param ctx - Zod refinement context for adding issues
 */
export const validateWorkoutLog = (data: WorkoutLogData, ctx: z.RefinementCtx) => {
  if (data.endTime && data.endTime < data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'errors.validation.workoutLog.endTime.beforeStart',
      path: ['endTime'],
    });
  }
  if (data.endTime && data.startTime && data.durationSeconds) {
    if (Math.abs(differenceInSeconds(data.endTime, data.startTime) - data.durationSeconds) > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.workoutLog.duration.mismatch',
        path: ['durationSeconds'],
      });
    }
  }
};

/**
 * Validates the integrity of export file data by checking referential consistency.
 * Ensures all referenced IDs exist in their respective collections.
 *
 * @param data - The export file data to validate
 * @param ctx - Zod refinement context for adding issues
 */
export const validateExportFileIntegrity = (data: ExportFileData, ctx: z.RefinementCtx) => {
  const sessionIds = new Set(data.payload.sessions?.map((s) => s.id));
  data.payload.trainingPlans?.forEach((plan) => {
    plan.sessionIds.forEach((id) => {
      if (!sessionIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `errors.validation.export.danglingSession:${id}`,
        });
      }
    });
  });

  const groupIds = new Set(data.payload.groups?.map((g) => g.id));
  data.payload.sessions?.forEach((session) => {
    session.groupIds.forEach((id) => {
      if (!groupIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `errors.validation.export.danglingGroup:${id}`,
        });
      }
    });
  });

  const appliedExerciseIds = new Set(data.payload.appliedExercises?.map((ae) => ae.id));
  data.payload.groups?.forEach((group) => {
    group.appliedExerciseIds.forEach((id) => {
      if (!appliedExerciseIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `errors.validation.export.danglingAppliedExercise:${id}`,
        });
      }
    });
  });

  const exerciseIds = new Set(data.payload.exercises?.map((e) => e.id));
  data.payload.appliedExercises?.forEach((ae) => {
    if (!exerciseIds.has(ae.exerciseId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `errors.validation.export.danglingExercise:${ae.exerciseId}`,
      });
    }
  });

  data.payload.logs?.forEach((log) => {
    if (log.sessionId && !sessionIds.has(log.sessionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `errors.validation.export.danglingLogSession:${log.sessionId}`,
      });
    }
  });
};
