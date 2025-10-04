import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from 'tsyringe';

import type { IAdvancedSetStatePersistence } from '../data/AdvancedSetStatePersistence';
import type { AdvancedSetExecutionState } from '../services/AdvancedSetExecutionService';
import type { AdvancedSetExecutionSession } from '../store/advancedSetExecutionStore';
import { useAdvancedSetExecutionStore } from '../store/advancedSetExecutionStore';

/**
 * Result interface for the advanced set progress tracking hook
 */
export interface UseAdvancedSetProgressResult {
  // Progress tracking
  activeSession: AdvancedSetExecutionSession | null;
  hasActiveProgress: boolean;
  canResume: boolean;

  // Session metadata
  sessionId: string | null;
  startTime: Date | null;
  lastActiveTime: Date | null;
  totalTimeElapsed: number; // in seconds

  // Progress data
  executionState: AdvancedSetExecutionState | null;
  completedSets: number;
  currentPhase: number;
  totalPhases: number;
  progressPercentage: number;

  // Persistence actions
  saveProgress: () => Promise<void>;
  resumeProgress: () => Promise<AdvancedSetExecutionSession | null>;
  clearProgress: () => Promise<void>;

  // Backup and restoration
  createBackup: () => Promise<string>; // Returns backup ID
  restoreFromBackup: (backupId: string) => Promise<void>;
  listBackups: () => Promise<Array<{ id: string; timestamp: Date; setType: string }>>;

  // Auto-save management
  isAutoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  lastSaveTime: Date | null;

  // Loading and error states
  isLoading: boolean;
  isSaving: boolean;
  isClearing: boolean;
  error: string | null;
}

/**
 * Hook for tracking and resuming advanced set execution progress.
 *
 * This hook manages persistence of advanced set execution state, allowing users
 * to resume interrupted sessions across app restarts or crashes. It provides
 * automatic saving, manual backup/restore, and progress tracking capabilities.
 *
 * Features:
 * - Automatic progress persistence across app restarts
 * - Manual save/restore with backup management
 * - Progress tracking and metadata
 * - Auto-save configuration
 * - Error recovery and validation
 *
 * @param profileId - The profile ID for scoping operations
 * @param setId - Optional specific session ID to track (defaults to current active session)
 * @returns Progress tracking and persistence interface
 *
 * @example
 * ```typescript
 * const progress = useAdvancedSetProgress('profile-1');
 *
 * // Check for resumable progress
 * if (progress.canResume && progress.activeSession) {
 *   return (
 *     <Card>
 *       <Typography>Resume {progress.activeSession.setType} set?</Typography>
 *       <Typography>
 *         Progress: {progress.completedSets} sets completed
 *         ({progress.progressPercentage}%)
 *       </Typography>
 *       <Typography>
 *         Started: {format(progress.startTime, 'MMM dd, HH:mm')}
 *       </Typography>
 *       <Button onClick={progress.resumeProgress}>
 *         Resume Session
 *       </Button>
 *       <Button onClick={progress.clearProgress} color="secondary">
 *         Start Fresh
 *       </Button>
 *     </Card>
 *   );
 * }
 *
 * // During execution - auto-save is enabled by default
 * useEffect(() => {
 *   if (executionState?.currentPhase) {
 *     progress.saveProgress(); // Manual save at key points
 *   }
 * }, [executionState?.currentPhase]);
 *
 * // Create backup before risky operations
 * const handleExperimentalFeature = async () => {
 *   const backupId = await progress.createBackup();
 *   try {
 *     // Risky operation
 *   } catch (_error) {
 *     await progress.restoreFromBackup(backupId);
 *   }
 * };
 *
 * // List available backups for user selection
 * const backups = await progress.listBackups();
 * backups.forEach(backup => {
 *   console.log(`${backup.setType} - ${format(backup.timestamp, 'MMM dd, HH:mm')}`);
 * });
 * ```
 */
