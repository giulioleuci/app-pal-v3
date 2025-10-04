import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWorkoutTimerResult {
  elapsedTime: string;
  formattedTime: string;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * Hook for tracking overall workout duration with start/pause/reset functionality.
 *
 * Provides real-time elapsed time tracking for workout sessions, formatted for UI display.
 * Uses browser timer APIs for accurate time tracking with pause/resume capability.
 * Essential for workout session management and user motivation through duration display.
 *
 * @returns Object with timer controls and formatted time display
 *
 * @example
 * ```typescript
 * const { elapsedTime, formattedTime, isRunning, start, pause, reset } = useWorkoutTimer();
 *
 * // Start timing when workout begins
 * const handleStartWorkout = () => {
 *   start();
 * };
 *
 * // Display formatted time in UI
 * return (
 *   <Box>
 *     <Typography variant="h4">{formattedTime}</Typography>
 *     <Button onClick={isRunning ? pause : start}>
 *       {isRunning ? 'Pause' : 'Start'}
 *     </Button>
 *   </Box>
 * );
 * ```
 */
export function useWorkoutTimer(): UseWorkoutTimerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Formats seconds into MM:SS or HH:MM:SS format
   */
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Starts or resumes the workout timer
   */
  const start = useCallback(() => {
    if (isRunning) return;

    // Clear any existing interval first to prevent double-intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [isRunning]);

  /**
   * Pauses the workout timer
   */
  const pause = useCallback(() => {
    if (!isRunning) return;

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning]);

  /**
   * Resets the workout timer to zero
   */
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const elapsedTime = `${elapsedSeconds}s`;
  const formattedTime = formatTime(elapsedSeconds);

  return {
    elapsedTime,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
  };
}
