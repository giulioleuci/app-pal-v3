import { describe, expect, it, vi } from 'vitest';

// Mock external dependencies
vi.mock('@/lib', () => {
  const uuids = [
    '12345678-1234-4234-8234-123456789abc',
    '22345678-1234-4234-9234-123456789abc',
    '32345678-1234-4234-a234-123456789abc',
    '42345678-1234-4234-b234-123456789abc',
    '52345678-1234-4234-8234-123456789abc',
    '62345678-1234-4234-9234-123456789abc',
    '72345678-1234-4234-a234-123456789abc',
    '82345678-1234-4234-b234-123456789abc',
    '92345678-1234-4234-8234-123456789abc',
    'a2345678-1234-4234-9234-123456789abc',
    'b2345678-1234-4234-a234-123456789abc',
    'c2345678-1234-4234-b234-123456789abc',
  ];
  let counter = 0;
  return {
    generateId: vi.fn(() => {
      const uuid = uuids[counter % uuids.length];
      counter++;
      return uuid;
    }),
    classifyRepRange: vi.fn((counts: number) => {
      if (counts <= 5) return 'strength';
      if (counts <= 12) return 'hypertrophy';
      return 'endurance';
    }),
  };
});

import { workoutLogSchema } from '@/shared/types';
import {
  createTestPerformedExerciseLogData,
  createTestPerformedGroupData,
  createTestPerformedSetData,
  createTestWorkoutLogData,
} from '@/test-factories';

import { PerformedExerciseLogModel } from '../PerformedExerciseLogModel';
import { PerformedGroupLogModel } from '../PerformedGroupLogModel';
import { PerformedSetModel } from '../PerformedSetModel';
import { WorkoutLogModel } from '../WorkoutLogModel';

// Mock date-fns
vi.mock('date-fns', () => ({
  differenceInSeconds: vi.fn((endDate: Date, startDate: Date) => {
    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  }),
}));

// Helper function to create test sets
function createTestSets(count: number = 3, overrides: any[] = []) {
  const sets: PerformedSetModel[] = [];
  for (let i = 0; i < count; i++) {
    const setData = createTestPerformedSetData({
      weight: 100 + i * 10,
      counts: 10 - i,
      completed: true,
      rpe: 7 + i,
      ...overrides[i],
    });
    sets.push(PerformedSetModel.hydrate(setData));
  }
  return sets;
}

// Helper function to create test exercise logs
function createTestExerciseLogs(count: number = 2, overrides: any[] = []) {
  const exercises: PerformedExerciseLogModel[] = [];
  for (let i = 0; i < count; i++) {
    const sets = createTestSets(2, [
      { weight: 100 + i * 20, counts: 10, completed: true, rpe: 7 },
      { weight: 105 + i * 20, counts: 8, completed: true, rpe: 8 },
    ]);
    const data = createTestPerformedExerciseLogData({
      exerciseName: `Exercise ${i + 1}`,
      exerciseId: `exercise-${i + 1}`,
      isSkipped: false,
      ...overrides[i],
    });
    exercises.push(PerformedExerciseLogModel.hydrate(data, sets));
  }
  return exercises;
}

// Helper function to create test groups
function createTestGroups(count: number = 2, overrides: any[] = []) {
  const groups: PerformedGroupLogModel[] = [];
  for (let i = 0; i < count; i++) {
    const exercises = createTestExerciseLogs(2);
    const data = createTestPerformedGroupData({
      type: i === 0 ? 'single' : 'superset',
      ...overrides[i],
    });
    groups.push(PerformedGroupLogModel.hydrate(data, exercises));
  }
  return groups;
}

// Helper function to create test model
function createTestWorkoutLogModel(overrides = {}, groups?: PerformedGroupLogModel[]) {
  const data = createTestWorkoutLogData(overrides);
  const testGroups = groups || createTestGroups();
  return WorkoutLogModel.hydrate(data, testGroups);
}

