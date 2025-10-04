import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestExtendedDatabase } from '@/test-database';
import { createTestUserDetailsData, createTestUserDetailsModel } from '@/test-factories';

import { UserDetailsModel } from '../domain/UserDetailsModel';
import { UserDetailsRepository } from './UserDetailsRepository';

describe('UserDetailsRepository', () => {
  let testDb: TestExtendedDatabase;
  let repository: UserDetailsRepository;

  beforeEach(async () => {
    testDb = createTestDatabase();
    repository = new UserDetailsRepository(testDb);
  });

  afterEach(async () => {
    // Clean up database between tests
    if (testDb && testDb.cleanup) {
      await testDb.cleanup();
    }
  });

  describe('save', () => {
    it('should persist a UserDetailsModel to the database', async () => {
      // Arrange
      const detailsModel = createTestUserDetailsModel();

      // Act
      const result = await repository.save(detailsModel);

      // Assert
      expect(result).toBe(detailsModel);

      // Verify data was persisted
      const collection = testDb.get('user_details');
      const savedRecord = await collection.find(detailsModel.id);
      expect(savedRecord).toBeDefined();

      // Check the _raw data since decorators might not work in tests
      expect(savedRecord.id).toBe(detailsModel.id);
      expect(savedRecord._raw.profile_id).toBe(detailsModel.profileId);
      expect(savedRecord._raw.full_name).toBe(detailsModel.fullName);
      expect(savedRecord._raw.biological_sex).toBe(detailsModel.biologicalSex);
      if (detailsModel.dateOfBirth?.value) {
        expect(new Date(savedRecord._raw.date_of_birth)).toEqual(detailsModel.dateOfBirth.value);
      } else {
        expect(savedRecord._raw.date_of_birth).toBeUndefined();
      }
      expect(new Date(savedRecord._raw.created_at)).toEqual(detailsModel.createdAt);
      expect(new Date(savedRecord._raw.updated_at)).toEqual(detailsModel.updatedAt);
    });

    it('should update existing details when saving with same id', async () => {
      // Arrange
      const originalData = createTestUserDetailsData({ fullName: 'Original Name' });

      // Create the record first using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('user_details');
        await collection.create((record) => {
          record._raw.id = originalData.id;
          record._raw.profile_id = originalData.profileId;
          record._raw.full_name = originalData.fullName;
          record._raw.biological_sex = originalData.biologicalSex;
          record._raw.date_of_birth = originalData.dateOfBirth?.getTime();
          record._raw.created_at = originalData.createdAt.getTime();
          record._raw.updated_at = originalData.updatedAt.getTime();
        });
      });

      const updatedModel = UserDetailsModel.hydrate({ ...originalData, fullName: 'Updated Name' });

      // Act
      const result = await repository.save(updatedModel);

      // Assert
      expect(result).toBe(updatedModel);

      // Verify data was updated
      const collection = testDb.get('user_details');
      const updatedRecord = await collection.find(originalData.id);
      expect(updatedRecord).toBeDefined();
      expect(updatedRecord._raw.full_name).toBe('Updated Name');
      expect(updatedRecord.id).toBe(originalData.id);
    });
  });

  describe('findByProfileId', () => {
    it('should return a UserDetailsModel when details exist for profile', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const testData = createTestUserDetailsData({ profileId });

      // Create the record using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('user_details');
        await collection.create((record) => {
          record._raw.id = testData.id;
          record._raw.profile_id = testData.profileId;
          record._raw.full_name = testData.fullName;
          record._raw.biological_sex = testData.biologicalSex;
          record._raw.date_of_birth = testData.dateOfBirth?.getTime();
          record._raw.created_at = testData.createdAt.getTime();
          record._raw.updated_at = testData.updatedAt.getTime();
        });
      });

      // Act
      const result = await repository.findByProfileId(profileId);

      // Assert
      expect(result).toBeInstanceOf(UserDetailsModel);
      expect(result!.id).toBe(testData.id);
      expect(result!.profileId).toBe(profileId);
      expect(result!.fullName).toBe(testData.fullName);
      expect(result!.biologicalSex).toBe(testData.biologicalSex);
      expect(result!.dateOfBirth?.value).toEqual(testData.dateOfBirth);
      expect(result!.createdAt).toEqual(testData.createdAt);
      expect(result!.updatedAt).toEqual(testData.updatedAt);
    });

    it('should return undefined when no details exist for profile', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile-id';

      // Act
      const result = await repository.findByProfileId(nonExistentProfileId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return correct details when multiple profiles have details', async () => {
      // Arrange
      const profileId1 = 'profile-1';
      const profileId2 = 'profile-2';
      const testData1 = createTestUserDetailsData({
        profileId: profileId1,
        fullName: 'John Doe',
        biologicalSex: 'male',
      });
      const testData2 = createTestUserDetailsData({
        profileId: profileId2,
        fullName: 'Jane Smith',
        biologicalSex: 'female',
      });
      // Create both records using WatermelonDB
      await testDb.write(async () => {
        const collection = testDb.get('user_details');

        // Create first record
        await collection.create((record) => {
          record._raw.id = testData1.id;
          record._raw.profile_id = testData1.profileId;
          record._raw.full_name = testData1.fullName;
          record._raw.biological_sex = testData1.biologicalSex;
          record._raw.date_of_birth = testData1.dateOfBirth?.getTime();
          record._raw.created_at = testData1.createdAt.getTime();
          record._raw.updated_at = testData1.updatedAt.getTime();
        });

        // Create second record
        await collection.create((record) => {
          record._raw.id = testData2.id;
          record._raw.profile_id = testData2.profileId;
          record._raw.full_name = testData2.fullName;
          record._raw.biological_sex = testData2.biologicalSex;
          record._raw.date_of_birth = testData2.dateOfBirth?.getTime();
          record._raw.created_at = testData2.createdAt.getTime();
          record._raw.updated_at = testData2.updatedAt.getTime();
        });
      });

      // Act
      const result1 = await repository.findByProfileId(profileId1);
      const result2 = await repository.findByProfileId(profileId2);

      // Assert
      expect(result1).toBeInstanceOf(UserDetailsModel);
      expect(result1!.profileId).toBe(profileId1);
      expect(result1!.fullName).toBe('John Doe');
      expect(result1!.biologicalSex).toBe('male');

      expect(result2).toBeInstanceOf(UserDetailsModel);
      expect(result2!.profileId).toBe(profileId2);
      expect(result2!.fullName).toBe('Jane Smith');
      expect(result2!.biologicalSex).toBe('female');
    });
  });
});
