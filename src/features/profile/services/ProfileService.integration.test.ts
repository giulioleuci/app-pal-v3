import { Database } from '@nozbe/watermelondb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { ProfileRepository } from '@/features/profile/data/ProfileRepository';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { ProfileCreatedEvent } from '@/shared/domain/events/ProfileCreatedEvent';
import { createTestDatabase } from '@/test-database';
import { createTestProfileData } from '@/test-factories';

import { ProfileService } from './ProfileService';

describe('ProfileService Integration Tests', () => {
  let profileService: ProfileService;
  let profileRepository: ProfileRepository;
  let mockLogger: jest.Mocked<ILogger>;
  let testDb: Database;

  beforeEach(() => {
    // Clear all domain event handlers before each test
    DomainEvents.clearHandlers();

    // Create a test database instance
    testDb = createTestDatabase();

    // Create real repository instance with test database
    profileRepository = new ProfileRepository(testDb);

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    profileService = new ProfileService(profileRepository, mockLogger);

    // Mock crypto with both randomUUID and getRandomValues for WatermelonDB compatibility
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440002'),
      getRandomValues: vi.fn((array) => {
        // Fill array with pseudo-random values for testing
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }),
    });
  });

  afterEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    DomainEvents.clearHandlers();

    // Clean up database
    if (testDb) {
      await testDb.delete();
    }
  });

  describe('createProfile - Integration Test', () => {
    it('should create profile and trigger SampleDataPopulationHandler event', async () => {
      // Arrange
      const profileName = 'Integration Test Profile';
      let eventWasDispatched = false;
      let dispatchedEvent: ProfileCreatedEvent | null = null;

      // Register a handler to simulate SampleDataPopulationHandler
      const sampleDataHandler = (event: ProfileCreatedEvent) => {
        eventWasDispatched = true;
        dispatchedEvent = event;

        // Simulate sample data population logic
        expect(event.profile).toBeDefined();
        expect(event.profile.name).toBe(profileName);
        expect(event.profile.id).toBe('550e8400-e29b-41d4-a716-446655440002');
      };

      DomainEvents.register(sampleDataHandler, 'ProfileCreatedEvent');

      // Act - Execute the vertical slice
      const result = await profileService.createProfile(profileName);

      // Assert - Verify the complete flow
      expect(result.isSuccess).toBe(true);

      const createdProfile = result.getValue();
      expect(createdProfile.id).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(createdProfile.name).toBe(profileName);
      expect(createdProfile.isActive).toBe(true);

      // Verify profile was persisted in repository
      const retrievedProfile = await profileRepository.findById(
        '550e8400-e29b-41d4-a716-446655440002'
      );
      expect(retrievedProfile).toBeDefined();
      expect(retrievedProfile!.name).toBe(profileName);

      // Verify the SampleDataPopulationHandler event was triggered
      expect(eventWasDispatched).toBe(true);
      expect(dispatchedEvent).toBeInstanceOf(ProfileCreatedEvent);
      expect(dispatchedEvent!.profile.id).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(dispatchedEvent!.profile.name).toBe(profileName);
      expect(dispatchedEvent!.getAggregateId()).toBe('550e8400-e29b-41d4-a716-446655440002');

      // Verify domain event subscription exists
      expect(DomainEvents.hasSubscription('ProfileCreatedEvent')).toBe(true);

      // Verify logging was called
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new profile', { name: profileName });
      expect(mockLogger.info).toHaveBeenCalledWith('Profile created successfully', {
        profileId: '550e8400-e29b-41d4-a716-446655440002',
        name: profileName,
      });
    });

    it('should handle the complete create-and-populate workflow', async () => {
      // Arrange
      const profileName = 'Workflow Test Profile';
      const sampleDataResults: string[] = [];

      // Simulate multiple event handlers (like sample data population)
      const profileHandler = (event: ProfileCreatedEvent) => {
        sampleDataResults.push(`Profile created: ${event.profile.name}`);
      };

      const sampleExerciseHandler = (event: ProfileCreatedEvent) => {
        sampleDataResults.push(`Sample exercises populated for: ${event.profile.id}`);
      };

      const sampleWorkoutHandler = (event: ProfileCreatedEvent) => {
        sampleDataResults.push(`Sample workouts created for: ${event.profile.id}`);
      };

      // Register multiple handlers to simulate full sample data population
      DomainEvents.register(profileHandler, 'ProfileCreatedEvent');
      DomainEvents.register(sampleExerciseHandler, 'ProfileCreatedEvent');
      DomainEvents.register(sampleWorkoutHandler, 'ProfileCreatedEvent');

      // Act
      const result = await profileService.createProfile(profileName);

      // Assert - Complete workflow executed
      expect(result.isSuccess).toBe(true);
      expect(sampleDataResults).toHaveLength(3);
      expect(sampleDataResults).toContain('Profile created: Workflow Test Profile');
      expect(sampleDataResults).toContain(
        'Sample exercises populated for: 550e8400-e29b-41d4-a716-446655440002'
      );
      expect(sampleDataResults).toContain(
        'Sample workouts created for: 550e8400-e29b-41d4-a716-446655440002'
      );

      // Verify persistence layer integration
      const allProfiles = await profileRepository.findAll();
      expect(allProfiles).toHaveLength(1);
      expect(allProfiles[0].name).toBe(profileName);
    });

    it('should not dispatch events when profile creation fails', async () => {
      // Arrange
      let eventWasDispatched = false;
      const sampleDataHandler = () => {
        eventWasDispatched = true;
      };
      DomainEvents.register(sampleDataHandler, 'ProfileCreatedEvent');

      // Act - Try to create profile with invalid data (empty name)
      const result = await profileService.createProfile('');

      // Assert - No events should be dispatched on failure
      expect(result.isFailure).toBe(true);
      expect(eventWasDispatched).toBe(false);

      // Verify nothing was persisted
      const allProfiles = await profileRepository.findAll();
      expect(allProfiles).toHaveLength(0);
    });
  });

  describe('End-to-End Profile Lifecycle', () => {
    it('should handle complete CRUD operations with proper event dispatching', async () => {
      // Arrange - Track all events
      const dispatchedEvents: string[] = [];

      DomainEvents.register((event: ProfileCreatedEvent) => {
        dispatchedEvents.push(`ProfileCreated: ${event.profile.name}`);
      }, 'ProfileCreatedEvent');

      // Act & Assert - Create
      const createResult = await profileService.createProfile('Lifecycle Profile');
      expect(createResult.isSuccess).toBe(true);
      expect(dispatchedEvents).toContain('ProfileCreated: Lifecycle Profile');

      const profileId = createResult.getValue().id;

      // Act & Assert - Read
      const readResult = await profileService.getProfile(profileId);
      expect(readResult.isSuccess).toBe(true);
      expect(readResult.getValue().name).toBe('Lifecycle Profile');

      // Act & Assert - Update
      const updateResult = await profileService.updateProfileName(
        profileId,
        'Updated Lifecycle Profile'
      );
      expect(updateResult.isSuccess).toBe(true);
      expect(updateResult.getValue().name).toBe('Updated Lifecycle Profile');

      // Verify persistence
      const verifyResult = await profileService.getProfile(profileId);
      expect(verifyResult.getValue().name).toBe('Updated Lifecycle Profile');

      // Act & Assert - List all
      const listResult = await profileService.getAllProfiles();
      expect(listResult.isSuccess).toBe(true);
      expect(listResult.getValue()).toHaveLength(1);

      // Verify domain events integration worked properly
      expect(dispatchedEvents).toHaveLength(1); // Only creation should dispatch events
    });
  });
});