export function useAdvancedSetProgress(
  profileId: string,
  setId?: string
): UseAdvancedSetProgressResult {
  const persistence = container.resolve<IAdvancedSetStatePersistence>(
    'IAdvancedSetStatePersistence'
  );
  const queryClient = useQueryClient();
  const storeHook = useAdvancedSetExecutionStore();
  // Handle both the real Zustand store and mocked store for testing
  const store = typeof storeHook === 'function' ? storeHook() : storeHook;

  // Local state
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get active session from store or specific session by ID
  // Use stable reference to prevent infinite re-renders
  const activeSession = useMemo(() => {
    if (!store) return null;
    const session = setId ? store.getSession?.(setId) : store.getCurrentSession?.();
    return session || null;
  }, [setId, store, store?.activeSessions, store?.currentSessionId]);

  // Load persisted sessions from database
  const { data: persistedSessions = [], isLoading } = useQuery({
    queryKey: ['advancedSetProgress', profileId],
    queryFn: async () => {
      const result = await persistence.loadSessionsForProfile(profileId);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Failed to load progress');
      }
      return result.getValue();
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: !!profileId,
  });

  // Sync persisted sessions to store on load
  useEffect(() => {
    if (!store || persistedSessions.length === 0) return;

    persistedSessions.forEach((session) => {
      // Only restore if not already in store
      if (!store.getSession?.(session.id)) {
        store.createSession?.({
          profileId: session.profileId,
          workoutLogId: session.workoutLogId,
          exerciseId: session.exerciseId,
          setType: session.setType,
          setConfigurationJson: session.setConfigurationJson,
          executionState: session.executionState!,
        });
      }
    });
  }, [persistedSessions, store]);

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) {
        throw new Error('No active session to save');
      }

      const result = await persistence.saveSession(activeSession);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Failed to save progress');
      }

      return activeSession;
    },
    onSuccess: () => {
      setLastSaveTime(new Date());
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['advancedSetProgress', profileId] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Resume progress mutation
  const resumeProgressMutation = useMutation({
    mutationFn: async (): Promise<AdvancedSetExecutionSession | null> => {
      if (!activeSession) {
        return null;
      }

      // Update last active time
      store.updateTimerState(activeSession.id, {
        ...activeSession.timerState,
      });

      return activeSession;
    },
    onSuccess: (session) => {
      if (session) {
        store.setCurrentSession(session.id);
      }
    },
  });

  // Clear progress mutation
  const clearProgressMutation = useMutation({
    mutationFn: async () => {
      if (activeSession) {
        // Remove from store
        store.abortSession(activeSession.id);

        // Remove from persistence
        const result = await persistence.deleteSession(activeSession.id);
        if (result.isFailure) {
          throw new Error(result.error?.message || 'Failed to clear progress');
        }
      }
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['advancedSetProgress', profileId] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Backup creation mutation
  const createBackupMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      if (!activeSession) {
        throw new Error('No active session to backup');
      }

      // Create backup with timestamp
      const backupId = `${activeSession.id}_backup_${Date.now()}`;
      const backupSession: AdvancedSetExecutionSession = {
        ...activeSession,
        id: backupId,
        metadata: {
          ...activeSession.metadata,
          createdAt: Date.now(),
        },
      };

      const result = await persistence.saveSession(backupSession);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Failed to create backup');
      }

      return backupId;
    },
  });

  // Restore from backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const result = await persistence.loadSession(backupId);
      if (result.isFailure) {
        throw new Error(result.error?.message || 'Failed to load backup');
      }

      const backupSession = result.getValue();
      if (!backupSession) {
        throw new Error('Backup not found');
      }

      // Restore to current session with new ID
      const restoredId = store.createSession({
        profileId: backupSession.profileId,
        workoutLogId: backupSession.workoutLogId,
        exerciseId: backupSession.exerciseId,
        setType: backupSession.setType,
        setConfigurationJson: backupSession.setConfigurationJson,
        executionState: backupSession.executionState!,
      });

      // Set as current session
      store.setCurrentSession(restoredId);

      return restoredId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advancedSetProgress', profileId] });
    },
  });

  // Auto-save effect with stable dependencies
  useEffect(() => {
    if (
      !isAutoSaveEnabled ||
      !activeSession?.executionState ||
      activeSession.executionState.isCompleted
    ) {
      return;
    }

    const autoSaveInterval = setInterval(() => {
      saveProgressMutation.mutate();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isAutoSaveEnabled, activeSession?.id, activeSession?.executionState?.isCompleted]);

  // Computed values
  const hasActiveProgress = activeSession !== null;
  const canResume =
    hasActiveProgress && activeSession?.executionState && !activeSession.executionState.isCompleted;

  const startTime = activeSession ? new Date(activeSession.metadata.createdAt) : null;
  const lastActiveTime = activeSession ? new Date(activeSession.metadata.lastActiveAt) : null;

  const totalTimeElapsed = useMemo(() => {
    if (!activeSession) return 0;
    return Math.floor((Date.now() - activeSession.metadata.createdAt) / 1000);
  }, [activeSession?.id, activeSession?.metadata.createdAt]);

  const executionState = activeSession?.executionState || null;
  const completedSets = activeSession?.completedSets?.length || 0;
  const currentPhase = executionState?.currentPhase || 0;
  const totalPhases = executionState?.totalPhases || 0;
  const progressPercentage = totalPhases > 0 ? Math.round((currentPhase / totalPhases) * 100) : 0;

  // Action callbacks with stable references
  const saveProgress = useCallback(async () => {
    await saveProgressMutation.mutateAsync();
  }, [saveProgressMutation.mutateAsync]);

  const resumeProgress = useCallback(async () => {
    return await resumeProgressMutation.mutateAsync();
  }, [resumeProgressMutation.mutateAsync]);

  const clearProgress = useCallback(async () => {
    await clearProgressMutation.mutateAsync();
  }, [clearProgressMutation.mutateAsync]);

  const createBackup = useCallback(async () => {
    return await createBackupMutation.mutateAsync();
  }, [createBackupMutation.mutateAsync]);

  const restoreFromBackup = useCallback(
    async (backupId: string) => {
      await restoreBackupMutation.mutateAsync(backupId);
    },
    [restoreBackupMutation.mutateAsync]
  );

  const listBackups = useCallback(async () => {
    const result = await persistence.loadSessionsForProfile(profileId);
    if (result.isFailure) {
      throw new Error(result.error?.message || 'Failed to load backups');
    }

    // Filter for backup sessions
    return result
      .getValue()
      .filter((session) => session.id.includes('_backup_'))
      .map((session) => ({
        id: session.id,
        timestamp: new Date(session.metadata.createdAt),
        setType: session.setType,
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [persistence, profileId]);

  return {
    // Progress tracking
    activeSession,
    hasActiveProgress,
    canResume,

    // Session metadata
    sessionId: activeSession?.id || null,
    startTime,
    lastActiveTime,
    totalTimeElapsed,

    // Progress data
    executionState,
    completedSets,
    currentPhase,
    totalPhases,
    progressPercentage,

    // Persistence actions
    saveProgress,
    resumeProgress,
    clearProgress,

    // Backup and restoration
    createBackup,
    restoreFromBackup,
    listBackups,

    // Auto-save management
    isAutoSaveEnabled,
    setAutoSaveEnabled: setIsAutoSaveEnabled,
    lastSaveTime,

    // Loading and error states
    isLoading,
    isSaving: saveProgressMutation.isPending,
    isClearing: clearProgressMutation.isPending,
    error,
  };
}

/**
 * Type export for the hook result
 */
export type UseAdvancedSetProgressHook = typeof useAdvancedSetProgress;
