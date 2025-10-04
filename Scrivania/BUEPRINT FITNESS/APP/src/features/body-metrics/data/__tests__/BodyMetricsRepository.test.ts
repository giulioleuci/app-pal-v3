import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { generateId } from '@/lib';
import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestHeightRecordData, createTestWeightRecordData } from '@/test-factories';

import { BodyMetricsRepository } from '../BodyMetricsRepository';

/**
 * Integration tests for BodyMetricsRepository.
 * Tests the complete flow of data persistence, retrieval, and hydration/dehydration
 * between WeightRecordModel and HeightRecordModel domain objects and the database layer.
 */
describe('BodyMetricsRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: BodyMetricsRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new BodyMetricsRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('saveWeight', () => {
    it('should persist a WeightRecordModel to the database', async () => {
      // Arrange
      const weightRecord = WeightRecordModel.hydrate(createTestWeightRecordData());

      // Act
      const result = await repository.saveWeight(weightRecord);

      // Assert
      expect(result).toBe(weightRecord);

      // Verify data was persisted correctly
      const savedData = await testDb.weightRecords.get(weightRecord.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(weightRecord.id);
      expect(savedData!.profileId).toBe(weightRecord.profileId);
      expect(savedData!.date).toEqual(weightRecord.date);
      expect(savedData!.weight).toBe(weightRecord.weight);
      expect(savedData!.notes).toBe(weightRecord.notes);
      expect(savedData!.createdAt).toEqual(weightRecord.createdAt);
      expect(savedData!.updatedAt).toEqual(weightRecord.updatedAt);
    });

    it('should update existing weight record when saving with same id', async () => {
      // Arrange
      const originalData = createTestWeightRecordData({
        weight: 70.5,
        notes: 'Original notes',
      });
      await testDb.write(async () => {
        await testDb.weightRecords.put(originalData);
      });

      const updatedModel = WeightRecordModel.hydrate({
        ...originalData,
        weight: 72.0,
        notes: 'Updated notes',
      });

      // Act
      const result = await repository.saveWeight(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const savedData = await testDb.weightRecords.get(originalData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.weight).toBe(72.0);
      expect(savedData!.notes).toBe('Updated notes');
      expect(savedData!.id).toBe(originalData.id);
    });

    it('should correctly dehydrate complex domain model to plain data', async () => {
      // Arrange
      const weightRecord = WeightRecordModel.hydrate(
        createTestWeightRecordData({
          weight: 75.3,
          notes: 'Post-workout weight',
        })
      );

      // Act
      await repository.saveWeight(weightRecord);

      // Assert
      const savedData = await testDb.weightRecords.get(weightRecord.id);
      expect(savedData).toBeDefined();

      // Verify all model properties are persisted
      expect(savedData!.weight).toBe(75.3);
      expect(savedData!.notes).toBe('Post-workout weight');
      expect(typeof savedData!.weight).toBe('number');
      expect(savedData!.date).toBeInstanceOf(Date);
    });
  });

  describe('saveHeight', () => {
    it('should persist a HeightRecordModel to the database', async () => {
      // Arrange
      const heightRecord = HeightRecordModel.hydrate(createTestHeightRecordData());

      // Act
      const result = await repository.saveHeight(heightRecord);

      // Assert
      expect(result).toBe(heightRecord);

      // Verify data was persisted correctly
      const savedData = await testDb.heightRecords.get(heightRecord.id);
      expect(savedData).toBeDefined();
      expect(savedData!.id).toBe(heightRecord.id);
      expect(savedData!.profileId).toBe(heightRecord.profileId);
      expect(savedData!.date).toEqual(heightRecord.date);
      expect(savedData!.height).toBe(heightRecord.height);
      expect(savedData!.notes).toBe(heightRecord.notes);
      expect(savedData!.createdAt).toEqual(heightRecord.createdAt);
      expect(savedData!.updatedAt).toEqual(heightRecord.updatedAt);
    });

    it('should update existing height record when saving with same id', async () => {
      // Arrange
      const originalData = createTestHeightRecordData({
        height: 175.0,
        notes: 'Morning measurement',
      });
      await testDb.write(async () => {
        await testDb.heightRecords.put(originalData);
      });

      const updatedModel = HeightRecordModel.hydrate({
        ...originalData,
        height: 175.5,
        notes: 'Evening measurement',
      });

      // Act
      const result = await repository.saveHeight(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const savedData = await testDb.heightRecords.get(originalData.id);
      expect(savedData).toBeDefined();
      expect(savedData!.height).toBe(175.5);
      expect(savedData!.notes).toBe('Evening measurement');
      expect(savedData!.id).toBe(originalData.id);
    });

    it('should correctly dehydrate complex domain model to plain data', async () => {
      // Arrange
      const heightRecord = HeightRecordModel.hydrate(
        createTestHeightRecordData({
          height: 180.2,
          notes: 'Growth tracking',
        })
      );

      // Act
      await repository.saveHeight(heightRecord);

      // Assert
      const savedData = await testDb.heightRecords.get(heightRecord.id);
      expect(savedData).toBeDefined();

      // Verify all model properties are persisted
      expect(savedData!.height).toBe(180.2);
      expect(savedData!.notes).toBe('Growth tracking');
      expect(typeof savedData!.height).toBe('number');
      expect(savedData!.date).toBeInstanceOf(Date);
    });
  });

  describe('findWeightHistory', () => {
    it('should return all weight records for a given profile ID ordered by date descending', async () => {
      // Arrange
      const profileId = generateId();
      const otherProfileId = generateId();

      const oldDate = new Date('2023-01-01');
      const recentDate = new Date('2023-06-01');
      const latestDate = new Date('2023-12-01');

      const testData1 = createTestWeightRecordData({ profileId, date: oldDate, weight: 70.0 });
      const testData2 = createTestWeightRecordData({ profileId, date: latestDate, weight: 75.0 });
      const testData3 = createTestWeightRecordData({ profileId, date: recentDate, weight: 72.5 });
      const testData4 = createTestWeightRecordData({
        profileId: otherProfileId,
        date: latestDate,
        weight: 80.0,
      });

      await testDb.write(async () => {
        await testDb.weightRecords.bulkPut([testData1, testData2, testData3, testData4]);
      });

      // Act
      const result = await repository.findWeightHistory(profileId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every((record) => record instanceof WeightRecordModel)).toBe(true);
      expect(result.every((record) => record.profileId === profileId)).toBe(true);

      // Verify correct order (latest first)
      expect(result[0].date).toEqual(latestDate);
      expect(result[0].weight).toBe(75.0);
      expect(result[1].date).toEqual(recentDate);
      expect(result[1].weight).toBe(72.5);
      expect(result[2].date).toEqual(oldDate);
      expect(result[2].weight).toBe(70.0);
    });

    it('should return empty array when no weight records exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = generateId();

      // Act
      const result = await repository.findWeightHistory(nonExistentProfileId);

      // Assert
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should correctly hydrate all returned models with business logic', async () => {
      // Arrange
      const profileId = generateId();
      const testData1 = createTestWeightRecordData({ profileId, weight: 80.5 });
      const testData2 = createTestWeightRecordData({ profileId, weight: 78.2 });

      await testDb.write(async () => {
        await testDb.weightRecords.bulkPut([testData1, testData2]);
      });

      // Act
      const result = await repository.findWeightHistory(profileId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(WeightRecordModel);
      expect(result[1]).toBeInstanceOf(WeightRecordModel);

      // Verify business logic methods work
      expect(result[0].getWeightIn('kg')).toBe(result[0].weight);
      expect(result[0].getWeightIn('lbs')).toBeCloseTo(result[0].weight * 2.20462, 2);
      expect(result[0].isHeavierThan(result[1])).toBe(result[0].weight > result[1].weight);
    });
  });

  describe('findHeightHistory', () => {
    it('should return all height records for a given profile ID ordered by date descending', async () => {
      // Arrange
      const profileId = generateId();
      const otherProfileId = generateId();

      const oldDate = new Date('2022-01-01');
      const recentDate = new Date('2023-01-01');
      const latestDate = new Date('2024-01-01');

      const testData1 = createTestHeightRecordData({ profileId, date: oldDate, height: 175.0 });
      const testData2 = createTestHeightRecordData({ profileId, date: latestDate, height: 177.0 });
      const testData3 = createTestHeightRecordData({ profileId, date: recentDate, height: 176.0 });
      const testData4 = createTestHeightRecordData({
        profileId: otherProfileId,
        date: latestDate,
        height: 180.0,
      });

      await testDb.write(async () => {
        await testDb.heightRecords.bulkPut([testData1, testData2, testData3, testData4]);
      });

      // Act
      const result = await repository.findHeightHistory(profileId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every((record) => record instanceof HeightRecordModel)).toBe(true);
      expect(result.every((record) => record.profileId === profileId)).toBe(true);

      // Verify correct order (latest first)
      expect(result[0].date).toEqual(latestDate);
      expect(result[0].height).toBe(177.0);
      expect(result[1].date).toEqual(recentDate);
      expect(result[1].height).toBe(176.0);
      expect(result[2].date).toEqual(oldDate);
      expect(result[2].height).toBe(175.0);
    });

    it('should return empty array when no height records exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = generateId();

      // Act
      const result = await repository.findHeightHistory(nonExistentProfileId);

      // Assert
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should correctly hydrate all returned models with business logic', async () => {
      // Arrange
      const profileId = generateId();
      const testData1 = createTestHeightRecordData({ profileId, height: 175.5 });
      const testData2 = createTestHeightRecordData({ profileId, height: 180.2 });

      await testDb.write(async () => {
        await testDb.heightRecords.bulkPut([testData1, testData2]);
      });

      // Act
      const result = await repository.findHeightHistory(profileId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(HeightRecordModel);
      expect(result[1]).toBeInstanceOf(HeightRecordModel);

      // Verify business logic methods work
      expect(result[0].getHeightIn('cm')).toBe(result[0].height);
      expect(result[0].getHeightIn('inches')).toBeCloseTo(result[0].height / 2.54, 2);
      expect(result[1].isTallerThan(result[0])).toBe(result[1].height > result[0].height);
    });
  });

  describe('findLatestWeight', () => {
    it('should return the most recent weight record for a profile', async () => {
      // Arrange
      const profileId = generateId();

      const oldDate = new Date('2023-01-01');
      const recentDate = new Date('2023-06-01');
      const latestDate = new Date('2023-12-01');

      const testData1 = createTestWeightRecordData({ profileId, date: oldDate, weight: 70.0 });
      const testData2 = createTestWeightRecordData({ profileId, date: latestDate, weight: 75.0 });
      const testData3 = createTestWeightRecordData({ profileId, date: recentDate, weight: 72.5 });

      await testDb.write(async () => {
        await testDb.weightRecords.bulkPut([testData1, testData2, testData3]);
      });

      // Act
      const result = await repository.findLatestWeight(profileId);

      // Assert
      expect(result).toBeInstanceOf(WeightRecordModel);
      expect(result!.date).toEqual(latestDate);
      expect(result!.weight).toBe(75.0);
      expect(result!.profileId).toBe(profileId);
    });

    it('should return undefined when no weight records exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = generateId();

      // Act
      const result = await repository.findLatestWeight(nonExistentProfileId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return the only weight record when profile has single record', async () => {
      // Arrange
      const profileId = generateId();
      const testData = createTestWeightRecordData({ profileId, weight: 68.5 });
      await testDb.write(async () => {
        await testDb.weightRecords.put(testData);
      });

      // Act
      const result = await repository.findLatestWeight(profileId);

      // Assert
      expect(result).toBeInstanceOf(WeightRecordModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.weight).toBe(68.5);
    });

    it('should correctly filter by profile ID when finding latest', async () => {
      // Arrange
      const profileId1 = generateId();
      const profileId2 = generateId();

      const profile1Record = createTestWeightRecordData({
        profileId: profileId1,
        date: new Date('2023-06-01'),
        weight: 70.0,
      });
      const profile2Record = createTestWeightRecordData({
        profileId: profileId2,
        date: new Date('2023-12-01'),
        weight: 80.0,
      });

      await testDb.write(async () => {
        await testDb.weightRecords.bulkPut([profile1Record, profile2Record]);
      });

      // Act
      const result1 = await repository.findLatestWeight(profileId1);
      const result2 = await repository.findLatestWeight(profileId2);

      // Assert
      expect(result1).toBeInstanceOf(WeightRecordModel);
      expect(result2).toBeInstanceOf(WeightRecordModel);
      expect(result1!.weight).toBe(70.0);
      expect(result2!.weight).toBe(80.0);
    });

    it('should correctly hydrate domain model with business logic', async () => {
      // Arrange
      const profileId = generateId();
      const testData = createTestWeightRecordData({ profileId, weight: 75.5 });
      await testDb.write(async () => {
        await testDb.weightRecords.put(testData);
      });

      // Act
      const result = await repository.findLatestWeight(profileId);

      // Assert
      expect(result).toBeInstanceOf(WeightRecordModel);
      expect(result!.getWeightIn('kg')).toBe(75.5);
      expect(result!.getWeightIn('lbs')).toBeCloseTo(166.45, 2);
      expect(typeof result!.wasRecordedBefore).toBe('function');
    });
  });

  describe('deleteWeight', () => {
    it('should remove weight record from database', async () => {
      // Arrange
      const testData = createTestWeightRecordData();
      await testDb.write(async () => {
        await testDb.weightRecords.put(testData);
      });

      // Verify it exists
      const existsBefore = await testDb.weightRecords.get(testData.id);
      expect(existsBefore).toBeDefined();

      // Act
      await repository.deleteWeight(testData.id);

      // Assert
      const existsAfter = await testDb.weightRecords.get(testData.id);
      expect(existsAfter).toBeUndefined();
    });

    it('should not throw error when deleting non-existent weight record', async () => {
      // Arrange
      const nonExistentId = generateId();

      // Act & Assert - should not throw
      await expect(repository.deleteWeight(nonExistentId)).resolves.toBeUndefined();
    });

    it('should only delete specified weight record', async () => {
      // Arrange
      const testData1 = createTestWeightRecordData();
      const testData2 = createTestWeightRecordData();
      await testDb.write(async () => {
        await testDb.weightRecords.bulkPut([testData1, testData2]);
      });

      // Act
      await repository.deleteWeight(testData1.id);

      // Assert
      const deleted = await testDb.weightRecords.get(testData1.id);
      const remaining = await testDb.weightRecords.get(testData2.id);

      expect(deleted).toBeUndefined();
      expect(remaining).toBeDefined();
      expect(remaining!.id).toBe(testData2.id);
    });
  });

  describe('deleteHeight', () => {
    it('should remove height record from database', async () => {
      // Arrange
      const testData = createTestHeightRecordData();
      await testDb.write(async () => {
        await testDb.heightRecords.put(testData);
      });

      // Verify it exists
      const existsBefore = await testDb.heightRecords.get(testData.id);
      expect(existsBefore).toBeDefined();

      // Act
      await repository.deleteHeight(testData.id);

      // Assert
      const existsAfter = await testDb.heightRecords.get(testData.id);
      expect(existsAfter).toBeUndefined();
    });

    it('should not throw error when deleting non-existent height record', async () => {
      // Arrange
      const nonExistentId = generateId();

      // Act & Assert - should not throw
      await expect(repository.deleteHeight(nonExistentId)).resolves.toBeUndefined();
    });

    it('should only delete specified height record', async () => {
      // Arrange
      const testData1 = createTestHeightRecordData();
      const testData2 = createTestHeightRecordData();
      await testDb.write(async () => {
        await testDb.heightRecords.bulkPut([testData1, testData2]);
      });

      // Act
      await repository.deleteHeight(testData1.id);

      // Assert
      const deleted = await testDb.heightRecords.get(testData1.id);
      const remaining = await testDb.heightRecords.get(testData2.id);

      expect(deleted).toBeUndefined();
      expect(remaining).toBeDefined();
      expect(remaining!.id).toBe(testData2.id);
    });
  });

  describe('repository interface compliance', () => {
    it('should implement all IBodyMetricsRepository methods', () => {
      // Assert
      expect(typeof repository.saveWeight).toBe('function');
      expect(typeof repository.saveHeight).toBe('function');
      expect(typeof repository.findWeightHistory).toBe('function');
      expect(typeof repository.findHeightHistory).toBe('function');
      expect(typeof repository.findLatestWeight).toBe('function');
      expect(typeof repository.deleteWeight).toBe('function');
      expect(typeof repository.deleteHeight).toBe('function');
    });

    it('should accept database dependency injection', () => {
      // Arrange & Act
      const customDb = createTestDatabase();
      const customRepository = new BodyMetricsRepository(customDb);

      // Assert
      expect(customRepository).toBeInstanceOf(BodyMetricsRepository);
    });
  });

  describe('data integrity and validation', () => {
    it('should preserve Date objects through save/load cycle for weight records', async () => {
      // Arrange
      const specificDate = new Date('2023-08-15T10:30:00.000Z');
      const weightRecord = WeightRecordModel.hydrate(
        createTestWeightRecordData({ date: specificDate })
      );

      // Act
      await repository.saveWeight(weightRecord);
      const retrieved = await repository.findLatestWeight(weightRecord.profileId);

      // Assert
      expect(retrieved!.date).toEqual(specificDate);
      expect(retrieved!.date).toBeInstanceOf(Date);
    });

    it('should preserve Date objects through save/load cycle for height records', async () => {
      // Arrange
      const specificDate = new Date('2023-08-15T10:30:00.000Z');
      const heightRecord = HeightRecordModel.hydrate(
        createTestHeightRecordData({ date: specificDate })
      );

      // Act
      await repository.saveHeight(heightRecord);
      const retrieved = await repository.findHeightHistory(heightRecord.profileId);

      // Assert
      expect(retrieved[0].date).toEqual(specificDate);
      expect(retrieved[0].date).toBeInstanceOf(Date);
    });

    it('should handle optional notes field correctly for weight records', async () => {
      // Arrange
      const withNotes = WeightRecordModel.hydrate(
        createTestWeightRecordData({ notes: 'Test weight notes' })
      );
      const withoutNotes = WeightRecordModel.hydrate(
        createTestWeightRecordData({ notes: undefined })
      );

      // Act
      await repository.saveWeight(withNotes);
      await repository.saveWeight(withoutNotes);

      const retrievedWithNotes = await repository.findLatestWeight(withNotes.profileId);
      const retrievedWithoutNotes = await repository.findLatestWeight(withoutNotes.profileId);

      // Assert
      expect(retrievedWithNotes!.notes).toBe('Test weight notes');
      expect(retrievedWithoutNotes!.notes).toBeUndefined();
    });

    it('should handle optional notes field correctly for height records', async () => {
      // Arrange
      const withNotes = HeightRecordModel.hydrate(
        createTestHeightRecordData({ notes: 'Test height notes' })
      );
      const withoutNotes = HeightRecordModel.hydrate(
        createTestHeightRecordData({ notes: undefined })
      );

      // Act
      await repository.saveHeight(withNotes);
      await repository.saveHeight(withoutNotes);

      const retrievedWithNotesHistory = await repository.findHeightHistory(withNotes.profileId);
      const retrievedWithoutNotesHistory = await repository.findHeightHistory(
        withoutNotes.profileId
      );

      // Assert
      expect(retrievedWithNotesHistory[0].notes).toBe('Test height notes');
      expect(retrievedWithoutNotesHistory[0].notes).toBeUndefined();
    });

    it('should preserve numeric precision for weight values', async () => {
      // Arrange
      const preciseWeight = 72.34;
      const weightRecord = WeightRecordModel.hydrate(
        createTestWeightRecordData({ weight: preciseWeight })
      );

      // Act
      await repository.saveWeight(weightRecord);
      const retrieved = await repository.findLatestWeight(weightRecord.profileId);

      // Assert
      expect(retrieved!.weight).toBe(preciseWeight);
      expect(typeof retrieved!.weight).toBe('number');
    });

    it('should preserve numeric precision for height values', async () => {
      // Arrange
      const preciseHeight = 177.85;
      const heightRecord = HeightRecordModel.hydrate(
        createTestHeightRecordData({ height: preciseHeight })
      );

      // Act
      await repository.saveHeight(heightRecord);
      const retrieved = await repository.findHeightHistory(heightRecord.profileId);

      // Assert
      expect(retrieved[0].height).toBe(preciseHeight);
      expect(typeof retrieved[0].height).toBe('number');
    });
  });

  describe('hydration and dehydration patterns', () => {
    it('should use WeightRecordModel.hydrate for creating weight instances', async () => {
      // Arrange
      const testData = createTestWeightRecordData();
      await testDb.write(async () => {
        await testDb.weightRecords.put(testData);
      });

      // Act
      const result = await repository.findWeightHistory(testData.profileId);

      // Assert
      expect(result[0]).toBeInstanceOf(WeightRecordModel);
      expect(result[0].id).toBe(testData.id);
      expect(result[0].profileId).toBe(testData.profileId);
      expect(result[0].weight).toBe(testData.weight);
      expect(result[0].date).toEqual(testData.date);
    });

    it('should use HeightRecordModel.hydrate for creating height instances', async () => {
      // Arrange
      const testData = createTestHeightRecordData();
      await testDb.write(async () => {
        await testDb.heightRecords.put(testData);
      });

      // Act
      const result = await repository.findHeightHistory(testData.profileId);

      // Assert
      expect(result[0]).toBeInstanceOf(HeightRecordModel);
      expect(result[0].id).toBe(testData.id);
      expect(result[0].profileId).toBe(testData.profileId);
      expect(result[0].height).toBe(testData.height);
      expect(result[0].date).toEqual(testData.date);
    });

    it('should use toPlainObject for dehydrating weight models', async () => {
      // Arrange
      const weightRecord = WeightRecordModel.hydrate(createTestWeightRecordData());

      // Act
      await repository.saveWeight(weightRecord);

      // Assert
      const savedData = await testDb.weightRecords.get(weightRecord.id);
      const plainObject = weightRecord.toPlainObject();

      expect(savedData).toEqual(plainObject);
    });

    it('should use toPlainObject for dehydrating height models', async () => {
      // Arrange
      const heightRecord = HeightRecordModel.hydrate(createTestHeightRecordData());

      // Act
      await repository.saveHeight(heightRecord);

      // Assert
      const savedData = await testDb.heightRecords.get(heightRecord.id);
      const plainObject = heightRecord.toPlainObject();

      expect(savedData).toEqual(plainObject);
    });
  });
});
