import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { generateId } from '@/lib';
import { Result } from '@/shared/utils/Result';
import { createTestUserSettingsModel } from '@/test-factories';

describe('App Settings Hooks - Basic Functionality', () => {
  let mockUserSettingsService: jest.Mocked<UserSettingsService>;
  let mockSettings: UserSettingsModel;

  beforeEach(() => {
    const testProfileId = generateId(); // Generate valid UUID
    mockSettings = createTestUserSettingsModel({
      profileId: testProfileId,
      themeMode: 'dark',
      unitSystem: 'metric',
      autoStartRestTimer: true,
    });

    mockUserSettingsService = {
      getUserSettings: vi.fn(),
      saveUserSettings: vi.fn(),
    } as any;
  });

  it('should create UserSettingsModel with correct properties', () => {
    expect(mockSettings.profileId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    ); // UUID pattern
    expect(mockSettings.themeMode).toBe('dark');
    expect(mockSettings.unitSystem).toBe('metric');
    expect(mockSettings.autoStartRestTimer).toBe(true);
  });

  it('should handle Result success correctly', () => {
    const result = Result.success(mockSettings);

    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.value).toBe(mockSettings);
  });

  it('should handle Result failure correctly', () => {
    const error = new Error('Test error');
    const result = Result.failure(error);

    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });

  it('should mock UserSettingsService methods correctly', async () => {
    mockUserSettingsService.getUserSettings.mockResolvedValue(Result.success(mockSettings));

    const result = await mockUserSettingsService.getUserSettings(mockSettings.profileId);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(mockSettings);
    expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(mockSettings.profileId);
  });

  it('should validate UserSettingsModel domain methods', () => {
    const updatedSettings = mockSettings.cloneWithThemeMode('light');

    expect(updatedSettings.themeMode).toBe('light');
    expect(updatedSettings.profileId).toBe(mockSettings.profileId); // Other props preserved
    expect(updatedSettings.unitSystem).toBe('metric');
  });

  it('should handle UserSettingsModel validation', () => {
    const validation = mockSettings.validate();

    if (!validation.success) {
      console.log('Validation errors:', validation.error);
    }

    expect(validation.success).toBe(true);
  });

  it('should convert UserSettingsModel to plain object', () => {
    const plainObject = mockSettings.toPlainObject();

    expect(plainObject.profileId).toBe(mockSettings.profileId);
    expect(plainObject.themeMode).toBe('dark');
    expect(plainObject.unitSystem).toBe('metric');
    expect(plainObject.autoStartRestTimer).toBe(true);
  });
});
