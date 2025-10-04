import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { LocalStorageAdapter } from '@/app/store/LocalStorageAdapter';

import type { AdvancedSetExecutionState, SetProgressionData } from '../services/types';

/**
 * State for a single advanced set execution session
 */
export interface AdvancedSetExecutionSession {
  /** Unique identifier for this execution session */
  id: string;
  /** Type of advanced set being executed */
  setType: 'drop' | 'myoReps' | 'pyramidal' | 'restPause' | 'mav';
  /** Profile ID for this session */
  profileId: string;
  /** Workout log ID this set belongs to */
  workoutLogId: string;
  /** Exercise ID this set is for */
  exerciseId: string;
  /** Set configuration as serialized JSON */
  setConfigurationJson: string;
  /** Current execution state */
  executionState: AdvancedSetExecutionState | null;
  /** History of completed sets in this session */
  completedSets: SetProgressionData[];
  /** Timer state */
  timerState: {
    isRunning: boolean;
    remainingSeconds: number;
    totalSeconds: number;
    startTime: number | null;
  };
  /** Session metadata */
  metadata: {
    createdAt: number;
    updatedAt: number;
    lastActiveAt: number;
  };
}

/**
 * Store state for advanced set execution management
 */
interface AdvancedSetExecutionStoreState {
  /** Currently active execution sessions keyed by session ID */
  activeSessions: Record<string, AdvancedSetExecutionSession>;

  /** The currently focused session ID (what the user is working on) */
  currentSessionId: string | null;

  // Actions for session management

  /** Creates a new execution session */
  createSession: (params: {
    profileId: string;
    workoutLogId: string;
    exerciseId: string;
    setType: AdvancedSetExecutionSession['setType'];
    setConfigurationJson: string;
    executionState: AdvancedSetExecutionState;
  }) => string;

  /** Updates the execution state for a session */
  updateExecutionState: (sessionId: string, executionState: AdvancedSetExecutionState) => void;

  /** Adds a completed set to a session */
  addCompletedSet: (sessionId: string, setData: SetProgressionData) => void;

  /** Updates timer state for a session */
  updateTimerState: (
    sessionId: string,
    timerState: Partial<AdvancedSetExecutionSession['timerState']>
  ) => void;

  /** Sets the current session ID */
  setCurrentSession: (sessionId: string | null) => void;

  /** Completes and removes a session */
  completeSession: (sessionId: string) => void;

  /** Aborts and removes a session */
  abortSession: (sessionId: string) => void;

  /** Clears all expired sessions (older than 24 hours) */
  clearExpiredSessions: () => void;

  /** Gets a session by ID */
  getSession: (sessionId: string) => AdvancedSetExecutionSession | undefined;

  /** Gets the current active session */
  getCurrentSession: () => AdvancedSetExecutionSession | undefined;

  /** Gets all sessions for a profile */
  getSessionsForProfile: (profileId: string) => AdvancedSetExecutionSession[];

  /** Gets all sessions for a workout */
  getSessionsForWorkout: (workoutLogId: string) => AdvancedSetExecutionSession[];

  /** Resets the store to initial state (for testing purposes) */
  resetStore: () => void;
}

/**
 * Zustand store for managing advanced set execution state with persistence.
 *
 * This store handles simpler state management needs for advanced set execution,
 * focusing on persistence across app restarts and session tracking. It works
 * alongside the XState machine for complex state transitions.
 *
 * Key responsibilities:
 * - Persist execution progress across app restarts
 * - Track multiple concurrent advanced set sessions
 * - Manage timer state persistence
 * - Provide session history and metadata
 */
