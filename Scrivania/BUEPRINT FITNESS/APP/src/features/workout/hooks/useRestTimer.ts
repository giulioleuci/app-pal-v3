import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRestTimerResult {
  timeRemaining: number;
  formattedTime: string;
  isActive: boolean;
  start: (duration: number) => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

/**
 * Hook for managing rest periods between sets with countdown functionality.
 *
 * Provides rest timer management with countdown display, pause/resume capability,
 * and skip functionality. Essential for proper workout pacing and recovery timing.
 * Uses browser timers and integrates with existing profile rest preferences.
 *
 * @param defaultRest Default rest duration in seconds (optional)
 * @returns Object with timer controls and formatted countdown display
 *
 * @example
 * ```typescript
 * const restTimer = useRestTimer(90); // 90 second default
 *
 * // Start rest timer after completing a set
 * const handleSetComplete = () => {
 *   restTimer.start(120); // 2 minute rest
 * };
 *
 * // Display countdown in UI
 * return (
 *   <Box>
 *     <Typography variant="h3" color={restTimer.timeRemaining <= 10 ? 'error' : 'primary'}>
 *       {restTimer.formattedTime}
 *     </Typography>
 *     <Button onClick={restTimer.skip}>Skip Rest</Button>
 *   </Box>
 * );
 * ```
 */
export function useRestTimer(defaultRest: number = 60): UseRestTimerResult {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  /**
   * Formats seconds into MM:SS format for countdown display
   */
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Starts the rest timer with the specified duration
   */
  const start = useCallback(
    (duration: number) => {
      // Handle edge cases
      if (duration <= 0) {
        setIsActive(false);
        setTimeRemaining(duration);
        return;
      }

      // Guard: Don't restart if timer is already active with time remaining
      if (isActive && timeRemaining > 0) {
        return;
      }

      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsActive(true);
      setTimeRemaining(duration);
      endTimeRef.current = Date.now() + duration * 1000;

      intervalRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

          setTimeRemaining(remaining);

          if (remaining === 0) {
            setIsActive(false);
            endTimeRef.current = null;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }, 1000);
    },
    [isActive, timeRemaining]
  );

  /**
   * Pauses/resumes the rest timer (toggle function)
   */
  const pause = useCallback(() => {
    if (isActive) {
      // Pause: Timer is currently active, so pause it
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      endTimeRef.current = null;
      setIsActive(false);
    } else if (timeRemaining > 0) {
      // Resume: Timer is paused with time remaining, so resume it
      setIsActive(true);
      endTimeRef.current = Date.now() + timeRemaining * 1000;

      intervalRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

          setTimeRemaining(remaining);

          if (remaining === 0) {
            setIsActive(false);
            endTimeRef.current = null;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }, 1000);
    }
    // If timer is not active and has no time remaining, do nothing
  }, [isActive, timeRemaining]);

  /**
   * Resets the rest timer to initial state
   */
  const reset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
    endTimeRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Skips the remaining rest time and stops the timer
   */
  const skip = useCallback(() => {
    reset();
  }, [reset]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formattedTime = formatTime(timeRemaining);

  return {
    timeRemaining,
    formattedTime,
    isActive,
    start,
    pause,
    reset,
    skip,
  };
}
