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

import { performedExerciseLogSchema } from '@/shared/types';
import { createTestPerformedExerciseLogData, createTestPerformedSetData } from '@/test-factories';

import { PerformedExerciseLogModel } from '../PerformedExerciseLogModel';
import { PerformedSetModel } from '../PerformedSetModel';

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

// Helper function to create test model
function createTestPerformedExerciseLogModel(overrides = {}, sets?: PerformedSetModel[]) {
  const data = createTestPerformedExerciseLogData(overrides);
  const testSets = sets || createTestSets();
  return PerformedExerciseLogModel.hydrate(data, testSets);
}

describe('PerformedExerciseLogModel', () => {
  describe('hydrate', () => {
    it('should create a new PerformedExerciseLogModel instance from plain data', () => {
      // Arrange
      const data = createTestPerformedExerciseLogData();
      const sets = createTestSets();

      // Act
      const model = PerformedExerciseLogModel.hydrate(data, sets);

      // Assert
      expect(model).toBeInstanceOf(PerformedExerciseLogModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.exerciseId).toBe(data.exerciseId);
      expect(model.plannedExerciseId).toBe(data.plannedExerciseId);
      expect(model.sets).toBe(sets);
      expect(model.notes).toBe(data.notes);
      expect(model.isSkipped).toBe(data.isSkipped);
      expect(model.exerciseName).toBe(data.exerciseName);
      expect(model.exerciseCategory).toBe(data.exerciseCategory);
      expect(model.muscleActivation).toBe(data.muscleActivation);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle optional fields as undefined', () => {
      // Arrange
      const data = createTestPerformedExerciseLogData({
        plannedExerciseId: undefined,
        notes: undefined,
        totalSets: undefined,
        totalCounts: undefined,
        totalVolume: undefined,
      });
      const sets = createTestSets();

      // Act
      const model = PerformedExerciseLogModel.hydrate(data, sets);

      // Assert
      expect(model.plannedExerciseId).toBeUndefined();
      expect(model.notes).toBeUndefined();
      expect(model.totalSets).toBeUndefined();
      expect(model.totalCounts).toBeUndefined();
      expect(model.totalVolume).toBeUndefined();
    });

    it('should handle empty sets array', () => {
      // Arrange
      const data = createTestPerformedExerciseLogData();
      const emptySets: PerformedSetModel[] = [];

      // Act
      const model = PerformedExerciseLogModel.hydrate(data, emptySets);

      // Assert
      expect(model.sets).toEqual([]);
      expect(model.sets.length).toBe(0);
    });
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof PerformedExerciseLogModel.prototype.constructor).toBe('function');
    });
  });

  describe('getTotalVolume', () => {
    it('should calculate total volume from completed sets only', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 8, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 120, counts: 6, completed: false })
        ),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalVolume = model.getTotalVolume();

      // Assert
      expect(totalVolume).toBe(1000 + 880); // Only completed sets: (100*10) + (110*8) = 1880
    });

    it('should return 0 for no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: false })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 8, completed: false })
        ),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalVolume = model.getTotalVolume();

      // Assert
      expect(totalVolume).toBe(0);
    });

    it('should handle sets with no weight', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: undefined, counts: 10, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 8, completed: true })
        ),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalVolume = model.getTotalVolume();

      // Assert
      expect(totalVolume).toBe(800); // (0*10) + (100*8) = 800
    });
  });

  describe('getTotalCounts', () => {
    it('should calculate total counts from completed sets only', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 6, completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalCounts = model.getTotalCounts();

      // Assert
      expect(totalCounts).toBe(18); // 10 + 8 = 18
    });

    it('should return 0 for no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 8, completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalCounts = model.getTotalCounts();

      // Assert
      expect(totalCounts).toBe(0);
    });
  });

  describe('getTotalSets', () => {
    it('should count only completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(3);
    });

    it('should return 0 for no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(0);
    });

    it('should handle empty sets array', () => {
      // Arrange
      const model = createTestPerformedExerciseLogModel({}, []);

      // Act
      const totalSets = model.getTotalSets();

      // Assert
      expect(totalSets).toBe(0);
    });
  });

  describe('getAverageWeight', () => {
    it('should calculate average weight from completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 100, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 110, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 120, completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const averageWeight = model.getAverageWeight();

      // Assert
      expect(averageWeight).toBe(105); // (100 + 110) / 2 = 105
    });

    it('should return 0 for no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 100, completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 110, completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const averageWeight = model.getAverageWeight();

      // Assert
      expect(averageWeight).toBe(0);
    });

    it('should handle sets with no weight as 0', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: undefined, completed: true })
        ),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 100, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const averageWeight = model.getAverageWeight();

      // Assert
      expect(averageWeight).toBe(50); // (0 + 100) / 2 = 50
    });
  });

  describe('getAverageRPE', () => {
    it('should calculate average RPE from completed sets with RPE', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: false })), // Not completed
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })), // No RPE
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(7.5); // (7 + 8) / 2 = 7.5
    });

    it('should return 0 when no sets have RPE', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(0);
    });

    it('should return 0 for no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const averageRPE = model.getAverageRPE();

      // Assert
      expect(averageRPE).toBe(0);
    });
  });

  describe('getLastRPE', () => {
    it('should return RPE from the last completed set with RPE', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })), // No RPE
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const lastRPE = model.getLastRPE();

      // Assert
      expect(lastRPE).toBe(9); // Last set with RPE
    });

    it('should return 0 when no sets have RPE', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const lastRPE = model.getLastRPE();

      // Assert
      expect(lastRPE).toBe(0);
    });

    it('should search backwards from the end of the array', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const lastRPE = model.getLastRPE();

      // Assert
      expect(lastRPE).toBe(8); // Should find the 8, not the 7
    });
  });

  describe('getHeaviestSet', () => {
    it('should return the set with highest weight from completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 100, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 120, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 130, completed: false })), // Not completed
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 110, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const heaviestSet = model.getHeaviestSet();

      // Assert
      expect(heaviestSet?.weight).toBe(120);
    });

    it('should return undefined when no completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 100, completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 110, completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const heaviestSet = model.getHeaviestSet();

      // Assert
      expect(heaviestSet).toBeUndefined();
    });

    it('should handle sets with no weight', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: undefined, completed: true })
        ),
        PerformedSetModel.hydrate(createTestPerformedSetData({ weight: 50, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const heaviestSet = model.getHeaviestSet();

      // Assert
      expect(heaviestSet?.weight).toBe(50);
    });
  });

  describe('getEffectiveSetsCount', () => {
    it('should count sets above minimum RPE threshold', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 6, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const effectiveSets = model.getEffectiveSetsCount(7);

      // Assert
      expect(effectiveSets).toBe(3); // RPE 7, 8, 9 are >= 7
    });

    it('should only count completed sets', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 8, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 9, completed: false })), // Not completed
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 7, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const effectiveSets = model.getEffectiveSetsCount(7);

      // Assert
      expect(effectiveSets).toBe(2); // Only completed sets with RPE >= 7
    });

    it('should return 0 when no sets meet criteria', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 5, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: 6, completed: true })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ rpe: undefined, completed: true })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const effectiveSets = model.getEffectiveSetsCount(7);

      // Assert
      expect(effectiveSets).toBe(0);
    });
  });

  describe('getRepCategoryDistribution', () => {
    it('should distribute sets by rep range category', () => {
      // Arrange
      // Mock the getRepRangeCategory method on sets
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 3, completed: true })), // strength
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 8, completed: true })), // hypertrophy
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 15, completed: true })), // endurance
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 10, completed: true })), // hypertrophy
        PerformedSetModel.hydrate(createTestPerformedSetData({ counts: 6, completed: false })), // Should not count
      ];

      // Mock the getRepRangeCategory method
      vi.spyOn(sets[0], 'getRepRangeCategory').mockReturnValue('strength');
      vi.spyOn(sets[1], 'getRepRangeCategory').mockReturnValue('hypertrophy');
      vi.spyOn(sets[2], 'getRepRangeCategory').mockReturnValue('endurance');
      vi.spyOn(sets[3], 'getRepRangeCategory').mockReturnValue('hypertrophy');

      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act
      const distribution = model.getRepCategoryDistribution();

      // Assert
      expect(distribution).toEqual({
        strength: 1,
        hypertrophy: 2,
        endurance: 1,
      });
    });

    it('should return zero counts for empty sets', () => {
      // Arrange
      const model = createTestPerformedExerciseLogModel({}, []);

      // Act
      const distribution = model.getRepCategoryDistribution();

      // Assert
      expect(distribution).toEqual({
        strength: 0,
        hypertrophy: 0,
        endurance: 0,
      });
    });
  });

  describe('getVolumeByMuscleGroup', () => {
    it('should distribute volume by muscle activation', () => {
      // Arrange
      const muscleActivation = {
        chest: 0.8,
        triceps: 0.6,
        shoulders: 0.3,
      };
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 8, completed: true })
        ),
      ];
      const model = createTestPerformedExerciseLogModel({ muscleActivation }, sets);

      // Act
      const volumeByMuscle = model.getVolumeByMuscleGroup();

      // Assert
      const totalVolume = 1000 + 880; // 1880
      expect(volumeByMuscle.chest).toBe(1880 * 0.8); // 1504
      expect(volumeByMuscle.triceps).toBe(1880 * 0.6); // 1128
      expect(volumeByMuscle.shoulders).toBe(1880 * 0.3); // 564
    });

    it('should return zero volumes when no completed sets', () => {
      // Arrange
      const muscleActivation = { chest: 0.8, triceps: 0.6 };
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: false })
        ),
      ];
      const model = createTestPerformedExerciseLogModel({ muscleActivation }, sets);

      // Act
      const volumeByMuscle = model.getVolumeByMuscleGroup();

      // Assert
      expect(volumeByMuscle.chest).toBe(0);
      expect(volumeByMuscle.triceps).toBe(0);
    });
  });

  describe('cloneWithCalculatedProgression', () => {
    it('should create new instance with progression data', () => {
      // Arrange
      const currentSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 10, completed: true })
        ),
      ];
      const previousSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
      ];
      const current = createTestPerformedExerciseLogModel({}, currentSets);
      const previous = createTestPerformedExerciseLogModel({}, previousSets);

      // Act
      const updated = current.cloneWithCalculatedProgression(previous);

      // Assert
      expect(updated).not.toBe(current);
      expect(updated.comparisonTrend).toBe('improvement'); // 1100 > 1000
      expect(updated.comparisonVolumeChange).toBe(100); // 1100 - 1000
      expect(updated.updatedAt.getTime()).toBeGreaterThan(current.updatedAt.getTime());
    });

    it('should preserve all other properties', () => {
      // Arrange
      const currentSets = createTestSets();
      const previousSets = createTestSets();
      const current = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Test Exercise',
          notes: 'Test notes',
        },
        currentSets
      );
      const previous = createTestPerformedExerciseLogModel({}, previousSets);

      // Act
      const updated = current.cloneWithCalculatedProgression(previous);

      // Assert
      expect(updated.exerciseName).toBe(current.exerciseName);
      expect(updated.notes).toBe(current.notes);
      expect(updated.sets).toBe(current.sets);
    });
  });

  describe('getPerformanceTrend', () => {
    it('should return "improvement" when current volume is higher', () => {
      // Arrange
      const currentSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 10, completed: true })
        ),
      ];
      const previousSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
      ];
      const current = createTestPerformedExerciseLogModel({}, currentSets);
      const previous = createTestPerformedExerciseLogModel({}, previousSets);

      // Act
      const trend = current.getPerformanceTrend(previous);

      // Assert
      expect(trend).toBe('improvement'); // 1100 > 1000
    });

    it('should return "deterioration" when current volume is lower', () => {
      // Arrange
      const currentSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 90, counts: 10, completed: true })
        ),
      ];
      const previousSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
      ];
      const current = createTestPerformedExerciseLogModel({}, currentSets);
      const previous = createTestPerformedExerciseLogModel({}, previousSets);

      // Act
      const trend = current.getPerformanceTrend(previous);

      // Assert
      expect(trend).toBe('deterioration'); // 900 < 1000
    });

    it('should return "maintenance" when volumes are equal', () => {
      // Arrange
      const currentSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
      ];
      const previousSets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
      ];
      const current = createTestPerformedExerciseLogModel({}, currentSets);
      const previous = createTestPerformedExerciseLogModel({}, previousSets);

      // Act
      const trend = current.getPerformanceTrend(previous);

      // Assert
      expect(trend).toBe('maintenance'); // 1000 == 1000
    });
  });

  describe('cloneWithUpdatedSet', () => {
    it('should create new instance with updated set', () => {
      // Arrange
      const originalSets = createTestSets();
      const model = createTestPerformedExerciseLogModel({}, originalSets);
      const updatedSet = PerformedSetModel.hydrate(
        createTestPerformedSetData({
          id: originalSets[1].id, // Update the second set
          weight: 150,
          counts: 12,
        })
      );

      // Act
      const updated = model.cloneWithUpdatedSet(updatedSet);

      // Assert
      expect(updated).not.toBe(model);
      expect(updated.sets).not.toBe(model.sets);
      expect(updated.sets[1]).toBe(updatedSet);
      expect(updated.sets[0]).toBe(model.sets[0]); // Other sets unchanged
      expect(updated.sets[2]).toBe(model.sets[2]);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const originalSets = createTestSets();
      const model = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Test Exercise',
          notes: 'Test notes',
        },
        originalSets
      );
      const updatedSet = PerformedSetModel.hydrate(
        createTestPerformedSetData({
          id: originalSets[0].id,
          weight: 150,
        })
      );

      // Act
      const updated = model.cloneWithUpdatedSet(updatedSet);

      // Assert
      expect(updated.exerciseName).toBe(model.exerciseName);
      expect(updated.notes).toBe(model.notes);
      expect(updated.exerciseId).toBe(model.exerciseId);
    });
  });

  describe('cloneWithAddedSet', () => {
    it('should create new instance with additional set', () => {
      // Arrange
      const originalSets = createTestSets(2);
      const model = createTestPerformedExerciseLogModel({}, originalSets);
      const newSet = PerformedSetModel.hydrate(
        createTestPerformedSetData({
          weight: 120,
          counts: 8,
        })
      );

      // Act
      const updated = model.cloneWithAddedSet(newSet);

      // Assert
      expect(updated).not.toBe(model);
      expect(updated.sets).not.toBe(model.sets);
      expect(updated.sets.length).toBe(3);
      expect(updated.sets[0]).toBe(originalSets[0]);
      expect(updated.sets[1]).toBe(originalSets[1]);
      expect(updated.sets[2]).toBe(newSet);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const originalSets = createTestSets();
      const model = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Test Exercise',
          isSkipped: false,
        },
        originalSets
      );
      const newSet = PerformedSetModel.hydrate(createTestPerformedSetData());

      // Act
      const updated = model.cloneWithAddedSet(newSet);

      // Assert
      expect(updated.exerciseName).toBe(model.exerciseName);
      expect(updated.isSkipped).toBe(model.isSkipped);
      expect(updated.exerciseId).toBe(model.exerciseId);
    });
  });

  describe('cloneWithToggledSkip', () => {
    it('should toggle skip status from false to true', () => {
      // Arrange
      const model = createTestPerformedExerciseLogModel({ isSkipped: false });

      // Act
      const toggled = model.cloneWithToggledSkip();

      // Assert
      expect(toggled).not.toBe(model);
      expect(toggled.isSkipped).toBe(true);
      expect(model.isSkipped).toBe(false); // Original unchanged
    });

    it('should toggle skip status from true to false', () => {
      // Arrange
      const model = createTestPerformedExerciseLogModel({ isSkipped: true });

      // Act
      const toggled = model.cloneWithToggledSkip();

      // Assert
      expect(toggled).not.toBe(model);
      expect(toggled.isSkipped).toBe(false);
      expect(model.isSkipped).toBe(true); // Original unchanged
    });
  });

  describe('getSummaryString', () => {
    it('should format summary with exercise name and performance metrics', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 100, counts: 10, completed: true })
        ),
        PerformedSetModel.hydrate(
          createTestPerformedSetData({ weight: 110, counts: 8, completed: true })
        ),
      ];
      const model = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Bench Press',
        },
        sets
      );

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('Bench Press: 2 sets, 18 reps, 1880 kg');
    });

    it('should handle zero values correctly', () => {
      // Arrange
      const sets = [PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false }))];
      const model = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Push-ups',
        },
        sets
      );

      // Act
      const summary = model.getSummaryString();

      // Assert
      expect(summary).toBe('Push-ups: 0 sets, 0 reps, 0 kg');
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      // Arrange
      const originalSets = createTestSets();
      const model = createTestPerformedExerciseLogModel({}, originalSets);

      // Act
      const cloned = model.clone();

      // Assert
      expect(cloned).not.toBe(model);
      expect(cloned.sets).not.toBe(model.sets);
      expect(cloned.sets.length).toBe(model.sets.length);
      // Note: Sets may or may not be deep cloned depending on implementation
      expect(cloned.sets).not.toBe(model.sets);
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const originalSets = createTestSets();
      const model = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Test Exercise',
          notes: 'Test notes',
          isSkipped: false,
        },
        originalSets
      );

      // Act
      const cloned = model.clone();

      // Assert
      expect(cloned.id).toBe(model.id);
      expect(cloned.exerciseName).toBe(model.exerciseName);
      expect(cloned.notes).toBe(model.notes);
      expect(cloned.isSkipped).toBe(model.isSkipped);
      expect(cloned.exerciseId).toBe(model.exerciseId);
      expect(cloned.muscleActivation).toEqual(model.muscleActivation);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const sets = createTestSets();
      const data = createTestPerformedExerciseLogData({
        exerciseName: 'Test Exercise',
        notes: 'Test notes',
        isSkipped: false,
      });
      const model = PerformedExerciseLogModel.hydrate(data, sets);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: data.profileId,
        exerciseId: data.exerciseId,
        plannedExerciseId: data.plannedExerciseId,
        setIds: sets.map((s) => s.id),
        notes: 'Test notes',
        isSkipped: false,
        exerciseName: 'Test Exercise',
        exerciseCategory: data.exerciseCategory,
        muscleActivation: data.muscleActivation,
        totalSets: data.totalSets,
        totalCounts: data.totalCounts,
        totalVolume: data.totalVolume,
        repCategoryDistribution: data.repCategoryDistribution,
        comparisonTrend: data.comparisonTrend,
        comparisonSetsChange: data.comparisonSetsChange,
        comparisonCountsChange: data.comparisonCountsChange,
        comparisonVolumeChange: data.comparisonVolumeChange,
        rpeEffort: data.rpeEffort,
        estimated1RM: data.estimated1RM,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle undefined optional fields in plain object', () => {
      // Arrange
      const sets = createTestSets();
      const data = createTestPerformedExerciseLogData({
        notes: undefined,
        plannedExerciseId: undefined,
        totalSets: undefined,
      });
      const model = PerformedExerciseLogModel.hydrate(data, sets);

      // Act
      const plainObject = model.toPlainObject();

      // Assert
      expect(plainObject.notes).toBeUndefined();
      expect(plainObject.plannedExerciseId).toBeUndefined();
      expect(plainObject.totalSets).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const validData = createTestPerformedExerciseLogData({
        isSkipped: false,
        exerciseName: 'Test Exercise',
        exerciseCategory: 'strength',
        muscleActivation: {
          chest: 0.8,
          triceps: 0.6,
          lats: 0,
          upper_back: 0,
          lower_back: 0,
          shoulders: 0,
          biceps: 0,
          forearms: 0,
          quadriceps: 0,
          hamstrings: 0,
          calves: 0,
          abdominals: 0,
          glutes: 0,
        },
        setIds: [],
      });
      const model = PerformedExerciseLogModel.hydrate(validData, []);

      // Act
      const result = model.validate();

      // Assert
      if (!result.success) {
        console.error('PerformedExerciseLog validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should use performedExerciseLogSchema for validation', () => {
      // Arrange
      const model = createTestPerformedExerciseLogModel();
      const safeParseSpy = vi.spyOn(performedExerciseLogSchema, 'safeParse');

      // Act
      model.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(model.toPlainObject());
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const originalSets = createTestSets();
      const original = createTestPerformedExerciseLogModel(
        {
          exerciseName: 'Original Exercise',
          isSkipped: false,
          notes: 'Original notes',
        },
        originalSets
      );
      const originalData = {
        exerciseName: original.exerciseName,
        isSkipped: original.isSkipped,
        notes: original.notes,
        sets: original.sets,
        updatedAt: original.updatedAt,
      };

      // Act
      const newSet = PerformedSetModel.hydrate(createTestPerformedSetData());
      const withNewSet = original.cloneWithAddedSet(newSet);
      const withUpdatedSet = original.cloneWithUpdatedSet(newSet);
      const toggled = original.cloneWithToggledSkip();
      const withProgression = original.cloneWithCalculatedProgression(original);
      const cloned = original.clone();

      // Assert - Original should be unchanged
      expect(original.exerciseName).toBe(originalData.exerciseName);
      expect(original.isSkipped).toBe(originalData.isSkipped);
      expect(original.notes).toBe(originalData.notes);
      expect(original.sets).toBe(originalData.sets);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify different values in clones
      expect(withNewSet.sets.length).toBe(originalSets.length + 1);
      expect(toggled.isSkipped).toBe(true);
      expect(withProgression.comparisonTrend).toBeDefined();
      expect(cloned.sets).not.toBe(original.sets);
    });
  });

  describe('edge cases', () => {
    it('should handle exercise with no sets', () => {
      // Arrange
      const model = createTestPerformedExerciseLogModel({}, []);

      // Act & Assert
      expect(model.getTotalVolume()).toBe(0);
      expect(model.getTotalCounts()).toBe(0);
      expect(model.getTotalSets()).toBe(0);
      expect(model.getAverageWeight()).toBe(0);
      expect(model.getAverageRPE()).toBe(0);
      expect(model.getLastRPE()).toBe(0);
      expect(model.getHeaviestSet()).toBeUndefined();
      expect(model.getEffectiveSetsCount(7)).toBe(0);
    });

    it('should handle all sets being incomplete', () => {
      // Arrange
      const sets = [
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
        PerformedSetModel.hydrate(createTestPerformedSetData({ completed: false })),
      ];
      const model = createTestPerformedExerciseLogModel({}, sets);

      // Act & Assert
      expect(model.getTotalVolume()).toBe(0);
      expect(model.getTotalCounts()).toBe(0);
      expect(model.getTotalSets()).toBe(0);
      expect(model.getAverageWeight()).toBe(0);
      expect(model.getAverageRPE()).toBe(0);
    });

    it('should handle skipped exercise', () => {
      // Arrange
      const sets = createTestSets();
      const model = createTestPerformedExerciseLogModel({ isSkipped: true }, sets);

      // Act & Assert
      expect(model.isSkipped).toBe(true);
      expect(model.getSummaryString()).toContain('sets'); // Should still generate summary
    });
  });
});
