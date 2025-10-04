import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type {
  ExportFileData,
  PyramidalSetParamsData,
  TrainingPlanData,
  WorkoutLogData,
} from '@/shared/types';

import {
  validateExportFileIntegrity,
  validatePyramidalSet,
  validateTrainingPlan,
  validateUniqueIds,
  validateWorkoutLog,
} from './index';

// Mock Zod RefinementCtx for testing
const createMockContext = () => ({
  addIssue: vi.fn(),
  path: [] as (string | number)[],
});

describe('Validation Functions', () => {
  describe('validatePyramidalSet', () => {
    let mockCtx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockCtx = createMockContext();
    });

    describe('ascending mode', () => {
      it('should pass validation when start counts are less than end counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'ascending',
          startCounts: { min: 8, direction: 'asc' },
          endCounts: { min: 12, direction: 'asc' },
          step: { min: 2, direction: 'asc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).not.toHaveBeenCalled();
      });

      it('should fail validation when start counts equal end counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'ascending',
          startCounts: { min: 10, direction: 'asc' },
          endCounts: { min: 10, direction: 'asc' },
          step: { min: 2, direction: 'asc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).toHaveBeenCalledWith({
          code: z.ZodIssueCode.custom,
          message: 'errors.validation.pyramidalSet.ascending.invalid',
          path: ['startCounts', 'min'],
        });
      });

      it('should fail validation when start counts are greater than end counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'ascending',
          startCounts: { min: 12, direction: 'asc' },
          endCounts: { min: 8, direction: 'asc' },
          step: { min: 2, direction: 'asc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).toHaveBeenCalledWith({
          code: z.ZodIssueCode.custom,
          message: 'errors.validation.pyramidalSet.ascending.invalid',
          path: ['startCounts', 'min'],
        });
      });
    });

    describe('descending mode', () => {
      it('should pass validation when start counts are greater than end counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'descending',
          startCounts: { min: 12, direction: 'desc' },
          endCounts: { min: 8, direction: 'desc' },
          step: { min: 2, direction: 'desc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).not.toHaveBeenCalled();
      });

      it('should fail validation when start counts equal end counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'descending',
          startCounts: { min: 10, direction: 'desc' },
          endCounts: { min: 10, direction: 'desc' },
          step: { min: 2, direction: 'desc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).toHaveBeenCalledWith({
          code: z.ZodIssueCode.custom,
          message: 'errors.validation.pyramidalSet.descending.invalid',
          path: ['startCounts', 'min'],
        });
      });

      it('should fail validation when start counts are less than end counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'descending',
          startCounts: { min: 8, direction: 'desc' },
          endCounts: { min: 12, direction: 'desc' },
          step: { min: 2, direction: 'desc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).toHaveBeenCalledWith({
          code: z.ZodIssueCode.custom,
          message: 'errors.validation.pyramidalSet.descending.invalid',
          path: ['startCounts', 'min'],
        });
      });
    });

    describe('bothAscendingDescending mode', () => {
      it('should pass validation for bothAscendingDescending mode regardless of counts', () => {
        const data: PyramidalSetParamsData = {
          type: 'pyramidal',
          sets: { min: 1, direction: 'asc' },
          mode: 'bothAscendingDescending',
          startCounts: { min: 10, direction: 'asc' },
          endCounts: { min: 10, direction: 'asc' },
          step: { min: 2, direction: 'asc' },
        };

        validatePyramidalSet(data, mockCtx as z.RefinementCtx);

        expect(mockCtx.addIssue).not.toHaveBeenCalled();
      });
    });
  });

  describe('validateUniqueIds', () => {
    let mockCtx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockCtx = createMockContext();
    });

    it('should pass validation when all IDs are unique', () => {
      const ids = ['id-1', 'id-2', 'id-3', 'id-4'];

      validateUniqueIds(ids, 'testField', mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should pass validation for empty array', () => {
      const ids: string[] = [];

      validateUniqueIds(ids, 'testField', mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should pass validation for single ID', () => {
      const ids = ['single-id'];

      validateUniqueIds(ids, 'testField', mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should fail validation when IDs are duplicated', () => {
      const ids = ['id-1', 'id-2', 'id-1', 'id-3'];

      validateUniqueIds(ids, 'sessionIds', mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.common.duplicateIds',
        path: ['sessionIds'],
      });
    });

    it('should fail validation with multiple duplicates', () => {
      const ids = ['id-1', 'id-2', 'id-1', 'id-2', 'id-3'];

      validateUniqueIds(ids, 'groupIds', mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.common.duplicateIds',
        path: ['groupIds'],
      });
    });

    it('should use correct field name in error path', () => {
      const ids = ['id-1', 'id-1'];
      const fieldName = 'appliedExerciseIds';

      validateUniqueIds(ids, fieldName, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.common.duplicateIds',
        path: [fieldName],
      });
    });
  });

  describe('validateTrainingPlan', () => {
    let mockCtx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockCtx = createMockContext();
    });

    it('should pass validation for plan with unique session IDs and no cycle', () => {
      const data: TrainingPlanData = {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: ['session-1', 'session-2', 'session-3'],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateTrainingPlan(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should pass validation for plan with cycle and valid order', () => {
      const data: TrainingPlanData = {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: ['session-1', 'session-2'],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: 'cycle-1',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateTrainingPlan(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should fail validation when session IDs are not unique', () => {
      const data: TrainingPlanData = {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: ['session-1', 'session-2', 'session-1'],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateTrainingPlan(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.common.duplicateIds',
        path: ['sessionIds'],
      });
    });

    it('should fail validation when cycle is assigned but order is undefined', () => {
      const data: TrainingPlanData = {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: ['session-1', 'session-2'],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: 'cycle-1',
        order: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateTrainingPlan(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.trainingPlan.cycleOrder.required',
        path: ['order'],
      });
    });

    it('should fail validation when cycle is assigned but order is negative', () => {
      const data: TrainingPlanData = {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: ['session-1', 'session-2'],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: 'cycle-1',
        order: -1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateTrainingPlan(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.trainingPlan.cycleOrder.required',
        path: ['order'],
      });
    });

    it('should pass validation when cycle is assigned and order is zero', () => {
      const data: TrainingPlanData = {
        id: 'plan-1',
        profileId: 'profile-1',
        name: 'Test Plan',
        sessionIds: ['session-1', 'session-2'],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: 'cycle-1',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateTrainingPlan(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });
  });

  describe('validateWorkoutLog', () => {
    let mockCtx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockCtx = createMockContext();
    });

    it('should pass validation when end time is after start time and duration matches', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:30:00Z');
      const durationSeconds = 5400; // 90 minutes

      const data: WorkoutLogData = {
        id: 'log-1',
        profileId: 'profile-1',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime,
        endTime,
        durationSeconds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateWorkoutLog(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should pass validation when end time is undefined', () => {
      const data: WorkoutLogData = {
        id: 'log-1',
        profileId: 'profile-1',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: undefined,
        durationSeconds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateWorkoutLog(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should fail validation when end time is before start time', () => {
      const startTime = new Date('2024-01-01T11:00:00Z');
      const endTime = new Date('2024-01-01T10:00:00Z');

      const data: WorkoutLogData = {
        id: 'log-1',
        profileId: 'profile-1',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime,
        endTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateWorkoutLog(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.workoutLog.endTime.beforeStart',
        path: ['endTime'],
      });
    });

    it('should fail validation when duration does not match time difference', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:30:00Z');
      const durationSeconds = 3600; // 60 minutes (should be 90)

      const data: WorkoutLogData = {
        id: 'log-1',
        profileId: 'profile-1',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime,
        endTime,
        durationSeconds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateWorkoutLog(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.workoutLog.duration.mismatch',
        path: ['durationSeconds'],
      });
    });

    it('should pass validation when duration difference is within tolerance (1 second)', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:30:01Z'); // 1 second extra
      const durationSeconds = 5400; // 90 minutes

      const data: WorkoutLogData = {
        id: 'log-1',
        profileId: 'profile-1',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime,
        endTime,
        durationSeconds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateWorkoutLog(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should pass validation when only duration is missing but times are consistent', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:30:00Z');

      const data: WorkoutLogData = {
        id: 'log-1',
        profileId: 'profile-1',
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: ['group-1'],
        startTime,
        endTime,
        durationSeconds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateWorkoutLog(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });
  });

  describe('validateExportFileIntegrity', () => {
    let mockCtx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockCtx = createMockContext();
    });

    it('should pass validation for consistent export file data', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'FULL_BACKUP',
        payload: {
          exercises: [
            {
              id: 'ex-1',
              profileId: 'profile-1',
              name: 'Squat',
              description: '',
              category: 'strength',
              movementType: 'dynamic',
              difficulty: 'intermediate',
              equipment: ['barbell'],
              muscleActivation: { quadriceps: 1 },
              counterType: 'reps',
              jointType: 'compound',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          appliedExercises: [
            {
              id: 'ae-1',
              profileId: 'profile-1',
              exerciseId: 'ex-1',
              templateId: null,
              setConfiguration: {
                type: 'standard',
                sets: { min: 3, direction: 'asc' },
                counts: { min: 10, direction: 'asc' },
              },
              executionCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          groups: [
            {
              id: 'group-1',
              profileId: 'profile-1',
              type: 'single',
              appliedExerciseIds: ['ae-1'],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          sessions: [
            {
              id: 'session-1',
              profileId: 'profile-1',
              name: 'Test Session',
              groupIds: ['group-1'],
              executionCount: 0,
              isDeload: false,
              dayOfWeek: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          trainingPlans: [
            {
              id: 'plan-1',
              profileId: 'profile-1',
              name: 'Test Plan',
              sessionIds: ['session-1'],
              isArchived: false,
              currentSessionIndex: 0,
              cycleId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          logs: [
            {
              id: 'log-1',
              profileId: 'profile-1',
              trainingPlanName: 'Test Plan',
              sessionName: 'Test Session',
              performedGroupIds: ['group-1'],
              startTime: new Date(),
              sessionId: 'session-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should fail validation when training plan references non-existent session', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'SINGLE_PLAN',
        payload: {
          sessions: [
            {
              id: 'session-1',
              profileId: 'profile-1',
              name: 'Session 1',
              groupIds: [],
              executionCount: 0,
              isDeload: false,
              dayOfWeek: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          trainingPlans: [
            {
              id: 'plan-1',
              profileId: 'profile-1',
              name: 'Test Plan',
              sessionIds: ['session-1', 'session-missing'],
              isArchived: false,
              currentSessionIndex: 0,
              cycleId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingSession:session-missing',
      });
    });

    it('should fail validation when session references non-existent group', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'SINGLE_PLAN',
        payload: {
          groups: [
            {
              id: 'group-1',
              profileId: 'profile-1',
              type: 'single',
              appliedExerciseIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          sessions: [
            {
              id: 'session-1',
              profileId: 'profile-1',
              name: 'Session 1',
              groupIds: ['group-1', 'group-missing'],
              executionCount: 0,
              isDeload: false,
              dayOfWeek: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingGroup:group-missing',
      });
    });

    it('should fail validation when group references non-existent applied exercise', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'SINGLE_PLAN',
        payload: {
          appliedExercises: [
            {
              id: 'ae-1',
              profileId: 'profile-1',
              exerciseId: 'ex-1',
              templateId: null,
              setConfiguration: {
                type: 'standard',
                sets: { min: 3, direction: 'asc' },
                counts: { min: 10, direction: 'asc' },
              },
              executionCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          groups: [
            {
              id: 'group-1',
              profileId: 'profile-1',
              type: 'single',
              appliedExerciseIds: ['ae-1', 'ae-missing'],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingAppliedExercise:ae-missing',
      });
    });

    it('should fail validation when applied exercise references non-existent exercise', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'EXERCISE_LIBRARY',
        payload: {
          exercises: [
            {
              id: 'ex-1',
              profileId: 'profile-1',
              name: 'Squat',
              description: '',
              category: 'strength',
              movementType: 'dynamic',
              difficulty: 'intermediate',
              equipment: ['barbell'],
              muscleActivation: { quadriceps: 1 },
              counterType: 'reps',
              jointType: 'compound',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          appliedExercises: [
            {
              id: 'ae-1',
              profileId: 'profile-1',
              exerciseId: 'ex-missing',
              templateId: null,
              setConfiguration: {
                type: 'standard',
                sets: { min: 3, direction: 'asc' },
                counts: { min: 10, direction: 'asc' },
              },
              executionCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingExercise:ex-missing',
      });
    });

    it('should fail validation when log references non-existent session', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'WORKOUT_HISTORY',
        payload: {
          sessions: [
            {
              id: 'session-1',
              profileId: 'profile-1',
              name: 'Session 1',
              groupIds: [],
              executionCount: 0,
              isDeload: false,
              dayOfWeek: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          logs: [
            {
              id: 'log-1',
              profileId: 'profile-1',
              trainingPlanName: 'Test Plan',
              sessionName: 'Test Session',
              performedGroupIds: [],
              startTime: new Date(),
              sessionId: 'session-missing',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingLogSession:session-missing',
      });
    });

    it('should pass validation when log has no sessionId', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'WORKOUT_HISTORY',
        payload: {
          logs: [
            {
              id: 'log-1',
              profileId: 'profile-1',
              trainingPlanName: 'Test Plan',
              sessionName: 'Test Session',
              performedGroupIds: [],
              startTime: new Date(),
              sessionId: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should handle multiple integrity violations in one validation', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'FULL_BACKUP',
        payload: {
          exercises: [],
          appliedExercises: [
            {
              id: 'ae-1',
              profileId: 'profile-1',
              exerciseId: 'ex-missing',
              templateId: null,
              setConfiguration: {
                type: 'standard',
                sets: { min: 3, direction: 'asc' },
                counts: { min: 10, direction: 'asc' },
              },
              executionCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          groups: [
            {
              id: 'group-1',
              profileId: 'profile-1',
              type: 'single',
              appliedExerciseIds: ['ae-missing'],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          sessions: [
            {
              id: 'session-1',
              profileId: 'profile-1',
              name: 'Session 1',
              groupIds: ['group-missing'],
              executionCount: 0,
              isDeload: false,
              dayOfWeek: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).toHaveBeenCalledTimes(3);
      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingGroup:group-missing',
      });
      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingAppliedExercise:ae-missing',
      });
      expect(mockCtx.addIssue).toHaveBeenCalledWith({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.export.danglingExercise:ex-missing',
      });
    });

    it('should handle empty payload gracefully', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'FULL_BACKUP',
        payload: {},
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });

    it('should handle undefined arrays in payload', () => {
      const data: ExportFileData = {
        schemaVersion: 1,
        exportDate: new Date(),
        payloadType: 'FULL_BACKUP',
        payload: {
          sessions: undefined,
          trainingPlans: undefined,
          groups: undefined,
          appliedExercises: undefined,
          exercises: undefined,
          logs: undefined,
        },
      };

      validateExportFileIntegrity(data, mockCtx as z.RefinementCtx);

      expect(mockCtx.addIssue).not.toHaveBeenCalled();
    });
  });
});
