import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    // Use fake timers to control setTimeout behavior
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up timers and restore real timers
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('basic debouncing functionality', () => {
    it('should return initial value immediately', () => {
      // Arrange
      const initialValue = 'initial-value';
      const delay = 300;

      // Act
      const { result } = renderHook(() => useDebouncedValue(initialValue, delay));

      // Assert
      expect(result.current).toBe(initialValue);
    });

    it('should debounce value updates with standard delay', () => {
      // Arrange
      const initialValue = 'initial';
      const newValue = 'updated';
      const delay = 300;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Assert initial state
      expect(result.current).toBe(initialValue);

      // Act - update value
      rerender({ value: newValue, delay });

      // Assert - value should not update immediately
      expect(result.current).toBe(initialValue);

      // Act - advance timers by delay amount
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - value should now be updated
      expect(result.current).toBe(newValue);
    });

    it('should cancel previous timeout when value changes rapidly', () => {
      // Arrange
      const delay = 300;
      const values = ['value1', 'value2', 'value3'];

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: values[0], delay },
        }
      );

      // Act - rapid value changes
      values.slice(1).forEach((value) => {
        rerender({ value, delay });
        act(() => {
          vi.advanceTimersByTime(delay / 2); // Don't complete the delay
        });
      });

      // Assert - should still have initial value
      expect(result.current).toBe(values[0]);

      // Act - complete the final delay
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - should have the last value
      expect(result.current).toBe(values[values.length - 1]);
    });

    it('should handle multiple consecutive updates correctly', () => {
      // Arrange
      const delay = 200;
      let currentValue = 'initial';

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: currentValue, delay },
        }
      );

      // Act & Assert - multiple updates with full delays
      const updates = ['first', 'second', 'third'];

      for (const update of updates) {
        currentValue = update;
        rerender({ value: currentValue, delay });

        act(() => {
          vi.advanceTimersByTime(delay);
        });

        expect(result.current).toBe(update);
      }
    });
  });

  describe('different delay values', () => {
    it('should work with zero delay', () => {
      // Arrange
      const initialValue = 'initial';
      const newValue = 'updated';
      const delay = 0;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });

      // Act - advance timers (even 0ms setTimeout is async)
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      expect(result.current).toBe(newValue);
    });

    it('should handle negative delay as zero delay', () => {
      // Arrange
      const initialValue = 'initial';
      const newValue = 'updated';
      const delay = -100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });

      // Act - advance timers
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      expect(result.current).toBe(newValue);
    });

    it('should work with very large delays', () => {
      // Arrange
      const initialValue = 'initial';
      const newValue = 'updated';
      const delay = 10000; // 10 seconds

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });

      // Assert - value should not update before delay
      act(() => {
        vi.advanceTimersByTime(delay - 1);
      });
      expect(result.current).toBe(initialValue);

      // Assert - value should update after delay
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe(newValue);
    });

    it('should handle changing delay values', () => {
      // Arrange
      const value = 'test-value';
      const newValue = 'new-value';
      let delay = 300;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value, delay },
        }
      );

      // Act - change value and delay
      delay = 500;
      rerender({ value: newValue, delay });

      // Assert - should use new delay
      act(() => {
        vi.advanceTimersByTime(300); // Old delay amount
      });
      expect(result.current).toBe(value); // Should not update yet

      act(() => {
        vi.advanceTimersByTime(200); // Complete new delay (500ms total)
      });
      expect(result.current).toBe(newValue);
    });
  });

  describe('different value types', () => {
    it('should handle string values', () => {
      // Arrange
      const initialValue = 'hello';
      const newValue = 'world';
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toBe(newValue);
      expect(typeof result.current).toBe('string');
    });

    it('should handle number values', () => {
      // Arrange
      const initialValue = 42;
      const newValue = 100;
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toBe(newValue);
      expect(typeof result.current).toBe('number');
    });

    it('should handle boolean values', () => {
      // Arrange
      const initialValue = true;
      const newValue = false;
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toBe(newValue);
      expect(typeof result.current).toBe('boolean');
    });

    it('should handle object values', () => {
      // Arrange
      const initialValue = { name: 'John', age: 30 };
      const newValue = { name: 'Jane', age: 25 };
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toEqual(newValue);
      expect(result.current).not.toBe(initialValue); // Different reference
      expect(typeof result.current).toBe('object');
    });

    it('should handle array values', () => {
      // Arrange
      const initialValue = [1, 2, 3];
      const newValue = [4, 5, 6];
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: initialValue, delay },
        }
      );

      // Act
      rerender({ value: newValue, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toEqual(newValue);
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('should handle null and undefined values', () => {
      // Arrange
      const delay = 100;

      // Test null
      const { result: nullResult, rerender: rerenderNull } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial' as string | null, delay },
        }
      );

      rerenderNull({ value: null, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      expect(nullResult.current).toBeNull();

      // Test undefined
      const { result: undefinedResult, rerender: rerenderUndefined } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial' as string | undefined, delay },
        }
      );

      rerenderUndefined({ value: undefined, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      expect(undefinedResult.current).toBeUndefined();
    });
  });

  describe('rapid value changes and debounce timing', () => {
    it('should only update after the last change in rapid succession', () => {
      // Arrange
      const delay = 300;
      const values = ['a', 'b', 'c', 'd', 'e'];
      let currentValue = values[0];

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: currentValue, delay },
        }
      );

      // Act - rapid changes with short intervals
      values.slice(1).forEach((value, index) => {
        currentValue = value;
        rerender({ value: currentValue, delay });

        // Advance time by less than the delay
        act(() => {
          vi.advanceTimersByTime(50);
        });

        // Should still have initial value
        expect(result.current).toBe(values[0]);
      });

      // Act - complete the final delay
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - should have the final value
      expect(result.current).toBe(values[values.length - 1]);
    });

    it('should handle high-frequency updates efficiently', () => {
      // Arrange
      const delay = 100;
      const updateCount = 1000;
      let currentValue = 'initial';

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: currentValue, delay },
        }
      );

      // Act - simulate high-frequency updates
      for (let i = 0; i < updateCount; i++) {
        currentValue = `value-${i}`;
        rerender({ value: currentValue, delay });

        act(() => {
          vi.advanceTimersByTime(1); // Very short time between updates
        });
      }

      // Should still have initial value
      expect(result.current).toBe('initial');

      // Act - complete the final delay
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - should have the final value
      expect(result.current).toBe(`value-${updateCount - 1}`);
    });

    it('should respect timing between batches of updates', () => {
      // Arrange
      const delay = 200;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act - first batch of updates
      rerender({ value: 'batch1', delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });
      expect(result.current).toBe('batch1');

      // Act - second batch after some time
      rerender({ value: 'batch2', delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });
      expect(result.current).toBe('batch2');

      // Act - third batch with rapid changes
      rerender({ value: 'batch3-a', delay });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ value: 'batch3-final', delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });
      expect(result.current).toBe('batch3-final');
    });
  });

  describe('hook cleanup and memory leak prevention', () => {
    it('should cleanup timeout on unmount', () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const delay = 300;

      const { unmount, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act - trigger a pending timeout
      rerender({ value: 'updated', delay });

      // Assert - clearTimeout should not have been called yet
      const initialCallCount = clearTimeoutSpy.mock.calls.length;

      // Act - unmount before timeout completes
      unmount();

      // Assert - clearTimeout should have been called during cleanup
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(initialCallCount + 1);

      clearTimeoutSpy.mockRestore();
    });

    it('should handle multiple unmounts gracefully', () => {
      // Arrange
      const delay = 100;
      const hooks = Array.from({ length: 5 }, () =>
        renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
          initialProps: { value: 'test', delay },
        })
      );

      // Act - update all hooks to create pending timeouts
      hooks.forEach(({ rerender }) => {
        rerender({ value: 'updated', delay });
      });

      // Act - unmount all hooks
      hooks.forEach(({ unmount }) => {
        expect(() => unmount()).not.toThrow();
      });

      // Assert - no timeouts should fire after unmount
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Test should complete without errors
    });

    it('should not cause memory leaks with rapid mount/unmount cycles', () => {
      // Arrange
      const delay = 100;
      const cycles = 50;

      // Act - rapid mount/unmount cycles
      for (let i = 0; i < cycles; i++) {
        const { unmount, rerender } = renderHook(
          ({ value, delay }) => useDebouncedValue(value, delay),
          {
            initialProps: { value: `value-${i}`, delay },
          }
        );

        // Trigger debounce
        rerender({ value: `updated-${i}`, delay });

        // Unmount immediately
        unmount();
      }

      // Assert - advance time to ensure no pending timeouts
      act(() => {
        vi.runAllTimers();
      });

      // Test should complete without memory issues
    });

    it('should cleanup previous timeouts when value changes', () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const delay = 200;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      const initialCallCount = clearTimeoutSpy.mock.calls.length;

      // Act - multiple rapid value changes
      const changes = ['change1', 'change2', 'change3'];
      changes.forEach((change) => {
        rerender({ value: change, delay });
      });

      // Assert - clearTimeout should be called for each change (except the first)
      expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(initialCallCount);

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle fractional delay values', () => {
      // Arrange - JavaScript truncates fractional delays to integers
      const delay = 100.9;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act
      rerender({ value: 'updated', delay });

      // Assert - setTimeout truncates to 100ms, so it should complete at 100ms
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle same value updates correctly', () => {
      // Arrange
      const value = 'same-value';
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value, delay },
        }
      );

      // Act - update with same value
      rerender({ value, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - should still work correctly
      expect(result.current).toBe(value);
    });

    it('should handle complex object reference changes', () => {
      // Arrange
      const delay = 100;
      const obj = { nested: { value: 'test' } };

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: obj, delay },
        }
      );

      // Act - update with new object with same content
      const newObj = { nested: { value: 'test' } };
      rerender({ value: newObj, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - should update to new reference
      expect(result.current).toEqual(newObj);
      expect(result.current).not.toBe(obj);
    });

    it('should handle very rapid delay changes', () => {
      // Arrange
      const delay = 100;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act - rapid delay changes with value update
      rerender({ value: 'updated', delay: 50 });
      rerender({ value: 'updated', delay: 200 });
      rerender({ value: 'updated', delay: 75 });

      // Assert - should use the latest delay
      act(() => {
        vi.advanceTimersByTime(74);
      });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('TypeScript type safety and generic behavior', () => {
    it('should maintain string type through debouncing', () => {
      // Arrange
      const delay = 100;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue<string>(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act
      rerender({ value: 'updated', delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - TypeScript type checking
      const debouncedValue: string = result.current;
      expect(typeof debouncedValue).toBe('string');
      expect(debouncedValue).toBe('updated');
    });

    it('should maintain number type through debouncing', () => {
      // Arrange
      const delay = 100;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue<number>(value, delay),
        {
          initialProps: { value: 42, delay },
        }
      );

      // Act
      rerender({ value: 100, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - TypeScript type checking
      const debouncedValue: number = result.current;
      expect(typeof debouncedValue).toBe('number');
      expect(debouncedValue).toBe(100);
    });

    it('should maintain complex object type through debouncing', () => {
      // Arrange
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const delay = 100;
      const initialUser: User = { id: 1, name: 'John', email: 'john@example.com' };
      const updatedUser: User = { id: 2, name: 'Jane', email: 'jane@example.com' };

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue<User>(value, delay),
        {
          initialProps: { value: initialUser, delay },
        }
      );

      // Act
      rerender({ value: updatedUser, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - TypeScript type checking
      const debouncedUser: User = result.current;
      expect(debouncedUser.id).toBe(2);
      expect(debouncedUser.name).toBe('Jane');
      expect(debouncedUser.email).toBe('jane@example.com');
    });

    it('should handle union types correctly', () => {
      // Arrange
      type StringOrNumber = string | number;
      const delay = 100;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue<StringOrNumber>(value, delay),
        {
          initialProps: { value: 'initial' as StringOrNumber, delay },
        }
      );

      // Act - change from string to number
      rerender({ value: 42, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - TypeScript type checking
      const debouncedValue: StringOrNumber = result.current;
      expect(debouncedValue).toBe(42);
      expect(typeof debouncedValue).toBe('number');

      // Act - change back to string
      rerender({ value: 'string again', delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      expect(result.current).toBe('string again');
      expect(typeof result.current).toBe('string');
    });

    it('should handle optional types correctly', () => {
      // Arrange
      const delay = 100;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue<string | undefined>(value, delay),
        {
          initialProps: { value: 'initial' as string | undefined, delay },
        }
      );

      // Act - change to undefined
      rerender({ value: undefined, delay });
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert - TypeScript type checking
      const debouncedValue: string | undefined = result.current;
      expect(debouncedValue).toBeUndefined();
    });
  });

  describe('performance characteristics', () => {
    it('should handle consistent performance under load', () => {
      // Arrange
      const delay = 10;
      const iterations = 1000;

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      const startTime = performance.now();

      // Act - many rapid updates
      for (let i = 0; i < iterations; i++) {
        rerender({ value: `value-${i}`, delay });
      }

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      const endTime = performance.now();

      // Assert - should complete reasonably quickly and have final value
      expect(result.current).toBe(`value-${iterations - 1}`);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should not accumulate memory with long-running usage', () => {
      // Arrange
      const delay = 10;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act - simulate long-running usage with periodic updates
      for (let cycle = 0; cycle < 10; cycle++) {
        // Burst of updates
        for (let i = 0; i < 20; i++) {
          rerender({ value: `cycle-${cycle}-value-${i}`, delay });
          act(() => {
            vi.advanceTimersByTime(1);
          });
        }

        // Complete debounce
        act(() => {
          vi.advanceTimersByTime(delay);
        });

        expect(result.current).toBe(`cycle-${cycle}-value-19`);
      }

      // Test should complete without memory issues
    });

    it('should maintain consistent behavior with different delay patterns', () => {
      // Arrange
      const delays = [0, 1, 10, 100, 500];
      const testValue = 'test-value';

      delays.forEach((delay) => {
        const { result, rerender } = renderHook(
          ({ value, delay }) => useDebouncedValue(value, delay),
          {
            initialProps: { value: 'initial', delay },
          }
        );

        // Act
        rerender({ value: testValue, delay });
        act(() => {
          vi.advanceTimersByTime(delay);
        });

        // Assert
        expect(result.current).toBe(testValue);
      });
    });
  });

  describe('integration with React lifecycle', () => {
    it('should work correctly with React.StrictMode behavior', () => {
      // Arrange
      const delay = 100;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act - simulate StrictMode double-rendering
      rerender({ value: 'updated', delay });
      rerender({ value: 'updated', delay }); // StrictMode double render

      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toBe('updated');
    });

    it('should handle concurrent updates properly', () => {
      // Arrange
      const delay = 100;
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        {
          initialProps: { value: 'initial', delay },
        }
      );

      // Act - simulate concurrent updates
      rerender({ value: 'update1', delay });

      // Partial advance
      act(() => {
        vi.advanceTimersByTime(delay / 2);
      });

      rerender({ value: 'update2', delay });

      // Complete the new debounce period
      act(() => {
        vi.advanceTimersByTime(delay);
      });

      // Assert
      expect(result.current).toBe('update2');
    });
  });
});
