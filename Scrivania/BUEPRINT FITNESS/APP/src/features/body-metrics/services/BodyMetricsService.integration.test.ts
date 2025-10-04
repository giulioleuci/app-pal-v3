import { Database } from '@nozbe/watermelondb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { BodyMetricsRepository } from '@/features/body-metrics/data/BodyMetricsRepository';
import { createTestDatabase } from '@/test-database';
import { createTestHeightRecordData, createTestWeightRecordData } from '@/test-factories';

import { BodyMetricsService } from './BodyMetricsService';

describe('BodyMetricsService Integration Tests', () => {
  let bodyMetricsService: BodyMetricsService;
  let bodyMetricsRepository: BodyMetricsRepository;
  let mockLogger: jest.Mocked<ILogger>;
  let testDb: Database;

  beforeEach(() => {
    // Create a test database instance
    testDb = createTestDatabase();

    // Create real repository instance with test database
    bodyMetricsRepository = new BodyMetricsRepository(testDb);

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    bodyMetricsService = new BodyMetricsService(bodyMetricsRepository, mockLogger);

    // Mock crypto for consistent testing and WatermelonDB compatibility
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440007'),
      getRandomValues: vi.fn((arr) => {
        // Fill the array with pseudo-random values for testing
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    });
  });

  afterEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();

    // Clean up database
    if (testDb) {
      await testDb.delete();
    }
  });

  describe('addWeightRecord - Integration Test', () => {
    it('should create and persist weight record through the full stack', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440008';
      const weight = 75.5;
      const date = new Date('2024-01-15T10:00:00Z');
      const notes = 'Integration test weight record';

      // Act - Execute the vertical slice
      const result = await bodyMetricsService.addWeightRecord(profileId, weight, date, notes);

      // Assert - Verify the complete flow
      expect(result.isSuccess).toBe(true);

      const createdRecord = result.getValue();
      expect(createdRecord.id).toBe('550e8400-e29b-41d4-a716-446655440007');
      expect(createdRecord.profileId).toBe(profileId);
      expect(createdRecord.weight).toBe(weight);
      expect(createdRecord.date).toEqual(date);
      expect(createdRecord.notes).toBe(notes);

      // Verify record was persisted in repository
      const weightHistory = await bodyMetricsRepository.findWeightHistory(profileId);
      expect(weightHistory).toHaveLength(1);
      expect(weightHistory[0].id).toBe('550e8400-e29b-41d4-a716-446655440007');
      expect(weightHistory[0].weight).toBe(weight);

      // Verify latest weight retrieval
      const latestWeight = await bodyMetricsRepository.findLatestWeight(profileId);
      expect(latestWeight).toBeDefined();
      expect(latestWeight!.id).toBe('550e8400-e29b-41d4-a716-446655440007');
      expect(latestWeight!.weight).toBe(weight);

      // Verify logging was called
      expect(mockLogger.info).toHaveBeenCalledWith('Adding weight record', {
        profileId,
        weight,
        date: date.toISOString(),
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Weight record added successfully', {
        recordId: '550e8400-e29b-41d4-a716-446655440007',
        profileId,
        weight,
      });
    });

    it('should handle multiple weight records for the same profile', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440013';
      const records = [
        { weight: 75.0, date: new Date('2024-01-10T10:00:00Z'), notes: 'First record' },
        { weight: 75.5, date: new Date('2024-01-15T10:00:00Z'), notes: 'Second record' },
        { weight: 76.0, date: new Date('2024-01-20T10:00:00Z'), notes: 'Third record' },
      ];

      let uuidCounter = 0;
      const baseUuid = '550e8400-e29b-41d4-a716-44665566';
      vi.mocked(crypto.randomUUID).mockImplementation(
        () => `${baseUuid}${String(++uuidCounter).padStart(4, '0')}`
      );

      // Act - Create multiple records
      const results = await Promise.all(
        records.map((record) =>
          bodyMetricsService.addWeightRecord(profileId, record.weight, record.date, record.notes)
        )
      );

      // Assert - All records created successfully
      results.forEach((result, index) => {
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().weight).toBe(records[index].weight);
        expect(result.getValue().id).toBe(`${baseUuid}${String(index + 1).padStart(4, '0')}`);
      });

      // Verify all records are persisted
      const weightHistory = await bodyMetricsRepository.findWeightHistory(profileId);
      expect(weightHistory).toHaveLength(3);

      // Verify latest weight is the most recent one
      const latestWeight = await bodyMetricsRepository.findLatestWeight(profileId);
      expect(latestWeight!.weight).toBe(76.0);
      expect(latestWeight!.notes).toBe('Third record');

      // Verify records can be retrieved
      const historyResult = await bodyMetricsService.getWeightHistory(profileId);
      expect(historyResult.isSuccess).toBe(true);
      expect(historyResult.getValue()).toHaveLength(3);
    });

    it('should handle weight record without notes', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440014';
      const weight = 80.0;
      const date = new Date('2024-02-01T10:00:00Z');

      // Act
      const result = await bodyMetricsService.addWeightRecord(profileId, weight, date);

      // Assert
      expect(result.isSuccess).toBe(true);

      const createdRecord = result.getValue();
      expect(createdRecord.notes).toBeUndefined();
      expect(createdRecord.weight).toBe(weight);

      // Verify persistence
      const weightHistory = await bodyMetricsRepository.findWeightHistory(profileId);
      expect(weightHistory).toHaveLength(1);
      expect(weightHistory[0].notes).toBeUndefined();
    });

    it('should handle validation failures in the full stack', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440009';
      const invalidWeight = -10; // This should fail domain validation
      const date = new Date();

      // Act
      const result = await bodyMetricsService.addWeightRecord(profileId, invalidWeight, date);

      // Assert
      expect(result.isFailure).toBe(true);

      // Verify nothing was persisted
      const weightHistory = await bodyMetricsRepository.findWeightHistory(profileId);
      expect(weightHistory).toHaveLength(0);

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Weight record validation failed',
        undefined,
        expect.objectContaining({
          profileId,
          weight: invalidWeight,
        })
      );
    });
  });

  describe('Full Body Metrics Workflow', () => {
    it('should handle complete weight and height tracking lifecycle', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440010';
      let uuidCounter = 0;
      const baseUuid = '550e8400-e29b-41d4-a716-44665544';
      vi.mocked(crypto.randomUUID).mockImplementation(
        () => `${baseUuid}${String(++uuidCounter).padStart(4, '0')}`
      );

      // Act & Assert - Add weight record
      const weightResult = await bodyMetricsService.addWeightRecord(
        profileId,
        75.5,
        new Date('2024-01-15T10:00:00Z'),
        'Initial weight'
      );
      expect(weightResult.isSuccess).toBe(true);

      // Act & Assert - Add height record
      const heightResult = await bodyMetricsService.addHeightRecord(
        profileId,
        180.0,
        new Date('2024-01-15T10:00:00Z'),
        'Height measurement'
      );
      expect(heightResult.isSuccess).toBe(true);

      // Act & Assert - Retrieve weight history
      const weightHistoryResult = await bodyMetricsService.getWeightHistory(profileId);
      expect(weightHistoryResult.isSuccess).toBe(true);
      expect(weightHistoryResult.getValue()).toHaveLength(1);

      // Act & Assert - Retrieve height history
      const heightHistoryResult = await bodyMetricsService.getHeightHistory(profileId);
      expect(heightHistoryResult.isSuccess).toBe(true);
      expect(heightHistoryResult.getValue()).toHaveLength(1);

      // Act & Assert - Get latest weight
      const latestWeightResult = await bodyMetricsService.getLatestWeight(profileId);
      expect(latestWeightResult.isSuccess).toBe(true);
      expect(latestWeightResult.getValue()!.weight).toBe(75.5);

      // Act & Assert - Add another weight record
      const secondWeightResult = await bodyMetricsService.addWeightRecord(
        profileId,
        76.0,
        new Date('2024-01-20T10:00:00Z'),
        'Updated weight'
      );
      expect(secondWeightResult.isSuccess).toBe(true);

      // Verify latest weight is updated
      const updatedLatestWeightResult = await bodyMetricsService.getLatestWeight(profileId);
      expect(updatedLatestWeightResult.getValue()!.weight).toBe(76.0);

      // Verify weight history now has 2 records
      const updatedHistoryResult = await bodyMetricsService.getWeightHistory(profileId);
      expect(updatedHistoryResult.getValue()).toHaveLength(2);

      // Act & Assert - Delete first weight record
      const deleteResult = await bodyMetricsService.deleteWeightRecord(
        '550e8400-e29b-41d4-a716-446655440001'
      );
      expect(deleteResult.isSuccess).toBe(true);

      // Verify deletion
      const finalHistoryResult = await bodyMetricsService.getWeightHistory(profileId);
      expect(finalHistoryResult.getValue()).toHaveLength(1);
      expect(finalHistoryResult.getValue()[0].id).toBe('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should maintain data integrity across multiple profiles', async () => {
      // Arrange
      const profileId1 = '550e8400-e29b-41d4-a716-446655440011';
      const profileId2 = '550e8400-e29b-41d4-a716-446655440012';
      let uuidCounter = 0;
      const baseUuid = '550e8400-e29b-41d4-a716-44665555';
      vi.mocked(crypto.randomUUID).mockImplementation(
        () => `${baseUuid}${String(++uuidCounter).padStart(4, '0')}`
      );

      // Act - Add records for both profiles
      await bodyMetricsService.addWeightRecord(profileId1, 70.0, new Date(), 'Profile 1 weight');
      await bodyMetricsService.addWeightRecord(profileId2, 80.0, new Date(), 'Profile 2 weight');

      // Assert - Each profile has its own data
      const profile1History = await bodyMetricsService.getWeightHistory(profileId1);
      const profile2History = await bodyMetricsService.getWeightHistory(profileId2);

      expect(profile1History.getValue()).toHaveLength(1);
      expect(profile2History.getValue()).toHaveLength(1);
      expect(profile1History.getValue()[0].weight).toBe(70.0);
      expect(profile2History.getValue()[0].weight).toBe(80.0);

      // Verify latest weights are separate
      const profile1Latest = await bodyMetricsService.getLatestWeight(profileId1);
      const profile2Latest = await bodyMetricsService.getLatestWeight(profileId2);

      expect(profile1Latest.getValue()!.weight).toBe(70.0);
      expect(profile2Latest.getValue()!.weight).toBe(80.0);
    });
  });
});