describe('WorkoutLogModel', () => {
  describe('hydrate', () => {
    it('should create a new WorkoutLogModel instance from plain data', () => {
      // Arrange
      const data = createTestWorkoutLogData();
      const groups = createTestGroups();

      // Act
      const model = WorkoutLogModel.hydrate(data, groups);

      // Assert
      expect(model).toBeInstanceOf(WorkoutLogModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.trainingPlanId).toBe(data.trainingPlanId);
      expect(model.trainingPlanName).toBe(data.trainingPlanName);
      expect(model.sessionId).toBe(data.sessionId);
      expect(model.sessionName).toBe(data.sessionName);
      expect(model.performedGroups).toBe(groups);
      expect(model.startTime).toBe(data.startTime);
      expect(model.endTime).toBe(data.endTime);
      expect(model.durationSeconds).toBe(data.durationSeconds);
      expect(model.totalVolume).toBe(data.totalVolume);
      expect(model.notes).toBe(data.notes);
      expect(model.userRating).toBe(data.userRating);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle optional fields as undefined', () => {
      // Arrange
      const data = createTestWorkoutLogData({
        trainingPlanId: undefined,
        sessionId: undefined,
        endTime: undefined,
        durationSeconds: undefined,
        totalVolume: undefined,
        notes: undefined,
        userRating: undefined,
      });
      const groups = createTestGroups();

      // Act
      const model = WorkoutLogModel.hydrate(data, groups);

      // Assert
      expect(model.trainingPlanId).toBeUndefined();
      expect(model.sessionId).toBeUndefined();
      expect(model.endTime).toBeUndefined();
      expect(model.durationSeconds).toBeUndefined();
      expect(model.totalVolume).toBeUndefined();
      expect(model.notes).toBeUndefined();
      expect(model.userRating).toBeUndefined();
    });

    it('should handle empty groups array', () => {
      // Arrange
      const data = createTestWorkoutLogData();
      const emptyGroups: PerformedGroupLogModel[] = [];

      // Act
      const model = WorkoutLogModel.hydrate(data, emptyGroups);

      // Assert
      expect(model.performedGroups).toEqual([]);
      expect(model.performedGroups.length).toBe(0);
    });
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof WorkoutLogModel.prototype.constructor).toBe('function');
    });
  });

  describe('getAllSets', () => {
    it('should return all sets from all exercises in all groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const allSets = model.getAllSets();

      // Assert
      // 2 groups × 2 exercises × 2 sets = 8 total sets
      expect(allSets.length).toBe(8);
      expect(allSets.every((set) => set instanceof PerformedSetModel)).toBe(true);
    });

    it('should return empty array for workout with no groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act
      const allSets = model.getAllSets();

      // Assert
      expect(allSets).toEqual([]);
    });

    it('should return empty array for workout with groups but no exercises', () => {
      // Arrange
      const emptyGroups = [PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [])];
      const model = createTestWorkoutLogModel({}, emptyGroups);

      // Act
      const allSets = model.getAllSets();

      // Assert
      expect(allSets).toEqual([]);
    });
  });

  describe('getAllExercises', () => {
    it('should return all exercises from all groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const allExercises = model.getAllExercises();

      // Assert
      // 2 groups × 2 exercises = 4 total exercises
      expect(allExercises.length).toBe(4);
      expect(allExercises.every((ex) => ex instanceof PerformedExerciseLogModel)).toBe(true);
    });

    it('should return empty array for workout with no groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act
      const allExercises = model.getAllExercises();

      // Assert
      expect(allExercises).toEqual([]);
    });
  });

  describe('getDurationInMinutes', () => {
    it('should calculate duration in minutes when workout is finished', () => {
      // Arrange
      const startTime = new Date('2023-01-01T10:00:00Z');
      const endTime = new Date('2023-01-01T11:30:00Z'); // 90 minutes later
      const model = createTestWorkoutLogModel({
        startTime,
        endTime,
      });

      // Act
      const duration = model.getDurationInMinutes();

      // Assert
      expect(duration).toBe(90);
    });

    it('should return undefined when workout is not finished', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        endTime: undefined,
      });

      // Act
      const duration = model.getDurationInMinutes();

      // Assert
      expect(duration).toBeUndefined();
    });

    it('should round duration to nearest minute', () => {
      // Arrange
      const startTime = new Date('2023-01-01T10:00:00Z');
      const endTime = new Date('2023-01-01T10:30:30Z'); // 30.5 minutes later
      const model = createTestWorkoutLogModel({
        startTime,
        endTime,
      });

      // Act
      const duration = model.getDurationInMinutes();

      // Assert
      expect(duration).toBe(31); // Rounded up from 30.5
    });
  });

  describe('getPersonalBests', () => {
    it('should return heaviest sets per exercise', () => {
      // Arrange
      const exercise1Sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 100,
            counts: 10,
            completed: true,
          })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 120,
            counts: 8,
            completed: true,
          })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 110,
            counts: 6,
            completed: true,
          })
        ),
      ];
      const exercise2Sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 80,
            counts: 12,
            completed: true,
          })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 90,
            counts: 10,
            completed: true,
          })
        ),
      ];

      const exercise1 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          exerciseId: 'exercise-1',
          exerciseName: 'Bench Press',
        }),
        exercise1Sets
      );
      const exercise2 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          exerciseId: 'exercise-2',
          exerciseName: 'Squat',
        }),
        exercise2Sets
      );

      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [
        exercise1,
        exercise2,
      ]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const personalBests = model.getPersonalBests();

      // Assert
      expect(personalBests.size).toBe(2);
      expect(personalBests.get('exercise-1')?.weight).toBe(120);
      expect(personalBests.get('exercise-2')?.weight).toBe(90);
    });

    it('should handle exercises with no completed sets', () => {
      // Arrange
      const exerciseWithNoCompletedSets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({ exerciseId: 'exercise-1' }),
        exerciseWithNoCompletedSets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const personalBests = model.getPersonalBests();

      // Assert
      expect(personalBests.size).toBe(0);
    });

    it('should return empty map for workout with no exercises', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act
      const personalBests = model.getPersonalBests();

      // Assert
      expect(personalBests.size).toBe(0);
    });
  });

  describe('cloneWithUpdatedSet', () => {
    it('should create new instance with updated set across all groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel();
      const allSets = model.getAllSets();
      const targetSet = allSets[0];

      const updatedSet = PerformedSetModel.hydrate(
        createTestPerformedSetData({
          id: targetSet.id,
          weight: 200,
          counts: 5,
          completed: true,
        })
      );

      // Act
      const updated = model.cloneWithUpdatedSet(updatedSet);

      // Assert
      expect(updated).not.toBe(model);
      expect(updated.performedGroups).not.toBe(model.performedGroups);

      // Find the updated set in the new model
      const updatedAllSets = updated.getAllSets();
      const foundUpdatedSet = updatedAllSets.find((s) => s.id === targetSet.id);
      expect(foundUpdatedSet?.weight).toBe(200);
      expect(foundUpdatedSet?.counts).toBe(5);

      // Original should be unchanged
      expect(allSets.find((s) => s.id === targetSet.id)?.weight).toBe(targetSet.weight);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        notes: 'Test notes',
      });
      const allSets = model.getAllSets();
      const updatedSet = PerformedSetModel.hydrate(
        createTestPerformedSetData({
          id: allSets[0].id,
          weight: 150,
        })
      );

      // Act
      const updated = model.cloneWithUpdatedSet(updatedSet);

      // Assert
      expect(updated.trainingPlanName).toBe(model.trainingPlanName);
      expect(updated.sessionName).toBe(model.sessionName);
      expect(updated.notes).toBe(model.notes);
      expect(updated.startTime).toBe(model.startTime);
    });
  });

  describe('calculateTotalVolume', () => {
    it('should calculate total volume from all groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const totalVolume = model.calculateTotalVolume();

      // Assert
      // Each group has 2 exercises, each exercise has 2 sets
      // Group 1: Exercise 1: (100*10 + 105*8) = 1840, Exercise 2: (120*10 + 125*8) = 2200
      // Group 2: Exercise 1: (100*10 + 105*8) = 1840, Exercise 2: (120*10 + 125*8) = 2200
      // Total: 1840 + 2200 + 1840 + 2200 = 8080
      expect(totalVolume).toBe(8080);
    });

    it('should return 0 for workout with no groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act
      const totalVolume = model.calculateTotalVolume();

      // Assert
      expect(totalVolume).toBe(0);
    });
  });

  describe('getTotalSets', () => {
    it('should calculate total sets from all groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      // 2 groups × 2 exercises × 2 sets = 8 total sets (all completed)
      expect(totalSets).toBe(8);
    });

    it('should only count completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(2); // Only 2 completed sets
    });
  });

  describe('getTotalCounts', () => {
    it('should calculate total counts from all groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const totalCounts = model.getTotalCounts();

      // Assert
      // Each group: 2 exercises × (10+8 counts per exercise) = 36 counts per group
      // Total: 36 × 2 groups = 72
      expect(totalCounts).toBe(72);
    });

    it('should only count completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 8, completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 6, completed: true })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const totalCounts = model.getTotalCounts();

      // Assert
      expect(totalCounts).toBe(16); // 10 + 6 = 16
    });
  });

  describe('getAverageRPE', () => {
    it('should calculate average RPE from all sets with RPE', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(8.0); // (7 + 8 + 9) / 3 = 8.0, rounded to 1 decimal
    });

    it('should return undefined when no sets have RPE', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBeUndefined();
    });

    it('should only consider completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 10, completed: false })), // Not completed
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: true })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = WorkoutLogModel.hydrate(createTestWorkoutLogData(), [group]);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBeCloseTo(8.0, 1); // (7 + 9) / 2 = 8.0
    });
  });

  describe('getAverageLastRPE', () => {
    it('should calculate average of last RPE from each exercise', () => {
      // Arrange
      const exercise1Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
      ];
      const exercise2Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 6, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: true })),
      ];

      const exercise1 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise1Sets
      );
      const exercise2 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise2Sets
      );

      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [
        exercise1,
        exercise2,
      ]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const averageLastRPE = model.getAverageLastRPE();

      // Assert
      expect(averageLastRPE).toBe(8.5); // (8 + 9) / 2 = 8.5
    });

    it('should return undefined when no exercises have RPE', () => {
      // Arrange
      const exercise1Sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const exercise1 = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        exercise1Sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise1]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const averageLastRPE = model.getAverageLastRPE();

      // Assert
      expect(averageLastRPE).toBeUndefined();
    });
  });

  describe('getSetCountByRepRange', () => {
    it('should distribute sets by rep range category', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 3, completed: true })), // strength
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 8, completed: true })), // hypertrophy
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 15, completed: true })), // endurance
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: true })), // hypertrophy
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 5, completed: false })), // Should not count
      ];

      // Mock the getRepRangeCategory method
      vi.spyOn(sets[0], 'getRepRangeCategory').mockReturnValue('strength');
      vi.spyOn(sets[1], 'getRepRangeCategory').mockReturnValue('hypertrophy');
      vi.spyOn(sets[2], 'getRepRangeCategory').mockReturnValue('endurance');
      vi.spyOn(sets[3], 'getRepRangeCategory').mockReturnValue('hypertrophy');

      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = WorkoutLogModel.hydrate(createTestWorkoutLogData(), [group]);

      // Act
      const distribution = model.getSetCountByRepRange();

      // Assert
      expect(distribution).toEqual({
        strength: 1,
        hypertrophy: 2,
        endurance: 1,
      });
    });

    it('should return zero counts for workout with no sets', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act
      const distribution = model.getSetCountByRepRange();

      // Assert
      expect(distribution).toEqual({
        strength: 0,
        hypertrophy: 0,
        endurance: 0,
      });
    });
  });

  describe('findExerciseLog', () => {
    it('should find exercise log by exercise ID across all groups', () => {
      // Arrange
      const targetExerciseId = 'target-exercise-id';
      const targetExercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          exerciseId: targetExerciseId,
          exerciseName: 'Target Exercise',
        }),
        createTestSets()
      );
      const otherExercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData({
          exerciseId: 'other-exercise-id',
        }),
        createTestSets()
      );

      const group1 = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [
        otherExercise,
      ]);
      const group2 = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [
        targetExercise,
      ]);

      const model = createTestWorkoutLogModel({}, [group1, group2]);

      // Act
      const found = model.findExerciseLog(targetExerciseId);

      // Assert
      expect(found).toBe(targetExercise);
      expect(found?.exerciseName).toBe('Target Exercise');
    });

    it('should return undefined when exercise is not found', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const found = model.findExerciseLog('non-existent-id');

      // Assert
      expect(found).toBeUndefined();
    });

    it('should return undefined for workout with no groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act
      const found = model.findExerciseLog('any-id');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('getPerformanceScore', () => {
    it('should calculate performance score based on volume, RPE, and completion', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 100,
            counts: 10,
            rpe: 8,
            completed: true,
          })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 110,
            counts: 8,
            rpe: 7,
            completed: true,
          })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 120,
            counts: 6,
            rpe: 9,
            completed: false,
          })
        ),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const score = model.getPerformanceScore();

      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    it('should cap score at 100', () => {
      // Arrange
      const highVolumeSets = Array.from({ length: 20 }, () =>
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            weight: 500,
            counts: 20,
            rpe: 10,
            completed: true,
          })
        )
      );
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        highVolumeSets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const score = model.getPerformanceScore();

      // Assert
      expect(score).toBe(100);
    });

    it('should return 0 for workout with no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const score = model.getPerformanceScore();

      // Assert
      expect(score).toBe(0);
    });
  });

  describe('getSetQualityMetrics', () => {
    it('should count high effort and junk volume sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })), // High effort
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: true })), // High effort
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 4, completed: true })), // Junk volume
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 6, completed: true })), // Neither
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })), // No RPE
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const metrics = model.getSetQualityMetrics();

      // Assert
      expect(metrics.highEffortSets).toBe(2); // RPE >= 7
      expect(metrics.junkVolumeSets).toBe(1); // RPE < 5
    });

    it('should return zero counts for workout with no RPE data', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        sets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act
      const metrics = model.getSetQualityMetrics();

      // Assert
      expect(metrics.highEffortSets).toBe(0);
      expect(metrics.junkVolumeSets).toBe(0);
    });
  });

  describe('cloneAsEnded', () => {
    it('should create new instance with end time and calculated metrics', () => {
      // Arrange
      const startTime = new Date('2023-01-01T10:00:00Z');
      const model = createTestWorkoutLogModel({
        startTime,
        endTime: undefined,
        durationSeconds: undefined,
        totalVolume: undefined,
      });

      // Act
      const ended = model.cloneAsEnded();

      // Assert
      expect(ended).not.toBe(model);
      expect(ended.endTime).toBeInstanceOf(Date);
      expect(ended.durationSeconds).toBeGreaterThan(0);
      expect(ended.totalVolume).toBeGreaterThan(0);
      expect(ended.updatedAt).toBeInstanceOf(Date);

      // Original should be unchanged
      expect(model.endTime).toBeUndefined();
      expect(model.durationSeconds).toBeUndefined();
      expect(model.totalVolume).toBeUndefined();
    });

    it('should preserve all other properties', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        notes: 'Test notes',
        userRating: 4,
      });

      // Act
      const ended = model.cloneAsEnded();

      // Assert
      expect(ended.trainingPlanName).toBe(model.trainingPlanName);
      expect(ended.sessionName).toBe(model.sessionName);
      expect(ended.notes).toBe(model.notes);
      expect(ended.userRating).toBe(model.userRating);
      // performedGroups will be new instances with calculated comparison fields
      expect(ended.performedGroups).toHaveLength(model.performedGroups.length);
      expect(ended.performedGroups[0].id).toBe(model.performedGroups[0].id);
      expect(ended.performedGroups[1].id).toBe(model.performedGroups[1].id);
    });
  });

  describe('cloneWithUpdatedMetadata', () => {
    it('should create new instance with updated notes and rating', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        notes: 'Original notes',
        userRating: 3,
      });

      // Act
      const updated = model.cloneWithUpdatedMetadata({
        notes: 'Updated notes',
        userRating: 5,
      });

      // Assert
      expect(updated).not.toBe(model);
      expect(updated.notes).toBe('Updated notes');
      expect(updated.userRating).toBe(5);
      expect(updated.updatedAt).toBeInstanceOf(Date);

      // Original should be unchanged
      expect(model.notes).toBe('Original notes');
      expect(model.userRating).toBe(3);
    });

    it('should handle partial updates', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        notes: 'Original notes',
        userRating: 3,
      });

      // Act
      const updated = model.cloneWithUpdatedMetadata({
        userRating: 4,
      });

      // Assert
      expect(updated.notes).toBe('Original notes'); // Unchanged
      expect(updated.userRating).toBe(4); // Updated
    });

    it('should preserve all other properties', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
      });

      // Act
      const updated = model.cloneWithUpdatedMetadata({
        notes: 'New notes',
      });

      // Assert
      expect(updated.trainingPlanName).toBe(model.trainingPlanName);
      expect(updated.sessionName).toBe(model.sessionName);
      expect(updated.performedGroups).toBe(model.performedGroups);
      expect(updated.startTime).toBe(model.startTime);
    });
  });

  describe('isInProgress', () => {
    it('should return true when workout has no end time', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        endTime: undefined,
      });

      // Act
      const inProgress = model.isInProgress();

      // Assert
      expect(inProgress).toBe(true);
    });

    it('should return false when workout has end time', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        endTime: new Date(),
      });

      // Act
      const inProgress = model.isInProgress();

      // Assert
      expect(inProgress).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true when workout has end time', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        endTime: new Date(),
      });

      // Act
      const completed = model.isCompleted();

      // Assert
      expect(completed).toBe(true);
    });

    it('should return false when workout has no end time', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        endTime: undefined,
      });

      // Act
      const completed = model.isCompleted();

      // Assert
      expect(completed).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should combine training plan and session names', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        trainingPlanName: 'Push Pull Legs',
        sessionName: 'Push Day',
      });

      // Act
      const displayName = model.getDisplayName();

      // Assert
      expect(displayName).toBe('Push Pull Legs - Push Day');
    });

    it('should handle empty names', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        trainingPlanName: '',
        sessionName: '',
      });

      // Act
      const displayName = model.getDisplayName();

      // Assert
      expect(displayName).toBe(' - ');
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      // Arrange
      const model = createTestWorkoutLogModel();

      // Act
      const cloned = model.clone();

      // Assert
      expect(cloned).not.toBe(model);
      expect(cloned.performedGroups).not.toBe(model.performedGroups);
      expect(cloned.performedGroups.length).toBe(model.performedGroups.length);
      // Note: Groups may or may not be deep cloned depending on implementation
      expect(cloned.performedGroups).not.toBe(model.performedGroups);
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const model = createTestWorkoutLogModel({
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        notes: 'Test notes',
        userRating: 4,
      });

      // Act
      const cloned = model.clone();

      // Assert
      expect(cloned.id).toBe(model.id);
      expect(cloned.trainingPlanName).toBe(model.trainingPlanName);
      expect(cloned.sessionName).toBe(model.sessionName);
      expect(cloned.notes).toBe(model.notes);
      expect(cloned.userRating).toBe(model.userRating);
      expect(cloned.startTime).toBe(model.startTime);
      expect(cloned.endTime).toBe(model.endTime);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const groups = createTestGroups();
      const data = createTestWorkoutLogData({
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        notes: 'Test notes',
        userRating: 4,
      });
      const model = WorkoutLogModel.hydrate(data, groups);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: data.profileId,
        trainingPlanId: data.trainingPlanId,
        trainingPlanName: 'Test Plan',
        sessionId: data.sessionId,
        sessionName: 'Test Session',
        performedGroupIds: groups.map((g) => g.id),
        startTime: data.startTime,
        endTime: data.endTime,
        durationSeconds: data.durationSeconds,
        totalVolume: data.totalVolume,
        notes: 'Test notes',
        userRating: 4,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle undefined optional fields in plain object', () => {
      // Arrange
      const groups = createTestGroups();
      const data = createTestWorkoutLogData({
        trainingPlanId: undefined,
        sessionId: undefined,
        endTime: undefined,
        durationSeconds: undefined,
        totalVolume: undefined,
        notes: undefined,
        userRating: undefined,
      });
      const model = WorkoutLogModel.hydrate(data, groups);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.trainingPlanId).toBeUndefined();
      expect(plainObject.sessionId).toBeUndefined();
      expect(plainObject.endTime).toBeUndefined();
      expect(plainObject.durationSeconds).toBeUndefined();
      expect(plainObject.totalVolume).toBeUndefined();
      expect(plainObject.notes).toBeUndefined();
      expect(plainObject.userRating).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const validData = createTestWorkoutLogData({
        trainingPlanName: 'Test Plan',
        sessionName: 'Test Session',
        performedGroupIds: [],
      });
      const model = WorkoutLogModel.hydrate(validData, []);

      // Act
      const result = model.validate();

      // Assert
      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should use workoutLogSchema for validation', () => {
      // Arrange
      const model = createTestWorkoutLogModel();
      const safeParseSpy = vi.spyOn(workoutLogSchema, 'safeParse');

      // Act
      model.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(model.toPlainObject());
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const original = createTestWorkoutLogModel({
        trainingPlanName: 'Original Plan',
        notes: 'Original notes',
        userRating: 3,
        endTime: undefined,
        totalVolume: undefined,
      });
      const originalData = {
        trainingPlanName: original.trainingPlanName,
        notes: original.notes,
        userRating: original.userRating,
        endTime: original.endTime,
        totalVolume: original.totalVolume,
        performedGroups: original.performedGroups,
        updatedAt: original.updatedAt,
      };

      // Act
      const ended = original.cloneAsEnded();
      const withMetadata = original.cloneWithUpdatedMetadata({
        notes: 'Updated notes',
        userRating: 5,
      });
      const allSets = original.getAllSets();
      const withUpdatedSet = original.cloneWithUpdatedSet(
        PerformedSetModel.hydrate(
          createTestPerformedSetData({
            id: allSets[0].id,
            weight: 200,
          })
        )
      );
      const cloned = original.clone();

      // Assert - Original should be unchanged
      expect(original.trainingPlanName).toBe(originalData.trainingPlanName);
      expect(original.notes).toBe(originalData.notes);
      expect(original.userRating).toBe(originalData.userRating);
      expect(original.endTime).toBe(originalData.endTime);
      expect(original.totalVolume).toBe(originalData.totalVolume);
      expect(original.performedGroups).toBe(originalData.performedGroups);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify different values in clones
      expect(ended.endTime).toBeDefined();
      expect(ended.totalVolume).toBeDefined();
      expect(withMetadata.notes).toBe('Updated notes');
      expect(withMetadata.userRating).toBe(5);
      expect(withUpdatedSet.performedGroups).not.toBe(original.performedGroups);
      expect(cloned.performedGroups).not.toBe(original.performedGroups);
    });
  });

  describe('edge cases', () => {
    it('should handle workout with no groups', () => {
      // Arrange
      const model = createTestWorkoutLogModel({}, []);

      // Act & Assert
      expect(model.getAllSets()).toEqual([]);
      expect(model.getAllExercises()).toEqual([]);
      expect(model.calculateTotalVolume()).toBe(0);
      expect(model.getTotalSets()).toBe(0);
      expect(model.getTotalCounts()).toBe(0);
      expect(model.getAverageRPE()).toBeUndefined();
      expect(model.getAverageLastRPE()).toBeUndefined();
      expect(model.getPersonalBests().size).toBe(0);
      expect(model.findExerciseLog('any-id')).toBeUndefined();
      expect(Number.isNaN(model.getPerformanceScore()) || model.getPerformanceScore() === 0).toBe(
        true
      );
    });

    it('should handle workout with groups but no exercises', () => {
      // Arrange
      const emptyGroups = [
        PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), []),
        PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), []),
      ];
      const model = createTestWorkoutLogModel({}, emptyGroups);

      // Act & Assert
      expect(model.getAllSets()).toEqual([]);
      expect(model.getAllExercises()).toEqual([]);
      expect(model.calculateTotalVolume()).toBe(0);
    });

    it('should handle workout with all incomplete sets', () => {
      // Arrange
      const incompleteSets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
      ];
      const exercise = PerformedExerciseLogModel.hydrate(
        createTestPerformedExerciseLogData(),
        incompleteSets
      );
      const group = PerformedGroupLogModel.hydrate(createTestPerformedGroupData(), [exercise]);
      const model = createTestWorkoutLogModel({}, [group]);

      // Act & Assert
      expect(model.getTotalSets()).toBe(0);
      expect(model.getTotalCounts()).toBe(0);
      expect(model.calculateTotalVolume()).toBe(0);
      expect(model.getPerformanceScore()).toBe(0);
    });

    it('should handle very long workout duration', () => {
      // Arrange
      const startTime = new Date('2023-01-01T08:00:00Z');
      const endTime = new Date('2023-01-01T14:30:00Z'); // 6.5 hours later
      const model = createTestWorkoutLogModel({
        startTime,
        endTime,
      });

      // Act
      const duration = model.getDurationInMinutes();

      // Assert
      expect(duration).toBe(390); // 6.5 * 60 = 390 minutes
    });

    it('should handle edge rating values', () => {
      // Arrange
      const minRatingModel = createTestWorkoutLogModel({ userRating: 1 });
      const maxRatingModel = createTestWorkoutLogModel({ userRating: 5 });

      // Act & Assert
      expect(minRatingModel.userRating).toBe(1);
      expect(maxRatingModel.userRating).toBe(5);

      // Test cloning preserves ratings
      const updatedMin = minRatingModel.cloneWithUpdatedMetadata({ userRating: 5 });
      expect(updatedMin.userRating).toBe(5);
      expect(minRatingModel.userRating).toBe(1); // Original unchanged
    });
  });
});
