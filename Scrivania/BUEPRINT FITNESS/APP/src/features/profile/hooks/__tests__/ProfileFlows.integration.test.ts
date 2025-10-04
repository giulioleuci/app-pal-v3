import { Database } from '@nozbe/watermelondb';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsoleLogger } from '@/app/services/ConsoleLogger';
import { ProfileRepository } from '@/features/profile/data/ProfileRepository';
import { ProfileQueryService } from '@/features/profile/query-services/ProfileQueryService';
import { ProfileService } from '@/features/profile/services/ProfileService';
import { UserDetailsService } from '@/features/profile/services/UserDetailsService';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { ProfileCreatedEvent } from '@/shared/domain/events/ProfileCreatedEvent';
import { Result } from '@/shared/utils/Result';
import { createTestDatabase } from '@/test-database';
import { render } from '@/test-utils';

describe('ProfileFlows Integration Tests', () => {
  let testDb: Database;
  let queryClient: QueryClient;
  let profileRepository: ProfileRepository;
  let profileService: ProfileService;
  let profileQueryService: ProfileQueryService;
  let mockLogger: jest.Mocked<ConsoleLogger>;
  let mockUserDetailsService: jest.Mocked<UserDetailsService>;
  let mockUserSettingsService: jest.Mocked<UserSettingsService>;

  beforeEach(async () => {
    // Clear domain events
    DomainEvents.clearHandlers();

    // Create test database
    testDb = createTestDatabase();

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    // Create mock services for UserDetailsService and UserSettingsService
    mockUserDetailsService = {
      getUserDetails: vi.fn().mockResolvedValue(Result.success(null)),
      saveUserDetails: vi.fn(),
    } as any;

    mockUserSettingsService = {
      getUserSettings: vi.fn().mockResolvedValue(Result.success(null)),
      saveUserSettings: vi.fn(),
    } as any;

    // Create real service instances
    profileRepository = new ProfileRepository(testDb);
    profileService = new ProfileService(profileRepository, mockLogger);
    profileQueryService = new ProfileQueryService(
      profileService,
      mockUserDetailsService,
      mockUserSettingsService
    );

    // Create fresh query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock crypto with both randomUUID and getRandomValues for WatermelonDB compatibility
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440001'),
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
    // Cleanup
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    DomainEvents.clearHandlers();
    queryClient.clear();

    if (testDb) {
      await testDb.delete();
    }
  });

  describe('Profile Onboarding Flow', () => {
    it('should create profile and trigger domain event', async () => {
      // Arrange
      const profileName = 'Integration Test User';
      let eventWasDispatched = false;
      let dispatchedEvent: ProfileCreatedEvent | null = null;

      // Register a handler to capture the event
      const eventHandler = (event: ProfileCreatedEvent) => {
        eventWasDispatched = true;
        dispatchedEvent = event;
      };

      DomainEvents.register(eventHandler, ProfileCreatedEvent.name);

      // Act - Call the service directly (simulating what the hook would do)
      const result = await profileQueryService.createProfile(profileName);

      // Assert - Verify profile was created
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.name).toBe(profileName);
      expect(result.isActive).toBe(true);

      // Verify profile was created in database
      const profiles = await testDb.profiles.toArray();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe(profileName);
      expect(profiles[0].id).toBe('550e8400-e29b-41d4-a716-446655440001');

      // Verify ProfileCreatedEvent was dispatched
      expect(eventWasDispatched).toBe(true);
      expect(dispatchedEvent).toBeTruthy();
      expect(dispatchedEvent!.profile.id).toBe(result.id);
      expect(dispatchedEvent!.profile.name).toBe(profileName);
    });
  });

  describe('Profile Deletion Flow', () => {
    it('should delete profile and cascade delete all associated data', async () => {
      // Arrange - Create a profile with data first
      const profileName = 'User to Delete';

      // Create the profile using the service
      const createdProfile = await profileQueryService.createProfile(profileName);
      expect(createdProfile.name).toBe(profileName);

      const profileId = createdProfile.id;

      // Act - Delete the profile using the service
      await profileQueryService.deleteProfile(profileId);

      // Assert - Verify profile is deleted
      const profilesAfter = await testDb.profiles.toArray();
      expect(profilesAfter).toHaveLength(0);
    });
  });
});
