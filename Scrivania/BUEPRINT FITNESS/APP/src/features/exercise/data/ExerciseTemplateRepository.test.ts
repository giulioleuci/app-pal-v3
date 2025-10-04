import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import {
  createTestExerciseData,
  createTestExerciseTemplateData,
  createTestExerciseTemplateModel,
} from '@/test-factories';

import { ExerciseTemplateModel } from '../domain/ExerciseTemplateModel';
import { ExerciseTemplateRepository } from './ExerciseTemplateRepository';

describe('ExerciseTemplateRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: ExerciseTemplateRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new ExerciseTemplateRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist an ExerciseTemplateModel to the database', async () => {
      // Arrange
      const templateModel = createTestExerciseTemplateModel();

      // Act
      const result = await repository.save(templateModel);

      // Assert
      expect(result).toBe(templateModel);

      // Verify data was persisted
      const collection = testDb.get('exercise_templates');
      const savedRecord = await collection.find(templateModel.id);

      expect(savedRecord).toBeDefined();
      expect(savedRecord.id).toBe(templateModel.id);
      expect(savedRecord._raw.name).toBe(templateModel.name);
      expect(savedRecord._raw.exercise_id).toBe(templateModel.exerciseId);
      expect(savedRecord._raw.set_configuration).toEqual(templateModel.setConfiguration);
      expect(savedRecord._raw.notes).toBe(templateModel.notes);
      expect(new Date(savedRecord._raw.created_at)).toEqual(templateModel.createdAt);
      expect(new Date(savedRecord._raw.updated_at)).toEqual(templateModel.updatedAt);
    });

    it('should update existing template when saving with same id', async () => {
      // Arrange
      const originalData = createTestExerciseTemplateData({ name: 'Original Template' });

      // Create the record directly in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('exercise_templates');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.name = originalData.name;
          record._raw.exercise_id = originalData.exerciseId;
          record._raw.set_configuration = originalData.setConfiguration;
          record._raw.notes = originalData.notes;
          record._raw.created_at = originalData.createdAt.getTime();
          record._raw.updated_at = originalData.updatedAt.getTime();
        });
      });

      const updatedModel = ExerciseTemplateModel.hydrate({
        ...originalData,
        name: 'Updated Template',
      });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('exercise_templates');
      const savedRecord = await collection.find(originalData.id);
      expect(savedRecord).toBeDefined();
      expect(savedRecord._raw.name).toBe('Updated Template');
      expect(savedRecord.id).toBe(originalData.id);
    });
  });

  describe('findById', () => {
    it('should return an ExerciseTemplateModel when template exists', async () => {
      // Arrange
      const testData = createTestExerciseTemplateData();

      // Create the record directly in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('exercise_templates');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.name = testData.name;
          record._raw.exercise_id = testData.exerciseId;
          record._raw.set_configuration = testData.setConfiguration;
          record._raw.notes = testData.notes;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findById(testData.id);

      // Assert
      expect(result).toBeInstanceOf(ExerciseTemplateModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.name).toBe(testData.name);
      expect(result!.exerciseId).toBe(testData.exerciseId);
      expect(result!.setConfiguration).toEqual(testData.setConfiguration);
      expect(result!.notes).toBe(testData.notes);
      expect(result!.createdAt).toEqual(testData.createdAt);
      expect(result!.updatedAt).toEqual(testData.updatedAt);
    });

    it('should return undefined when template does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all templates for a profile as ExerciseTemplateModels', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const otherProfileId = 'other-profile-id';

      // Create exercises for different profiles
      const exercise1 = createTestExerciseData({ profileId });
      const exercise2 = createTestExerciseData({ profileId });
      const exercise3 = createTestExerciseData({ profileId: otherProfileId });

      const testData1 = createTestExerciseTemplateData({
        exerciseId: exercise1.id,
        name: 'Template 1',
      });
      const testData2 = createTestExerciseTemplateData({
        exerciseId: exercise2.id,
        name: 'Template 2',
      });
      const testData3 = createTestExerciseTemplateData({
        exerciseId: exercise3.id,
        name: 'Other Template',
      });

      await testDb.write(async () => {
        const exerciseCollection = testDb.get('exercises');
        const templateCollection = testDb.get('exercise_templates');

        // Create exercises
        await exerciseCollection.create((record) => {
          record._raw.id = exercise1.id;
          record._raw.profile_id = exercise1.profileId;
          record._raw.name = exercise1.name;
          record._raw.description = exercise1.description;
          record._raw.category = exercise1.category;
          record._raw.movement_type = exercise1.movementType;
          record._raw.movement_pattern = exercise1.movementPattern;
          record._raw.difficulty = exercise1.difficulty;
          record._raw.equipment = JSON.stringify(exercise1.equipment);
          record._raw.muscle_activation = JSON.stringify(exercise1.muscleActivation);
          record._raw.counter_type = exercise1.counterType;
          record._raw.joint_type = exercise1.jointType;
          record._raw.notes = exercise1.notes;
          record._raw.substitutions = JSON.stringify(exercise1.substitutions);
          record._raw.created_at = exercise1.createdAt;
          record._raw.updated_at = exercise1.updatedAt;
        });

        await exerciseCollection.create((record) => {
          record._raw.id = exercise2.id;
          record._raw.profile_id = exercise2.profileId;
          record._raw.name = exercise2.name;
          record._raw.description = exercise2.description;
          record._raw.category = exercise2.category;
          record._raw.movement_type = exercise2.movementType;
          record._raw.movement_pattern = exercise2.movementPattern;
          record._raw.difficulty = exercise2.difficulty;
          record._raw.equipment = JSON.stringify(exercise2.equipment);
          record._raw.muscle_activation = JSON.stringify(exercise2.muscleActivation);
          record._raw.counter_type = exercise2.counterType;
          record._raw.joint_type = exercise2.jointType;
          record._raw.notes = exercise2.notes;
          record._raw.substitutions = JSON.stringify(exercise2.substitutions);
          record._raw.created_at = exercise2.createdAt;
          record._raw.updated_at = exercise2.updatedAt;
        });

        await exerciseCollection.create((record) => {
          record._raw.id = exercise3.id;
          record._raw.profile_id = exercise3.profileId;
          record._raw.name = exercise3.name;
          record._raw.description = exercise3.description;
          record._raw.category = exercise3.category;
          record._raw.movement_type = exercise3.movementType;
          record._raw.movement_pattern = exercise3.movementPattern;
          record._raw.difficulty = exercise3.difficulty;
          record._raw.equipment = JSON.stringify(exercise3.equipment);
          record._raw.muscle_activation = JSON.stringify(exercise3.muscleActivation);
          record._raw.counter_type = exercise3.counterType;
          record._raw.joint_type = exercise3.jointType;
          record._raw.notes = exercise3.notes;
          record._raw.substitutions = JSON.stringify(exercise3.substitutions);
          record._raw.created_at = exercise3.createdAt;
          record._raw.updated_at = exercise3.updatedAt;
        });

        // Create templates
        await templateCollection.create((record) => {
          record._raw.id = testData1.id;
          record._raw.name = testData1.name;
          record._raw.exercise_id = testData1.exerciseId;
          record._raw.set_configuration = testData1.setConfiguration;
          record._raw.notes = testData1.notes;
          record._raw.created_at = testData1.createdAt.getTime();
          record._raw.updated_at = testData1.updatedAt.getTime();
        });

        await templateCollection.create((record) => {
          record._raw.id = testData2.id;
          record._raw.name = testData2.name;
          record._raw.exercise_id = testData2.exerciseId;
          record._raw.set_configuration = testData2.setConfiguration;
          record._raw.notes = testData2.notes;
          record._raw.created_at = testData2.createdAt.getTime();
          record._raw.updated_at = testData2.updatedAt.getTime();
        });

        await templateCollection.create((record) => {
          record._raw.id = testData3.id;
          record._raw.name = testData3.name;
          record._raw.exercise_id = testData3.exerciseId;
          record._raw.set_configuration = testData3.setConfiguration;
          record._raw.notes = testData3.notes;
          record._raw.created_at = testData3.createdAt.getTime();
          record._raw.updated_at = testData3.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((template) => {
        expect(template).toBeInstanceOf(ExerciseTemplateModel);
      });
      expect(result.map((t) => t.name)).toContain('Template 1');
      expect(result.map((t) => t.name)).toContain('Template 2');
      expect(result.map((t) => t.name)).not.toContain('Other Template');
    });

    it('should return empty array when no templates exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when templates exist for other profiles only', async () => {
      // Arrange
      const profileId = 'target-profile-id';
      const otherProfileId = 'other-profile-id';

      // Create exercise for other profile
      const exercise = createTestExerciseData({ profileId: otherProfileId });
      const testData = createTestExerciseTemplateData({ exerciseId: exercise.id });

      await testDb.write(async () => {
        const exerciseCollection = testDb.get('exercises');
        const templateCollection = testDb.get('exercise_templates');

        // Create exercise for other profile
        await exerciseCollection.create((record) => {
          record._raw.id = exercise.id;
          record._raw.profile_id = exercise.profileId;
          record._raw.name = exercise.name;
          record._raw.description = exercise.description;
          record._raw.category = exercise.category;
          record._raw.movement_type = exercise.movementType;
          record._raw.movement_pattern = exercise.movementPattern;
          record._raw.difficulty = exercise.difficulty;
          record._raw.equipment = JSON.stringify(exercise.equipment);
          record._raw.muscle_activation = JSON.stringify(exercise.muscleActivation);
          record._raw.counter_type = exercise.counterType;
          record._raw.joint_type = exercise.jointType;
          record._raw.notes = exercise.notes;
          record._raw.substitutions = JSON.stringify(exercise.substitutions);
          record._raw.created_at = exercise.createdAt;
          record._raw.updated_at = exercise.updatedAt;
        });

        // Create template
        await templateCollection.create((record) => {
          record._raw.id = testData.id;
          record._raw.name = testData.name;
          record._raw.exercise_id = testData.exerciseId;
          record._raw.set_configuration = testData.setConfiguration;
          record._raw.notes = testData.notes;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findAll(profileId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete template by id', async () => {
      // Arrange
      const testData = createTestExerciseTemplateData();

      // Create the record directly in WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('exercise_templates');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.name = testData.name;
          record._raw.exercise_id = testData.exerciseId;
          record._raw.set_configuration = testData.setConfiguration;
          record._raw.notes = testData.notes;
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Verify template exists before deletion
      const collection = testDb.get('exercise_templates');
      const beforeDelete = await collection.find(testData.id);
      expect(beforeDelete).toBeDefined();

      // Act
      await repository.delete(testData.id);

      // Assert - In WatermelonDB, deleted records are marked as deleted, not removed
      const afterDelete = await collection.find(testData.id);
      expect(afterDelete._raw._status).toBe('deleted');
    });

    it('should not throw error when deleting non-existent template', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });
});
