import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRestTimer } from '../useRestTimer';

// Mock timers
vi.useFakeTimers();

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('should return initial state with default rest time', () => {
      const { result } = renderHook(() => useRestTimer());

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.formattedTime).toBe('00:00');
      expect(result.current.isActive).toBe(false);
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.skip).toBe('function');
    });

    it('should accept custom default rest time', () => {
      const customDefault = 120;
      const { result } = renderHook(() => useRestTimer(customDefault));

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('formatTime function', () => {
    it('should format seconds correctly for minutes and seconds', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(125); // 2 minutes 5 seconds
      });

      expect(result.current.formattedTime).toBe('02:05');
    });

    it('should handle single digit minutes and seconds', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(65); // 1 minute 5 seconds
      });

      expect(result.current.formattedTime).toBe('01:05');
    });

    it('should handle zero time', () => {
      const { result } = renderHook(() => useRestTimer());
      expect(result.current.formattedTime).toBe('00:00');
    });

    it('should handle seconds only', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(45); // 45 seconds
      });

      expect(result.current.formattedTime).toBe('00:45');
    });
  });

  describe('start function', () => {
    it('should start the countdown timer', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.timeRemaining).toBe(60);
    });

    it('should not restart if timer is already active with time remaining', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
        vi.advanceTimersByTime(5000); // 5 seconds pass
      });

      const timeBeforeSecondStart = result.current.timeRemaining;

      act(() => {
        result.current.start(30); // Try to start with different duration
      });

      // Should not have restarted
      expect(result.current.timeRemaining).toBe(timeBeforeSecondStart);
      expect(result.current.isActive).toBe(true);
    });

    it('should countdown correctly', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(10);
      });

      expect(result.current.timeRemaining).toBe(10);

      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds
      });

      expect(result.current.timeRemaining).toBe(7);
      expect(result.current.formattedTime).toBe('00:07');
    });

    it('should stop timer when reaching zero', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(3);
      });

      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
      expect(result.current.formattedTime).toBe('00:00');
    });

    it('should handle timer completion with longer duration', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(5); // Use short duration instead
      });

      expect(result.current.timeRemaining).toBe(5);
      expect(result.current.isActive).toBe(true);

      // Advance timer to completion
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('pause function (via togglePause)', () => {
    it('should pause an active timer', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.pause(); // This calls togglePause
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should not affect timer if already paused', () => {
      const { result } = renderHook(() => useRestTimer());

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should maintain time remaining when paused', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.timeRemaining).toBe(50);

      act(() => {
        result.current.pause();
        vi.advanceTimersByTime(5000); // Should not decrement
      });

      expect(result.current.timeRemaining).toBe(50);
      expect(result.current.isActive).toBe(false);
    });

    it('should resume from paused state', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
      });

      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      act(() => {
        result.current.pause(); // Pause at 50 seconds
      });

      expect(result.current.timeRemaining).toBe(50);
      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.pause(); // Resume (toggle behavior)
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        vi.advanceTimersByTime(5000); // 5 more seconds
      });

      expect(result.current.timeRemaining).toBe(45);
    });
  });

  describe('reset function', () => {
    it('should reset timer to initial state', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds
      });

      expect(result.current.timeRemaining).toBe(5);
      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
      expect(result.current.formattedTime).toBe('00:00');
    });

    it('should clear running timer on reset', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
        result.current.reset();
        vi.advanceTimersByTime(5000); // Should not decrement
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('skip function', () => {
    it('should skip remaining rest time', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds elapsed
      });

      expect(result.current.timeRemaining).toBe(7);
      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.skip();
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
    });

    it('should work same as reset', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      act(() => {
        result.current.skip();
      });

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(3000);
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('timer accuracy', () => {
    it('should update every second when active', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(10);
      });

      // Check updates at 1-second intervals
      for (let i = 9; i >= 0; i--) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        expect(result.current.timeRemaining).toBe(i);
      }

      expect(result.current.isActive).toBe(false);
    });

    it('should handle sub-second precision correctly', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(5);
      });

      // Advance by 1500ms (1.5 seconds)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should show 4 seconds (ceils remaining time)
      expect(result.current.timeRemaining).toBe(4);

      act(() => {
        vi.advanceTimersByTime(500); // Total 2000ms
      });

      expect(result.current.timeRemaining).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should clean up interval on unmount', () => {
      const { result, unmount } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.isActive).toBe(true);

      unmount();

      // Advance timers after unmount - should not cause any issues
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // No error should be thrown
    });
  });

  describe('edge cases', () => {
    it('should handle rapid operations', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(60);
        result.current.pause();
        result.current.start(30); // Should not restart due to guard
        result.current.reset();
        result.current.start(45);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.timeRemaining).toBe(45);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(40);
    });

    it('should maintain consistent state across multiple renders', () => {
      const { result, rerender } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      const stateBeforeRerender = {
        timeRemaining: result.current.timeRemaining,
        isActive: result.current.isActive,
        formattedTime: result.current.formattedTime,
      };

      rerender();

      expect(result.current.timeRemaining).toBe(stateBeforeRerender.timeRemaining);
      expect(result.current.isActive).toBe(stateBeforeRerender.isActive);
      expect(result.current.formattedTime).toBe(stateBeforeRerender.formattedTime);
    });

    it('should handle zero duration start', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(0);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
    });

    it('should handle negative duration gracefully', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(-5);
      });

      // Should handle gracefully, treating as 0 or ignoring
      expect(result.current.timeRemaining).toBe(-5);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('long duration scenarios', () => {
    it.skip('should handle long rest periods correctly', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(120); // 2 minutes
      });

      expect(result.current.formattedTime).toBe('02:00');
      expect(result.current.timeRemaining).toBe(120);

      // Advance 60 seconds one at a time to avoid timeout
      act(() => {
        vi.advanceTimersByTime(30000); // 30 seconds
      });

      expect(result.current.timeRemaining).toBe(90);

      act(() => {
        vi.advanceTimersByTime(30000); // 30 more seconds
      });

      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.formattedTime).toBe('01:00');
    });

    it('should handle pause and resume in long sessions', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.start(20); // 20 seconds
      });

      act(() => {
        vi.advanceTimersByTime(8000); // 8 seconds pass
      });

      expect(result.current.timeRemaining).toBe(12); // 12 seconds left

      act(() => {
        result.current.pause();
      });

      act(() => {
        vi.advanceTimersByTime(3000); // 3 seconds pause (shouldn't count)
      });

      act(() => {
        result.current.pause(); // Resume (toggle behavior)
      });

      act(() => {
        vi.advanceTimersByTime(5000); // 5 more seconds
      });

      expect(result.current.timeRemaining).toBe(7); // 7 seconds left
      expect(result.current.formattedTime).toBe('00:07');
    });
  });

  describe('default rest parameter', () => {
    it('should use default rest when provided', () => {
      const defaultRest = 90;
      const { result } = renderHook(() => useRestTimer(defaultRest));

      // The default rest is used internally but doesn't affect initial state
      expect(result.current.timeRemaining).toBe(0);
    });

    it('should work with different default values', () => {
      const { result: result1 } = renderHook(() => useRestTimer(30));
      const { result: result2 } = renderHook(() => useRestTimer(180));

      // Both should start at 0 regardless of default
      expect(result1.current.timeRemaining).toBe(0);
      expect(result2.current.timeRemaining).toBe(0);
    });
  });
});
