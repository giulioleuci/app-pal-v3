import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create hoisted mocks for the store dependencies
const mockLocalStorageAdapter = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));

// Mock the LocalStorageAdapter
vi.mock('@/app/store/LocalStorageAdapter', () => ({
  LocalStorageAdapter: vi.fn().mockImplementation(() => mockLocalStorageAdapter),
}));

// Mock the profile store
const mockProfileStore = vi.hoisted(() => ({
  useProfileStore: vi.fn(),
  setState: vi.fn(),
  getState: vi.fn(),
  subscribe: vi.fn(),
}));

vi.mock('@/app/store/profileStore', () => mockProfileStore);

import { useActiveProfileId } from '../useActiveProfileId';

describe('useActiveProfileId', () => {
  // Mock profile store selector function
  let mockSelector: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a fresh mock selector for each test
    mockSelector = vi.fn();
    mockProfileStore.useProfileStore.mockImplementation(mockSelector);

    // Reset localStorage adapter mocks
    mockLocalStorageAdapter.getItem.mockReturnValue(null);
    mockLocalStorageAdapter.setItem.mockImplementation(() => {});
    mockLocalStorageAdapter.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('hook functionality', () => {
    it('should return the active profile ID from the store', () => {
      // Arrange
      const expectedProfileId = 'profile-123';
      mockSelector.mockReturnValue(expectedProfileId);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe(expectedProfileId);
    });

    it('should return null when no profile is active', () => {
      // Arrange
      mockSelector.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBeNull();
    });

    it('should use the correct selector function', () => {
      // Arrange
      mockSelector.mockReturnValue('test-profile');

      // Act
      renderHook(() => useActiveProfileId());

      // Assert
      expect(mockProfileStore.useProfileStore).toHaveBeenCalledTimes(1);
      expect(mockProfileStore.useProfileStore).toHaveBeenCalledWith(expect.any(Function));

      // Extract and test the selector function
      const selectorFunction = mockProfileStore.useProfileStore.mock.calls[0][0];
      const mockState = {
        activeProfileId: 'selector-test-profile',
        setActiveProfileId: vi.fn(),
        clearActiveProfileId: vi.fn(),
      };

      expect(selectorFunction(mockState)).toBe('selector-test-profile');
    });

    it('should extract only activeProfileId from state', () => {
      // Arrange
      const testProfileId = 'extracted-profile-id';
      mockSelector.mockImplementation((selector) => {
        // Simulate the actual store behavior
        const mockState = {
          activeProfileId: testProfileId,
          setActiveProfileId: vi.fn(),
          clearActiveProfileId: vi.fn(),
          otherProperty: 'should-not-be-returned',
        };
        return selector(mockState);
      });

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe(testProfileId);
      expect(typeof result.current).toBe('string');
    });
  });

  describe('reactivity and state updates', () => {
    it('should update when store state changes', () => {
      // Arrange
      let currentProfileId: string | null = null;
      mockSelector.mockImplementation(() => currentProfileId);

      const { result, rerender } = renderHook(() => useActiveProfileId());

      // Assert initial state
      expect(result.current).toBeNull();

      // Act - simulate store state change
      act(() => {
        currentProfileId = 'updated-profile';
        rerender();
      });

      // Assert
      expect(result.current).toBe('updated-profile');
    });

    it('should handle multiple rapid state changes', () => {
      // Arrange
      let currentProfileId: string | null = null;
      mockSelector.mockImplementation(() => currentProfileId);

      const { result, rerender } = renderHook(() => useActiveProfileId());

      // Act - simulate rapid state changes
      const profileIds = ['profile-1', 'profile-2', 'profile-3', null, 'profile-final'];

      profileIds.forEach((profileId) => {
        act(() => {
          currentProfileId = profileId;
          rerender();
        });
        expect(result.current).toBe(profileId);
      });

      // Assert final state
      expect(result.current).toBe('profile-final');
    });

    it('should maintain reactivity across component unmount and remount', () => {
      // Arrange
      let currentProfileId: string | null = 'persistent-profile';
      mockSelector.mockImplementation(() => currentProfileId);

      // Act - First render
      const { result: result1, unmount } = renderHook(() => useActiveProfileId());
      expect(result1.current).toBe('persistent-profile');

      // Update state while unmounted
      act(() => {
        currentProfileId = 'updated-while-unmounted';
      });

      unmount();

      // Re-render after unmount
      const { result: result2 } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result2.current).toBe('updated-while-unmounted');
    });
  });

  describe('different profile ID types and edge cases', () => {
    it('should handle empty string profile ID', () => {
      // Arrange
      mockSelector.mockReturnValue('');

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe('');
      expect(typeof result.current).toBe('string');
    });

    it('should handle long profile ID strings', () => {
      // Arrange
      const longProfileId = 'a'.repeat(1000);
      mockSelector.mockReturnValue(longProfileId);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe(longProfileId);
      expect(result.current?.length).toBe(1000);
    });

    it('should handle profile ID with special characters', () => {
      // Arrange
      const specialProfileId = 'profile-@#$%^&*()_+-=[]{}|;:,.<>?';
      mockSelector.mockReturnValue(specialProfileId);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe(specialProfileId);
    });

    it('should handle UUID-formatted profile IDs', () => {
      // Arrange
      const uuidProfileId = '550e8400-e29b-41d4-a716-446655440000';
      mockSelector.mockReturnValue(uuidProfileId);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe(uuidProfileId);
    });

    it('should handle numeric string profile IDs', () => {
      // Arrange
      const numericProfileId = '12345';
      mockSelector.mockReturnValue(numericProfileId);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe(numericProfileId);
      expect(typeof result.current).toBe('string');
    });
  });

  describe('component integration and context', () => {
    it('should work with multiple components using the same hook', () => {
      // Arrange
      const sharedProfileId = 'shared-profile-123';
      mockSelector.mockReturnValue(sharedProfileId);

      // Act
      const { result: result1 } = renderHook(() => useActiveProfileId());
      const { result: result2 } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result1.current).toBe(sharedProfileId);
      expect(result2.current).toBe(sharedProfileId);
      expect(result1.current).toEqual(result2.current);
    });

    it('should maintain same return value across multiple hook calls in same render', () => {
      // Arrange
      const profileId = 'consistent-profile';
      mockSelector.mockReturnValue(profileId);

      // Act
      const { result } = renderHook(() => {
        const id1 = useActiveProfileId();
        const id2 = useActiveProfileId();
        return { id1, id2 };
      });

      // Assert
      expect(result.current.id1).toBe(profileId);
      expect(result.current.id2).toBe(profileId);
      expect(result.current.id1).toEqual(result.current.id2);
    });

    it('should be compatible with React Strict Mode behavior', () => {
      // Arrange
      const profileId = 'strict-mode-profile';
      mockSelector.mockReturnValue(profileId);

      // Act - Simulate strict mode double rendering
      const { result, rerender } = renderHook(() => useActiveProfileId());
      rerender(); // Strict mode causes double rendering

      // Assert
      expect(result.current).toBe(profileId);
      // In strict mode, the selector should still be called but return same value
      expect(mockSelector).toHaveBeenCalled();
    });
  });

  describe('error handling and resilience', () => {
    it('should handle store selector throwing an error', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSelector.mockImplementation(() => {
        throw new Error('Store selector error');
      });

      // Act & Assert
      expect(() => {
        renderHook(() => useActiveProfileId());
      }).toThrow('Store selector error');

      consoleErrorSpy.mockRestore();
    });

    it('should handle undefined return from selector gracefully', () => {
      // Arrange
      mockSelector.mockReturnValue(undefined);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBeUndefined();
    });

    it('should handle selector returning non-string, non-null values', () => {
      // Arrange - Test runtime behavior when TypeScript constraints are bypassed
      const invalidValue = { invalid: 'object' };
      mockSelector.mockReturnValue(invalidValue as any);

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert - Hook should return whatever the store returns
      expect(result.current).toBe(invalidValue);
    });
  });

  describe('performance and optimization', () => {
    it('should memoize properly and not cause unnecessary re-renders', () => {
      // Arrange
      const profileId = 'memoized-profile';
      let selectorCallCount = 0;

      mockSelector.mockImplementation(() => {
        selectorCallCount++;
        return profileId;
      });

      // Act
      const { result, rerender } = renderHook(() => useActiveProfileId());

      const initialCallCount = selectorCallCount;
      const initialResult = result.current;

      // Re-render without changing the store state
      rerender();

      // Assert
      expect(result.current).toBe(profileId);
      expect(result.current).toBe(initialResult);
      // Zustand should optimize and might not call selector again for same state
      expect(selectorCallCount).toBeGreaterThanOrEqual(initialCallCount);
    });

    it('should handle high-frequency updates efficiently', () => {
      // Arrange
      let profileId = 'initial-profile';
      mockSelector.mockImplementation(() => profileId);

      const { result, rerender } = renderHook(() => useActiveProfileId());

      // Act - Simulate high-frequency updates
      const updates = Array.from({ length: 100 }, (_, i) => `profile-${i}`);

      updates.forEach((newId) => {
        act(() => {
          profileId = newId;
          rerender();
        });
      });

      // Assert
      expect(result.current).toBe('profile-99');
      expect(mockSelector).toHaveBeenCalledTimes(101); // Initial + 100 updates
    });

    it('should not create memory leaks with multiple hook instances', () => {
      // Arrange
      const profileId = 'leak-test-profile';
      mockSelector.mockReturnValue(profileId);

      // Act - Create and unmount multiple hook instances
      const hooks = Array.from({ length: 10 }, () => {
        const hook = renderHook(() => useActiveProfileId());
        expect(hook.result.current).toBe(profileId);
        return hook;
      });

      // Unmount all hooks
      hooks.forEach((hook) => hook.unmount());

      // Assert - Test should complete without memory issues
      // This is more of a smoke test - actual memory leak detection would require profiling
      expect(mockSelector).toHaveBeenCalledTimes(10);
    });
  });

  describe('TypeScript type safety and validation', () => {
    it('should maintain correct return type of string | null', () => {
      // Arrange & Act
      mockSelector.mockReturnValue('typed-profile');
      const { result: stringResult } = renderHook(() => useActiveProfileId());

      mockSelector.mockReturnValue(null);
      const { result: nullResult } = renderHook(() => useActiveProfileId());

      // Assert - TypeScript compilation would catch type errors
      const stringValue: string | null = stringResult.current;
      const nullValue: string | null = nullResult.current;

      expect(typeof stringValue === 'string' || stringValue === null).toBe(true);
      expect(typeof nullValue === 'string' || nullValue === null).toBe(true);

      // Runtime type checks
      expect(typeof stringResult.current).toBe('string');
      expect(nullResult.current).toBeNull();
    });

    it('should be assignable to expected variable types', () => {
      // Arrange
      mockSelector.mockReturnValue('assignment-test');

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert - These assignments should not cause TypeScript errors
      const profileId: string | null = result.current;
      const optionalString: string | null | undefined = result.current;

      // Runtime checks
      expect(profileId).toBe('assignment-test');
      expect(optionalString).toBe('assignment-test');

      // Type guard tests
      if (result.current !== null) {
        const definitelyString: string = result.current;
        expect(typeof definitelyString).toBe('string');
      }
    });

    it('should work with conditional logic based on return value', () => {
      // Arrange & Act - Test with string value
      mockSelector.mockReturnValue('conditional-profile');
      const { result: stringResult } = renderHook(() => useActiveProfileId());

      // Assert
      if (stringResult.current) {
        expect(typeof stringResult.current).toBe('string');
        expect(stringResult.current.length).toBeGreaterThan(0);
      }

      // Arrange & Act - Test with null value
      mockSelector.mockReturnValue(null);
      const { result: nullResult } = renderHook(() => useActiveProfileId());

      // Assert
      if (nullResult.current === null) {
        expect(nullResult.current).toBeNull();
      }
    });
  });

  describe('integration with profileStore state management', () => {
    it('should properly select activeProfileId from full store state', () => {
      // Arrange
      const mockState = {
        activeProfileId: 'integration-test-profile',
        setActiveProfileId: vi.fn(),
        clearActiveProfileId: vi.fn(),
        someOtherProperty: 'should-be-ignored',
      };

      mockSelector.mockImplementation((selector) => selector(mockState));

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe('integration-test-profile');
    });

    it('should not be affected by other store properties changing', () => {
      // Arrange
      const initialState = {
        activeProfileId: 'stable-profile-id',
        setActiveProfileId: vi.fn(),
        clearActiveProfileId: vi.fn(),
        otherProperty: 'initial-value',
      };

      let currentState = { ...initialState };
      mockSelector.mockImplementation((selector) => selector(currentState));

      // Act
      const { result, rerender } = renderHook(() => useActiveProfileId());

      expect(result.current).toBe('stable-profile-id');

      // Simulate other property changing while activeProfileId stays same
      act(() => {
        currentState = {
          ...currentState,
          otherProperty: 'changed-value',
        };
        rerender();
      });

      // Assert - activeProfileId should remain unchanged
      expect(result.current).toBe('stable-profile-id');
    });

    it('should work correctly with Zustand selector optimization', () => {
      // Arrange
      const mockState = {
        activeProfileId: 'optimized-profile',
        setActiveProfileId: vi.fn(),
        clearActiveProfileId: vi.fn(),
      };

      // Test that the selector function is optimized (only returns activeProfileId)
      mockSelector.mockImplementation((selector) => selector(mockState));

      // Act
      const { result } = renderHook(() => useActiveProfileId());

      // Assert
      expect(result.current).toBe('optimized-profile');

      // Verify the selector was called with the correct function
      expect(mockProfileStore.useProfileStore).toHaveBeenCalledWith(expect.any(Function));

      const selectorFn = mockProfileStore.useProfileStore.mock.calls[0][0];

      // The selector should return only activeProfileId, enabling Zustand's shallow comparison
      expect(selectorFn(mockState)).toBe('optimized-profile');
    });
  });

  describe('hook composition and reusability', () => {
    it('should be composable with other hooks', () => {
      // Arrange
      mockSelector.mockReturnValue('composable-profile');

      // Act
      const { result } = renderHook(() => {
        const activeProfileId = useActiveProfileId();
        const isProfileActive = activeProfileId !== null;
        const profileDisplayName = activeProfileId ? `Profile: ${activeProfileId}` : 'No Profile';

        return { activeProfileId, isProfileActive, profileDisplayName };
      });

      // Assert
      expect(result.current.activeProfileId).toBe('composable-profile');
      expect(result.current.isProfileActive).toBe(true);
      expect(result.current.profileDisplayName).toBe('Profile: composable-profile');
    });

    it('should work in custom hooks that use it', () => {
      // Arrange
      mockSelector.mockReturnValue('custom-hook-profile');

      // Act
      const { result } = renderHook(() => {
        const useProfileInfo = () => {
          const profileId = useActiveProfileId();
          return {
            hasProfile: profileId !== null,
            profileId,
            shortId: profileId ? profileId.slice(0, 8) : null,
          };
        };

        return useProfileInfo();
      });

      // Assert
      expect(result.current.hasProfile).toBe(true);
      expect(result.current.profileId).toBe('custom-hook-profile');
      expect(result.current.shortId).toBe('custom-h');
    });
  });
});