export const useAdvancedSetExecutionStore = create<AdvancedSetExecutionStoreState>()(
  persist(
    (set, get) => ({
      activeSessions: {},
      currentSessionId: null,

      createSession: ({
        profileId,
        workoutLogId,
        exerciseId,
        setType,
        setConfigurationJson,
        executionState,
      }) => {
        const sessionId = crypto.randomUUID();
        const now = Date.now();

        const session: AdvancedSetExecutionSession = {
          id: sessionId,
          setType,
          profileId,
          workoutLogId,
          exerciseId,
          setConfigurationJson,
          executionState,
          completedSets: [],
          timerState: {
            isRunning: false,
            remainingSeconds: executionState.restPeriodSeconds || 0,
            totalSeconds: executionState.restPeriodSeconds || 0,
            startTime: null,
          },
          metadata: {
            createdAt: now,
            updatedAt: now,
            lastActiveAt: now,
          },
        };

        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [sessionId]: session,
          },
          currentSessionId: sessionId,
        }));

        return sessionId;
      },

      updateExecutionState: (sessionId, executionState) => {
        set((state) => {
          const session = state.activeSessions[sessionId];
          if (!session) return state;

          const now = Date.now();
          return {
            activeSessions: {
              ...state.activeSessions,
              [sessionId]: {
                ...session,
                executionState,
                timerState: {
                  ...session.timerState,
                  remainingSeconds: executionState.restPeriodSeconds || 0,
                  totalSeconds: executionState.restPeriodSeconds || 0,
                },
                metadata: {
                  ...session.metadata,
                  updatedAt: now,
                  lastActiveAt: now,
                },
              },
            },
          };
        });
      },

      addCompletedSet: (sessionId, setData) => {
        set((state) => {
          const session = state.activeSessions[sessionId];
          if (!session) return state;

          const now = Date.now();
          return {
            activeSessions: {
              ...state.activeSessions,
              [sessionId]: {
                ...session,
                completedSets: [...session.completedSets, setData],
                metadata: {
                  ...session.metadata,
                  updatedAt: now,
                  lastActiveAt: now,
                },
              },
            },
          };
        });
      },

      updateTimerState: (sessionId, timerUpdate) => {
        set((state) => {
          const session = state.activeSessions[sessionId];
          if (!session) return state;

          const now = Date.now();
          return {
            activeSessions: {
              ...state.activeSessions,
              [sessionId]: {
                ...session,
                timerState: {
                  ...session.timerState,
                  ...timerUpdate,
                },
                metadata: {
                  ...session.metadata,
                  updatedAt: now,
                  lastActiveAt: now,
                },
              },
            },
          };
        });
      },

      setCurrentSession: (sessionId) => {
        set((state) => ({
          ...state,
          currentSessionId: sessionId,
        }));
      },

      completeSession: (sessionId) => {
        set((state) => {
          const { [sessionId]: removed, ...remainingSessions } = state.activeSessions;
          return {
            activeSessions: remainingSessions,
            currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          };
        });
      },

      abortSession: (sessionId) => {
        set((state) => {
          const { [sessionId]: removed, ...remainingSessions } = state.activeSessions;
          return {
            activeSessions: remainingSessions,
            currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          };
        });
      },

      clearExpiredSessions: () => {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        set((state) => {
          const activeSessions: Record<string, AdvancedSetExecutionSession> = {};
          let currentSessionId = state.currentSessionId;

          Object.entries(state.activeSessions).forEach(([sessionId, session]) => {
            if (now - session.metadata.lastActiveAt < twentyFourHours) {
              activeSessions[sessionId] = session;
            } else if (sessionId === currentSessionId) {
              currentSessionId = null;
            }
          });

          return {
            activeSessions,
            currentSessionId,
          };
        });
      },

      getSession: (sessionId) => {
        return get().activeSessions[sessionId];
      },

      getCurrentSession: () => {
        const { activeSessions, currentSessionId } = get();
        return currentSessionId ? activeSessions[currentSessionId] : undefined;
      },

      getSessionsForProfile: (profileId) => {
        return Object.values(get().activeSessions).filter(
          (session) => session.profileId === profileId
        );
      },

      getSessionsForWorkout: (workoutLogId) => {
        return Object.values(get().activeSessions).filter(
          (session) => session.workoutLogId === workoutLogId
        );
      },

      resetStore: () => {
        set({
          activeSessions: {},
          currentSessionId: null,
        });
      },
    }),
    {
      name: 'blueprint-fitness-advanced-set-execution',
      storage: new LocalStorageAdapter(),
      partialize: (state) => ({
        activeSessions: state.activeSessions,
        currentSessionId: state.currentSessionId,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version < 1) {
          // Migration logic for future versions
          return {
            activeSessions: {},
            currentSessionId: null,
          };
        }
        return persistedState;
      },
    }
  )
);

/**
 * Helper hook to get only the current session
 */
export const useCurrentAdvancedSetSession = () => {
  return useAdvancedSetExecutionStore((state) => state.getCurrentSession());
};

/**
 * Helper hook to check if there are any active sessions
 */
export const useHasActiveAdvancedSets = () => {
  return useAdvancedSetExecutionStore((state) => Object.keys(state.activeSessions).length > 0);
};

/**
 * Helper hook to get sessions for a specific profile
 */
export const useAdvancedSetSessionsForProfile = (profileId: string) => {
  return useAdvancedSetExecutionStore((state) => state.getSessionsForProfile(profileId));
};

/**
 * Helper hook to get sessions for a specific workout
 */
export const useAdvancedSetSessionsForWorkout = (workoutLogId: string) => {
  return useAdvancedSetExecutionStore((state) => state.getSessionsForWorkout(workoutLogId));
};
