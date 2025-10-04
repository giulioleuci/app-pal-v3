import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestExerciseData, createTestExerciseModel } from '@/test-factories';

import { ExerciseModel } from '../domain/ExerciseModel';
import { ExerciseRepository } from './ExerciseRepository';

describe('ExerciseRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: ExerciseRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new ExerciseRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist an ExerciseModel to the database', async () => {
      // Arrange
      const exerciseModel = createTestExerciseModel();

      // Act
      const result = await repository.save(exerciseModel);

      // Assert
      expect(result).toBe(exerciseModel);

      // Verify data was persisted
      const collection = testDb.get('exercises');
      const savedRecord = await collection.find(exerciseModel.id);
      expect(savedRecord).toBeDefined();
      expect(savedRecord.id).toBe(exerciseModel.id);
      expect(savedRecord._raw.profile_id).toBe(exerciseModel.profileId);
      expect(savedRecord._raw.name).toBe(exerciseModel.name);
      expect(savedRecord._raw.description).toBe(exerciseModel.description);
      expect(savedRecord._raw.category).toBe(exerciseModel.category);
      expect(savedRecord._raw.movement_type).toBe(exerciseModel.movementType);
      expect(savedRecord._raw.difficulty).toBe(exerciseModel.difficulty);
      expect(JSON.parse(savedRecord._raw.equipment || '[]')).toEqual(exerciseModel.equipment);
      expect(JSON.parse(savedRecord._raw.muscle_activation || '{}')).toEqual(
        exerciseModel.muscleActivation
      );
      expect(savedRecord._raw.counter_type).toBe(exerciseModel.counterType);
      expect(savedRecord._raw.joint_type).toBe(exerciseModel.jointType);
      expect(JSON.parse(savedRecord._raw.substitutions || '[]')).toEqual(
        exerciseModel.substitutions
      );
    });

    it('should update existing exercise when saving with same id', async () => {
      // Arrange
      const originalData = createTestExerciseData({ name: 'Original Exercise' });

      // Create original record in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.profile_id = originalData.profileId;
          record._raw.name = originalData.name;
          record._raw.description = originalData.description;
          record._raw.category = originalData.category;
          record._raw.movement_type = originalData.movementType;
          record._raw.movement_pattern = originalData.movementPattern;
          record._raw.difficulty = originalData.difficulty;
          record._raw.equipment = JSON.stringify(originalData.equipment);
          record._raw.muscle_activation = JSON.stringify(originalData.muscleActivation);
          record._raw.counter_type = originalData.counterType;
          record._raw.joint_type = originalData.jointType;
          record._raw.notes = originalData.notes;
          record._raw.substitutions = JSON.stringify(originalData.substitutions);
          record._raw.created_at = originalData.createdAt.getTime();
          record._raw.updated_at = originalData.updatedAt.getTime();
        });
      });

      const updatedModel = ExerciseModel.hydrate({ ...originalData, name: 'Updated Exercise' });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('exercises');
      const savedRecord = await collection.find(originalData.id);
      expect(savedRecord).toBeDefined();
      expect(savedRecord._raw.name).toBe('Updated Exercise');
      expect(savedRecord.id).toBe(originalData.id);
    });
  });

  describe('saveBulk', () => {
    it('should persist multiple ExerciseModels to the database', async () => {
      // Arrange
      const exercise1 = createTestExerciseModel();
      const exercise2 = createTestExerciseModel();
      const exercise3 = createTestExerciseModel();
      const exercises = [exercise1, exercise2, exercise3];

      // Act
      await repository.saveBulk(exercises);

      // Assert
      const collection = testDb.get('exercises');
      for (const exercise of exercises) {
        const savedRecord = await collection.find(exercise.id);
        expect(savedRecord).toBeDefined();
        expect(savedRecord.id).toBe(exercise.id);
        expect(savedRecord._raw.name).toBe(exercise.name);
      }
    });

    it('should handle empty array without error', async () => {
      // Act & Assert
      await expect(repository.saveBulk([])).resolves.not.toThrow();
    });
  });

  describe('findById', () => {
    it('should return an ExerciseModel when exercise exists for the profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData = createTestExerciseData({ profileId });
      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.description = testData.description;
          record._raw.category = testData.category;
          record._raw.movement_type = testData.movementType;
          record._raw.movement_pattern = testData.movementPattern;
          record._raw.difficulty = testData.difficulty;
          record._raw.equipment = JSON.stringify(testData.equipment);
          record._raw.muscle_activation = JSON.stringify(testData.muscleActivation);
          record._raw.counter_type = testData.counterType;
          record._raw.joint_type = testData.jointType;
          record._raw.notes = testData.notes;
          record._raw.substitutions = JSON.stringify(testData.substitutions);
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt;
        });
      });

      // Act
      const result = await repository.findById(profileId, testData.id);

      // Assert
      expect(result).toBeInstanceOf(ExerciseModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(profileId);
      expect(result!.name).toBe(testData.name);
      expect(result!.description).toBe(testData.description);
      expect(result!.category).toBe(testData.category);
      expect(result!.movementType).toBe(testData.movementType);
      expect(result!.difficulty).toBe(testData.difficulty);
      expect(result!.equipment).toEqual(testData.equipment);
      expect(result!.muscleActivation).toEqual(testData.muscleActivation);
      expect(result!.counterType).toBe(testData.counterType);
      expect(result!.jointType).toBe(testData.jointType);
      expect(result!.substitutions).toEqual(testData.substitutions);
    });

    it('should return undefined when exercise does not exist', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(profileId, nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when exercise exists but belongs to different profile', async () => {
      // Arrange
      const profileId1 = 'profile-1';
      const profileId2 = 'profile-2';
      const testData = createTestExerciseData({ profileId: profileId1 });
      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.description = testData.description;
          record._raw.category = testData.category;
          record._raw.movement_type = testData.movementType;
          record._raw.movement_pattern = testData.movementPattern;
          record._raw.difficulty = testData.difficulty;
          record._raw.equipment = JSON.stringify(testData.equipment);
          record._raw.muscle_activation = JSON.stringify(testData.muscleActivation);
          record._raw.counter_type = testData.counterType;
          record._raw.joint_type = testData.jointType;
          record._raw.notes = testData.notes;
          record._raw.substitutions = JSON.stringify(testData.substitutions);
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt;
        });
      });

      // Act
      const result = await repository.findById(profileId2, testData.id);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findByIds', () => {
    it('should return array of ExerciseModels for existing exercises belonging to profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData1 = createTestExerciseData({ profileId });
      const testData2 = createTestExerciseData({ profileId });
      const testData3 = createTestExerciseData(); // Different profile

      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await testDb.batch(
          collection.prepareCreate((record) => {
            record._raw.id = testData1.id;
            record._raw.profile_id = testData1.profileId;
            record._raw.name = testData1.name;
            record._raw.description = testData1.description;
            record._raw.category = testData1.category;
            record._raw.movement_type = testData1.movementType;
            record._raw.movement_pattern = testData1.movementPattern;
            record._raw.difficulty = testData1.difficulty;
            record._raw.equipment = JSON.stringify(testData1.equipment);
            record._raw.muscle_activation = JSON.stringify(testData1.muscleActivation);
            record._raw.counter_type = testData1.counterType;
            record._raw.joint_type = testData1.jointType;
            record._raw.notes = testData1.notes;
            record._raw.substitutions = JSON.stringify(testData1.substitutions);
            record._raw.created_at = testData1.createdAt;
            record._raw.updated_at = testData1.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData2.id;
            record._raw.profile_id = testData2.profileId;
            record._raw.name = testData2.name;
            record._raw.description = testData2.description;
            record._raw.category = testData2.category;
            record._raw.movement_type = testData2.movementType;
            record._raw.movement_pattern = testData2.movementPattern;
            record._raw.difficulty = testData2.difficulty;
            record._raw.equipment = JSON.stringify(testData2.equipment);
            record._raw.muscle_activation = JSON.stringify(testData2.muscleActivation);
            record._raw.counter_type = testData2.counterType;
            record._raw.joint_type = testData2.jointType;
            record._raw.notes = testData2.notes;
            record._raw.substitutions = JSON.stringify(testData2.substitutions);
            record._raw.created_at = testData2.createdAt;
            record._raw.updated_at = testData2.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData3.id;
            record._raw.profile_id = testData3.profileId;
            record._raw.name = testData3.name;
            record._raw.description = testData3.description;
            record._raw.category = testData3.category;
            record._raw.movement_type = testData3.movementType;
            record._raw.movement_pattern = testData3.movementPattern;
            record._raw.difficulty = testData3.difficulty;
            record._raw.equipment = JSON.stringify(testData3.equipment);
            record._raw.muscle_activation = JSON.stringify(testData3.muscleActivation);
            record._raw.counter_type = testData3.counterType;
            record._raw.joint_type = testData3.jointType;
            record._raw.notes = testData3.notes;
            record._raw.substitutions = JSON.stringify(testData3.substitutions);
            record._raw.created_at = testData3.createdAt;
            record._raw.updated_at = testData3.updatedAt;
          })
        );
      });

      // Act
      const result = await repository.findByIds(profileId, [
        testData1.id,
        testData2.id,
        testData3.id,
      ]);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((exercise) => {
        expect(exercise).toBeInstanceOf(ExerciseModel);
        expect(exercise.profileId).toBe(profileId);
      });
      expect(result.map((e) => e.id)).toContain(testData1.id);
      expect(result.map((e) => e.id)).toContain(testData2.id);
      expect(result.map((e) => e.id)).not.toContain(testData3.id);
    });

    it('should filter out undefined results for non-existent exercises', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData = createTestExerciseData({ profileId });
      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.description = testData.description;
          record._raw.category = testData.category;
          record._raw.movement_type = testData.movementType;
          record._raw.movement_pattern = testData.movementPattern;
          record._raw.difficulty = testData.difficulty;
          record._raw.equipment = JSON.stringify(testData.equipment);
          record._raw.muscle_activation = JSON.stringify(testData.muscleActivation);
          record._raw.counter_type = testData.counterType;
          record._raw.joint_type = testData.jointType;
          record._raw.notes = testData.notes;
          record._raw.substitutions = JSON.stringify(testData.substitutions);
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt;
        });
      });
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findByIds(profileId, [testData.id, nonExistentId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ExerciseModel);
      expect(result[0].id).toBe(testData.id);
    });

    it('should return empty array when no exercises exist', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const nonExistentIds = ['id1', 'id2'];

      // Act
      const result = await repository.findByIds(profileId, nonExistentIds);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all exercises for a profile as ExerciseModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData1 = createTestExerciseData({ profileId });
      const testData2 = createTestExerciseData({ profileId });
      const testData3 = createTestExerciseData({ profileId });
      const otherProfileData = createTestExerciseData(); // Different profile

      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await testDb.batch(
          collection.prepareCreate((record) => {
            record._raw.id = testData1.id;
            record._raw.profile_id = testData1.profileId;
            record._raw.name = testData1.name;
            record._raw.description = testData1.description;
            record._raw.category = testData1.category;
            record._raw.movement_type = testData1.movementType;
            record._raw.movement_pattern = testData1.movementPattern;
            record._raw.difficulty = testData1.difficulty;
            record._raw.equipment = JSON.stringify(testData1.equipment);
            record._raw.muscle_activation = JSON.stringify(testData1.muscleActivation);
            record._raw.counter_type = testData1.counterType;
            record._raw.joint_type = testData1.jointType;
            record._raw.notes = testData1.notes;
            record._raw.substitutions = JSON.stringify(testData1.substitutions);
            record._raw.created_at = testData1.createdAt;
            record._raw.updated_at = testData1.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData2.id;
            record._raw.profile_id = testData2.profileId;
            record._raw.name = testData2.name;
            record._raw.description = testData2.description;
            record._raw.category = testData2.category;
            record._raw.movement_type = testData2.movementType;
            record._raw.movement_pattern = testData2.movementPattern;
            record._raw.difficulty = testData2.difficulty;
            record._raw.equipment = JSON.stringify(testData2.equipment);
            record._raw.muscle_activation = JSON.stringify(testData2.muscleActivation);
            record._raw.counter_type = testData2.counterType;
            record._raw.joint_type = testData2.jointType;
            record._raw.notes = testData2.notes;
            record._raw.substitutions = JSON.stringify(testData2.substitutions);
            record._raw.created_at = testData2.createdAt;
            record._raw.updated_at = testData2.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = testData3.id;
            record._raw.profile_id = testData3.profileId;
            record._raw.name = testData3.name;
            record._raw.description = testData3.description;
            record._raw.category = testData3.category;
            record._raw.movement_type = testData3.movementType;
            record._raw.movement_pattern = testData3.movementPattern;
            record._raw.difficulty = testData3.difficulty;
            record._raw.equipment = JSON.stringify(testData3.equipment);
            record._raw.muscle_activation = JSON.stringify(testData3.muscleActivation);
            record._raw.counter_type = testData3.counterType;
            record._raw.joint_type = testData3.jointType;
            record._raw.notes = testData3.notes;
            record._raw.substitutions = JSON.stringify(testData3.substitutions);
            record._raw.created_at = testData3.createdAt;
            record._raw.updated_at = testData3.updatedAt;
          }),
          collection.prepareCreate((record) => {
            record._raw.id = otherProfileData.id;
            record._raw.profile_id = otherProfileData.profileId;
            record._raw.name = otherProfileData.name;
            record._raw.description = otherProfileData.description;
            record._raw.category = otherProfileData.category;
            record._raw.movement_type = otherProfileData.movementType;
            record._raw.movement_pattern = otherProfileData.movementPattern;
            record._raw.difficulty = otherProfileData.difficulty;
            record._raw.equipment = JSON.stringify(otherProfileData.equipment);
            record._raw.muscle_activation = JSON.stringify(otherProfileData.muscleActivation);
            record._raw.counter_type = otherProfileData.counterType;
            record._raw.joint_type = otherProfileData.jointType;
            record._raw.notes = otherProfileData.notes;
            record._raw.substitutions = JSON.stringify(otherProfileData.substitutions);
            record._raw.created_at = otherProfileData.createdAt;
            record._raw.updated_at = otherProfileData.updatedAt;
          })
        );
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((exercise) => {
        expect(exercise).toBeInstanceOf(ExerciseModel);
        expect(exercise.profileId).toBe(profileId);
      });
      expect(result.map((e) => e.id)).toContain(testData1.id);
      expect(result.map((e) => e.id)).toContain(testData2.id);
      expect(result.map((e) => e.id)).toContain(testData3.id);
      expect(result.map((e) => e.id)).not.toContain(otherProfileData.id);
    });

    it('should return empty array when no exercises exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete exercise by profileId and id', async () => {
      // Arrange
      const testData = createTestExerciseData();
      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.description = testData.description;
          record._raw.category = testData.category;
          record._raw.movement_type = testData.movementType;
          record._raw.movement_pattern = testData.movementPattern;
          record._raw.difficulty = testData.difficulty;
          record._raw.equipment = JSON.stringify(testData.equipment);
          record._raw.muscle_activation = JSON.stringify(testData.muscleActivation);
          record._raw.counter_type = testData.counterType;
          record._raw.joint_type = testData.jointType;
          record._raw.notes = testData.notes;
          record._raw.substitutions = JSON.stringify(testData.substitutions);
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt;
        });
      });

      // Verify exercise exists before deletion
      const collection = testDb.get('exercises');
      const exerciseExists = await collection.find(testData.id);
      expect(exerciseExists).toBeDefined();

      // Act
      await repository.delete(testData.profileId, testData.id);

      // Assert
      try {
        await collection.find(testData.id);
        expect.fail('Should have thrown error for deleted record');
      } catch (_error) {
        // Expected - record should not exist
        expect(_error).toBeDefined();
      }
    });

    it('should not delete exercise that belongs to different profile', async () => {
      // Arrange
      const correctProfileId = 'correct-profile';
      const wrongProfileId = 'wrong-profile';
      const testData = createTestExerciseData({ profileId: correctProfileId });
      await testDb.write(async () => {
        const collection = testDb.get('exercises');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.name = testData.name;
          record._raw.description = testData.description;
          record._raw.category = testData.category;
          record._raw.movement_type = testData.movementType;
          record._raw.movement_pattern = testData.movementPattern;
          record._raw.difficulty = testData.difficulty;
          record._raw.equipment = JSON.stringify(testData.equipment);
          record._raw.muscle_activation = JSON.stringify(testData.muscleActivation);
          record._raw.counter_type = testData.counterType;
          record._raw.joint_type = testData.jointType;
          record._raw.notes = testData.notes;
          record._raw.substitutions = JSON.stringify(testData.substitutions);
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt;
        });
      });

      // Act
      await repository.delete(wrongProfileId, testData.id);

      // Assert - Exercise should still exist since profile doesn't match
      const collection = testDb.get('exercises');
      const existingExercise = await collection.find(testData.id);
      expect(existingExercise).toBeDefined();
      expect(existingExercise.id).toBe(testData.id);
    });

    it('should not throw error when deleting non-existent exercise', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(profileId, nonExistentId)).resolves.not.toThrow();
    });
  });
});
