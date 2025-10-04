import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomThemeModel } from '@/features/profile/domain';
import { generateId } from '@/lib';
import { createTestCustomThemeData, createTestCustomThemeModel } from '@/test-factories';

vi.mock('immer', async () => {
  const actual = await vi.importActual('immer');
  return {
    ...actual,
    produce: vi.fn().mockImplementation((base, recipe) => {
      // Create a proper deep copy that preserves dates
      const draft = JSON.parse(JSON.stringify(base), (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      recipe(draft);
      // Return a new instance of the same constructor if it's a model
      if (base.constructor && base.constructor.name && base.constructor.hydrate) {
        return base.constructor.hydrate(draft);
      }
      return draft;
    }),
  };
});

describe('CustomThemeModel', () => {
  let customThemeData: ReturnType<typeof createTestCustomThemeData>;
  let customTheme: CustomThemeModel;

  beforeEach(() => {
    customThemeData = createTestCustomThemeData({
      name: 'My Custom Theme',
      mode: 'dark',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
    });
    customTheme = CustomThemeModel.hydrate(customThemeData);
  });

  describe('constructor', () => {
    it('should be protected and only accessible through hydrate', () => {
      // Protected constructor prevents direct instantiation in TypeScript
      // but we can verify hydrate works correctly
      const instance = CustomThemeModel.hydrate(customThemeData);
      expect(instance).toBeInstanceOf(CustomThemeModel);
    });
  });

  describe('hydrate', () => {
    it('should create a CustomThemeModel instance from plain data', () => {
      const data = createTestCustomThemeData({
        name: 'Ocean Theme',
        mode: 'light',
        primaryColor: '#2196f3',
        secondaryColor: '#00bcd4',
      });
      const model = CustomThemeModel.hydrate(data);

      expect(model).toBeInstanceOf(CustomThemeModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.name).toBe('Ocean Theme');
      expect(model.mode).toBe('light');
      expect(model.primaryColor).toBe('#2196f3');
      expect(model.secondaryColor).toBe('#00bcd4');
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle all property assignments correctly', () => {
      const data = createTestCustomThemeData({
        name: 'Test Theme',
        mode: 'dark',
        primaryColor: '#ff5722',
        secondaryColor: '#4caf50',
      });
      const model = CustomThemeModel.hydrate(data);

      expect(model.name).toBe('Test Theme');
      expect(model.mode).toBe('dark');
      expect(model.primaryColor).toBe('#ff5722');
      expect(model.secondaryColor).toBe('#4caf50');
    });
  });

  describe('cloneWithNewName', () => {
    it('should create a new instance with updated name', () => {
      const newName = 'Updated Theme Name';
      const cloned = customTheme.cloneWithNewName(newName);

      expect(cloned).not.toBe(customTheme);
      expect(cloned.name).toBe(newName);
      expect(cloned.id).toBe(customTheme.id);
      expect(cloned.profileId).toBe(customTheme.profileId);
      expect(cloned.mode).toBe(customTheme.mode);
      expect(cloned.primaryColor).toBe(customTheme.primaryColor);
      expect(cloned.secondaryColor).toBe(customTheme.secondaryColor);
      expect(cloned.updatedAt).not.toBe(customTheme.updatedAt);
    });

    it('should not mutate the original theme', () => {
      const originalName = customTheme.name;
      const originalUpdatedAt = customTheme.updatedAt;

      customTheme.cloneWithNewName('New Name');

      expect(customTheme.name).toBe(originalName);
      expect(customTheme.updatedAt).toBe(originalUpdatedAt);
    });

    it('should handle empty string name', () => {
      const cloned = customTheme.cloneWithNewName('');
      expect(cloned.name).toBe('');
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000);
      const cloned = customTheme.cloneWithNewName(longName);
      expect(cloned.name).toBe(longName);
    });

    it('should handle names with special characters', () => {
      const specialName = 'Theme #1 - "Dark & Light" (v2.0)';
      const cloned = customTheme.cloneWithNewName(specialName);
      expect(cloned.name).toBe(specialName);
    });
  });

  describe('cloneWithNewMode', () => {
    it('should create a new instance with updated mode', () => {
      const cloned = customTheme.cloneWithNewMode('light');

      expect(cloned).not.toBe(customTheme);
      expect(cloned.mode).toBe('light');
      expect(cloned.id).toBe(customTheme.id);
      expect(cloned.name).toBe(customTheme.name);
      expect(cloned.primaryColor).toBe(customTheme.primaryColor);
      expect(cloned.secondaryColor).toBe(customTheme.secondaryColor);
      expect(cloned.updatedAt).not.toBe(customTheme.updatedAt);
    });

    it('should handle switching from light to dark', () => {
      const lightTheme = createTestCustomThemeModel({ mode: 'light' });
      const cloned = lightTheme.cloneWithNewMode('dark');

      expect(cloned.mode).toBe('dark');
    });

    it('should handle setting the same mode', () => {
      const cloned = customTheme.cloneWithNewMode('dark');
      expect(cloned.mode).toBe('dark');
    });

    it('should not mutate the original theme', () => {
      const originalMode = customTheme.mode;
      const originalUpdatedAt = customTheme.updatedAt;

      customTheme.cloneWithNewMode('light');

      expect(customTheme.mode).toBe(originalMode);
      expect(customTheme.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithNewColors', () => {
    it('should create a new instance with updated colors', () => {
      const newPrimary = '#ff9800';
      const newSecondary = '#9c27b0';
      const cloned = customTheme.cloneWithNewColors(newPrimary, newSecondary);

      expect(cloned).not.toBe(customTheme);
      expect(cloned.primaryColor).toBe(newPrimary);
      expect(cloned.secondaryColor).toBe(newSecondary);
      expect(cloned.id).toBe(customTheme.id);
      expect(cloned.name).toBe(customTheme.name);
      expect(cloned.mode).toBe(customTheme.mode);
      expect(cloned.updatedAt).not.toBe(customTheme.updatedAt);
    });

    it('should handle identical colors', () => {
      const sameColor = '#123456';
      const cloned = customTheme.cloneWithNewColors(sameColor, sameColor);

      expect(cloned.primaryColor).toBe(sameColor);
      expect(cloned.secondaryColor).toBe(sameColor);
    });

    it('should handle extreme hex values', () => {
      const cloned = customTheme.cloneWithNewColors('#000000', '#ffffff');
      expect(cloned.primaryColor).toBe('#000000');
      expect(cloned.secondaryColor).toBe('#ffffff');
    });

    it('should handle lowercase hex colors', () => {
      const cloned = customTheme.cloneWithNewColors('#abc123', '#def456');
      expect(cloned.primaryColor).toBe('#abc123');
      expect(cloned.secondaryColor).toBe('#def456');
    });

    it('should handle uppercase hex colors', () => {
      const cloned = customTheme.cloneWithNewColors('#ABC123', '#DEF456');
      expect(cloned.primaryColor).toBe('#ABC123');
      expect(cloned.secondaryColor).toBe('#DEF456');
    });

    it('should not mutate the original theme', () => {
      const originalPrimary = customTheme.primaryColor;
      const originalSecondary = customTheme.secondaryColor;
      const originalUpdatedAt = customTheme.updatedAt;

      customTheme.cloneWithNewColors('#ffffff', '#000000');

      expect(customTheme.primaryColor).toBe(originalPrimary);
      expect(customTheme.secondaryColor).toBe(originalSecondary);
      expect(customTheme.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithNewPrimaryColor', () => {
    it('should create a new instance with updated primary color only', () => {
      const newPrimary = '#4caf50';
      const cloned = customTheme.cloneWithNewPrimaryColor(newPrimary);

      expect(cloned).not.toBe(customTheme);
      expect(cloned.primaryColor).toBe(newPrimary);
      expect(cloned.secondaryColor).toBe(customTheme.secondaryColor);
      expect(cloned.id).toBe(customTheme.id);
      expect(cloned.name).toBe(customTheme.name);
      expect(cloned.mode).toBe(customTheme.mode);
      expect(cloned.updatedAt).not.toBe(customTheme.updatedAt);
    });

    it('should not affect secondary color', () => {
      const originalSecondary = customTheme.secondaryColor;
      const cloned = customTheme.cloneWithNewPrimaryColor('#ff5722');

      expect(cloned.secondaryColor).toBe(originalSecondary);
    });

    it('should not mutate the original theme', () => {
      const originalPrimary = customTheme.primaryColor;
      const originalUpdatedAt = customTheme.updatedAt;

      customTheme.cloneWithNewPrimaryColor('#ff5722');

      expect(customTheme.primaryColor).toBe(originalPrimary);
      expect(customTheme.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('cloneWithNewSecondaryColor', () => {
    it('should create a new instance with updated secondary color only', () => {
      const newSecondary = '#607d8b';
      const cloned = customTheme.cloneWithNewSecondaryColor(newSecondary);

      expect(cloned).not.toBe(customTheme);
      expect(cloned.secondaryColor).toBe(newSecondary);
      expect(cloned.primaryColor).toBe(customTheme.primaryColor);
      expect(cloned.id).toBe(customTheme.id);
      expect(cloned.name).toBe(customTheme.name);
      expect(cloned.mode).toBe(customTheme.mode);
      expect(cloned.updatedAt).not.toBe(customTheme.updatedAt);
    });

    it('should not affect primary color', () => {
      const originalPrimary = customTheme.primaryColor;
      const cloned = customTheme.cloneWithNewSecondaryColor('#795548');

      expect(cloned.primaryColor).toBe(originalPrimary);
    });

    it('should not mutate the original theme', () => {
      const originalSecondary = customTheme.secondaryColor;
      const originalUpdatedAt = customTheme.updatedAt;

      customTheme.cloneWithNewSecondaryColor('#795548');

      expect(customTheme.secondaryColor).toBe(originalSecondary);
      expect(customTheme.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('isDarkMode', () => {
    it('should return true when mode is dark', () => {
      const darkTheme = createTestCustomThemeModel({ mode: 'dark' });
      expect(darkTheme.isDarkMode()).toBe(true);
    });

    it('should return false when mode is light', () => {
      const lightTheme = createTestCustomThemeModel({ mode: 'light' });
      expect(lightTheme.isDarkMode()).toBe(false);
    });

    it('should work correctly after mode changes', () => {
      const lightTheme = customTheme.cloneWithNewMode('light');
      const darkTheme = lightTheme.cloneWithNewMode('dark');

      expect(lightTheme.isDarkMode()).toBe(false);
      expect(darkTheme.isDarkMode()).toBe(true);
    });
  });

  describe('isLightMode', () => {
    it('should return true when mode is light', () => {
      const lightTheme = createTestCustomThemeModel({ mode: 'light' });
      expect(lightTheme.isLightMode()).toBe(true);
    });

    it('should return false when mode is dark', () => {
      const darkTheme = createTestCustomThemeModel({ mode: 'dark' });
      expect(darkTheme.isLightMode()).toBe(false);
    });

    it('should work correctly after mode changes', () => {
      const darkTheme = customTheme.cloneWithNewMode('dark');
      const lightTheme = darkTheme.cloneWithNewMode('light');

      expect(darkTheme.isLightMode()).toBe(false);
      expect(lightTheme.isLightMode()).toBe(true);
    });

    it('should be inverse of isDarkMode', () => {
      const theme1 = createTestCustomThemeModel({ mode: 'light' });
      const theme2 = createTestCustomThemeModel({ mode: 'dark' });

      expect(theme1.isLightMode()).toBe(!theme1.isDarkMode());
      expect(theme2.isLightMode()).toBe(!theme2.isDarkMode());
    });
  });

  describe('getDisplayName', () => {
    it('should return formatted display name with mode', () => {
      expect(customTheme.getDisplayName()).toBe('My Custom Theme (dark)');
    });

    it('should work with light mode', () => {
      const lightTheme = createTestCustomThemeModel({
        name: 'Light Theme',
        mode: 'light',
      });
      expect(lightTheme.getDisplayName()).toBe('Light Theme (light)');
    });

    it('should handle empty name', () => {
      const emptyName = createTestCustomThemeModel({
        name: '',
        mode: 'dark',
      });
      expect(emptyName.getDisplayName()).toBe(' (dark)');
    });

    it('should handle names with special characters', () => {
      const specialTheme = createTestCustomThemeModel({
        name: 'Theme #1 - "Special"',
        mode: 'light',
      });
      expect(specialTheme.getDisplayName()).toBe('Theme #1 - "Special" (light)');
    });

    it('should update after name changes', () => {
      const renamed = customTheme.cloneWithNewName('New Name');
      expect(renamed.getDisplayName()).toBe('New Name (dark)');
    });

    it('should update after mode changes', () => {
      const lightMode = customTheme.cloneWithNewMode('light');
      expect(lightMode.getDisplayName()).toBe('My Custom Theme (light)');
    });
  });

  describe('hasSameColors', () => {
    it('should return true when both themes have identical colors', () => {
      const other = createTestCustomThemeModel({
        primaryColor: customTheme.primaryColor,
        secondaryColor: customTheme.secondaryColor,
      });
      expect(customTheme.hasSameColors(other)).toBe(true);
    });

    it('should return false when primary colors differ', () => {
      const other = createTestCustomThemeModel({
        primaryColor: '#different',
        secondaryColor: customTheme.secondaryColor,
      });
      expect(customTheme.hasSameColors(other)).toBe(false);
    });

    it('should return false when secondary colors differ', () => {
      const other = createTestCustomThemeModel({
        primaryColor: customTheme.primaryColor,
        secondaryColor: '#different',
      });
      expect(customTheme.hasSameColors(other)).toBe(false);
    });

    it('should return false when both colors differ', () => {
      const other = createTestCustomThemeModel({
        primaryColor: '#111111',
        secondaryColor: '#222222',
      });
      expect(customTheme.hasSameColors(other)).toBe(false);
    });

    it('should be case sensitive for hex colors', () => {
      const upperCase = createTestCustomThemeModel({
        primaryColor: '#ABCDEF',
        secondaryColor: '#123456',
      });
      const lowerCase = createTestCustomThemeModel({
        primaryColor: '#abcdef',
        secondaryColor: '#123456',
      });
      expect(upperCase.hasSameColors(lowerCase)).toBe(false);
    });

    it('should work correctly after color updates', () => {
      const original = createTestCustomThemeModel({
        primaryColor: '#111111',
        secondaryColor: '#222222',
      });
      const updated = original.cloneWithNewColors(
        customTheme.primaryColor,
        customTheme.secondaryColor
      );
      expect(customTheme.hasSameColors(updated)).toBe(true);
    });

    it('should ignore other properties', () => {
      const other = createTestCustomThemeModel({
        name: 'Different Name',
        mode: customTheme.mode === 'dark' ? 'light' : 'dark',
        primaryColor: customTheme.primaryColor,
        secondaryColor: customTheme.secondaryColor,
      });
      expect(customTheme.hasSameColors(other)).toBe(true);
    });
  });

  describe('clone', () => {
    it('should create a deep clone of the model', () => {
      const cloned = customTheme.clone();

      expect(cloned).not.toBe(customTheme);
      expect(cloned.id).toBe(customTheme.id);
      expect(cloned.profileId).toBe(customTheme.profileId);
      expect(cloned.name).toBe(customTheme.name);
      expect(cloned.mode).toBe(customTheme.mode);
      expect(cloned.primaryColor).toBe(customTheme.primaryColor);
      expect(cloned.secondaryColor).toBe(customTheme.secondaryColor);
      expect(cloned.createdAt).toEqual(customTheme.createdAt);
      expect(cloned.updatedAt).toEqual(customTheme.updatedAt);
    });

    it('should return the same type', () => {
      const cloned = customTheme.clone();
      expect(cloned).toBeInstanceOf(CustomThemeModel);
    });
  });

  describe('toPlainObject', () => {
    it('should return a plain object with all properties', () => {
      const plainObject = customTheme.toPlainObject();

      expect(plainObject).toEqual({
        id: customTheme.id,
        profileId: customTheme.profileId,
        name: customTheme.name,
        mode: customTheme.mode,
        primaryColor: customTheme.primaryColor,
        secondaryColor: customTheme.secondaryColor,
        createdAt: customTheme.createdAt,
        updatedAt: customTheme.updatedAt,
      });
    });

    it('should be serializable', () => {
      const plainObject = customTheme.toPlainObject();
      expect(() => JSON.stringify(plainObject)).not.toThrow();
    });

    it('should match the structure required by the schema', () => {
      const plainObject = customTheme.toPlainObject();

      // Verify all required fields are present
      expect(typeof plainObject.id).toBe('string');
      expect(typeof plainObject.profileId).toBe('string');
      expect(typeof plainObject.name).toBe('string');
      expect(['light', 'dark']).toContain(plainObject.mode);
      expect(typeof plainObject.primaryColor).toBe('string');
      expect(typeof plainObject.secondaryColor).toBe('string');
      expect(plainObject.createdAt).toBeInstanceOf(Date);
      expect(plainObject.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('validate', () => {
    it('should validate successfully for valid custom theme data', () => {
      const result = customTheme.validate();
      expect(result.success).toBe(true);
    });

    it('should fail validation for empty name', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        name: '',
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid mode', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        // @ts-expect-error - Testing invalid data
        mode: 'invalid',
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid primary color format', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        primaryColor: 'not-a-hex-color',
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid secondary color format', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        secondaryColor: '#gggggg', // Invalid hex
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for too short hex colors', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        primaryColor: '#123', // Too short
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for too long hex colors', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        primaryColor: '#1234567', // Too long
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should fail validation for hex colors without #', () => {
      const invalidTheme = CustomThemeModel.hydrate({
        ...customThemeData,
        primaryColor: '123456', // Missing #
      });
      const result = invalidTheme.validate();
      expect(result.success).toBe(false);
    });

    it('should validate successfully with valid hex variations', () => {
      const testCases = ['#000000', '#ffffff', '#123456', '#ABCDEF', '#abcdef', '#1a2b3c'];

      testCases.forEach((color) => {
        const theme = createTestCustomThemeModel({
          primaryColor: color,
          secondaryColor: color,
        });
        const result = theme.validate();
        expect(result.success).toBe(true);
      });
    });
  });

  describe('equals', () => {
    it('should return true for the same instance', () => {
      expect(customTheme.equals(customTheme)).toBe(true);
    });

    it('should return true for different instances with same id', () => {
      const other = CustomThemeModel.hydrate(customThemeData);
      expect(customTheme.equals(other)).toBe(true);
    });

    it('should return false for different instances with different ids', () => {
      const other = createTestCustomThemeModel({ id: generateId() });
      expect(customTheme.equals(other)).toBe(false);
    });

    it('should return false for null', () => {
      expect(customTheme.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(customTheme.equals(undefined)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties in TypeScript', () => {
      // TypeScript readonly properties prevent compile-time mutations
      // Runtime mutations are prevented by the class design and immutable operations
      expect(customTheme.name).toBeDefined();
      expect(customTheme.mode).toBeDefined();
      expect(customTheme.primaryColor).toBeDefined();
      expect(customTheme.secondaryColor).toBeDefined();

      // Verify that cloning creates new instances rather than mutating existing ones
      const originalName = customTheme.name;
      const cloned = customTheme.cloneWithNewName('Different Name');

      expect(customTheme.name).toBe(originalName);
      expect(cloned.name).toBe('Different Name');
      expect(cloned).not.toBe(customTheme);
    });
  });

  describe('business logic edge cases', () => {
    it('should handle minimum valid name length', () => {
      const minTheme = createTestCustomThemeModel({ name: 'A', mode: 'dark' });
      expect(minTheme.getDisplayName()).toBe('A (dark)');
      expect(minTheme.validate().success).toBe(true);
    });

    it('should maintain data integrity through multiple clone operations', () => {
      const originalId = customTheme.id;
      const originalProfileId = customTheme.profileId;
      const originalCreatedAt = customTheme.createdAt;

      const modified = customTheme
        .cloneWithNewName('Updated Theme')
        .cloneWithNewMode('light')
        .cloneWithNewColors('#ff0000', '#00ff00')
        .cloneWithNewPrimaryColor('#0000ff')
        .cloneWithNewSecondaryColor('#ffff00');

      expect(modified.id).toBe(originalId);
      expect(modified.profileId).toBe(originalProfileId);
      expect(modified.createdAt).toEqual(originalCreatedAt);
      expect(modified.name).toBe('Updated Theme');
      expect(modified.mode).toBe('light');
      expect(modified.primaryColor).toBe('#0000ff');
      expect(modified.secondaryColor).toBe('#ffff00');
    });

    it('should handle color comparison edge cases', () => {
      const theme1 = createTestCustomThemeModel({
        primaryColor: '#123456',
        secondaryColor: '#abcdef',
      });
      const theme2 = createTestCustomThemeModel({
        primaryColor: '#123456',
        secondaryColor: '#ABCDEF', // Different case
      });
      const theme3 = createTestCustomThemeModel({
        primaryColor: '#123456',
        secondaryColor: '#abcdef',
      });

      expect(theme1.hasSameColors(theme2)).toBe(false);
      expect(theme1.hasSameColors(theme3)).toBe(true);
    });

    it('should handle complex theme scenarios', () => {
      const theme = createTestCustomThemeModel({
        name: 'Professional Dark Theme v2.1',
        mode: 'dark',
        primaryColor: '#1e1e1e',
        secondaryColor: '#2d2d30',
      });

      expect(theme.isDarkMode()).toBe(true);
      expect(theme.isLightMode()).toBe(false);
      expect(theme.getDisplayName()).toBe('Professional Dark Theme v2.1 (dark)');

      const lightVersion = theme.cloneWithNewMode('light').cloneWithNewColors('#ffffff', '#f5f5f5');

      expect(lightVersion.isDarkMode()).toBe(false);
      expect(lightVersion.isLightMode()).toBe(true);
      expect(lightVersion.getDisplayName()).toBe('Professional Dark Theme v2.1 (light)');
      expect(theme.hasSameColors(lightVersion)).toBe(false);
    });

    it('should handle extreme hex color values', () => {
      const extremeTheme = createTestCustomThemeModel({
        primaryColor: '#000000', // Pure black
        secondaryColor: '#ffffff', // Pure white
      });

      expect(extremeTheme.validate().success).toBe(true);
      expect(extremeTheme.primaryColor).toBe('#000000');
      expect(extremeTheme.secondaryColor).toBe('#ffffff');
    });

    it('should work correctly with theme modes and helper methods', () => {
      const themes = ['light', 'dark'] as const;

      themes.forEach((mode) => {
        const theme = createTestCustomThemeModel({ mode });

        if (mode === 'dark') {
          expect(theme.isDarkMode()).toBe(true);
          expect(theme.isLightMode()).toBe(false);
        } else {
          expect(theme.isDarkMode()).toBe(false);
          expect(theme.isLightMode()).toBe(true);
        }

        expect(theme.getDisplayName()).toContain(`(${mode})`);
      });
    });
  });
});
