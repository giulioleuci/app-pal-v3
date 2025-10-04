import { assign, setup } from 'xstate';

import {
  AppliedExerciseModel,
  ExerciseGroupModel,
  SessionModel,
} from '@/features/training-plan/domain';

/**
 * Context for the session editor state machine
 */
interface SessionEditorContext {
  originalSession: SessionModel | null;
  editedSession: SessionModel | null;
  hasUnsavedChanges: boolean;
  error: string | null;
  validationErrors: string[];
}

/**
 * Events that can be sent to the session editor machine
 */
type SessionEditorEvent =
  | { type: 'LOAD_SESSION'; session: SessionModel }
  | { type: 'UPDATE_SESSION_NAME'; name: string }
  | { type: 'UPDATE_SESSION_NOTES'; notes: string }
  | { type: 'UPDATE_SESSION_DAY'; dayOfWeek: SessionModel['dayOfWeek'] }
  | { type: 'TOGGLE_DELOAD' }
  | { type: 'ADD_GROUP'; group: ExerciseGroupModel }
  | { type: 'REMOVE_GROUP'; groupId: string }
  | { type: 'REORDER_GROUP'; groupId: string; direction: 'up' | 'down' }
  | { type: 'ADD_EXERCISE'; groupId: string; exercise: AppliedExerciseModel }
  | { type: 'REMOVE_EXERCISE'; exerciseId: string }
  | { type: 'VALIDATE_SESSION' }
  | { type: 'SAVE_SESSION' }
  | { type: 'CANCEL_EDITING' }
  | { type: 'DISCARD_CHANGES' }
  | { type: 'RESET_ERROR' };

/**
 * Session editor state machine for managing the editing state of a workout session.
 * This machine handles the complex workflows involved in editing session content,
 * including validation, change tracking, and state persistence.
 */
export const sessionEditorMachine = setup({
  types: {
    context: {} as SessionEditorContext,
    events: {} as SessionEditorEvent,
  },
  guards: {
    hasUnsavedChanges: ({ context }) => context.hasUnsavedChanges,
    hasValidationErrors: ({ context }) => context.validationErrors.length > 0,
    hasSession: ({ context }) => context.editedSession !== null,
    isSessionValid: ({ context }) => {
      if (!context.editedSession) return false;
      // Basic validation - name must be present
      return context.editedSession.name.trim().length > 0;
    },
  },
  actions: {
    loadSession: assign({
      originalSession: ({ event }) => {
        if (event.type === 'LOAD_SESSION') {
          return event.session.clone();
        }
        return null;
      },
      editedSession: ({ event }) => {
        if (event.type === 'LOAD_SESSION') {
          return event.session.clone();
        }
        return null;
      },
      hasUnsavedChanges: () => false,
      error: () => null,
      validationErrors: () => [],
    }),

    updateSessionName: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'UPDATE_SESSION_NAME' && context.editedSession) {
          return context.editedSession.cloneWithNewName(event.name);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    updateSessionNotes: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'UPDATE_SESSION_NOTES' && context.editedSession) {
          return context.editedSession.cloneWithNewNotes(event.notes);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    updateSessionDay: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'UPDATE_SESSION_DAY' && context.editedSession) {
          return context.editedSession.cloneWithNewDayOfWeek(event.dayOfWeek);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    toggleDeload: assign({
      editedSession: ({ context }) => {
        if (context.editedSession) {
          return context.editedSession.cloneWithToggledDeload();
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    addGroup: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'ADD_GROUP' && context.editedSession) {
          return context.editedSession.cloneWithAddedGroup(event.group);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    removeGroup: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'REMOVE_GROUP' && context.editedSession) {
          return context.editedSession.cloneWithRemovedGroup(event.groupId);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    reorderGroup: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'REORDER_GROUP' && context.editedSession) {
          return context.editedSession.cloneWithReorderedGroup(event.groupId, event.direction);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    removeExercise: assign({
      editedSession: ({ context, event }) => {
        if (event.type === 'REMOVE_EXERCISE' && context.editedSession) {
          return context.editedSession.cloneWithRemovedExercise(event.exerciseId);
        }
        return context.editedSession;
      },
      hasUnsavedChanges: () => true,
    }),

    validateSession: assign({
      validationErrors: ({ context }) => {
        const errors: string[] = [];

        if (!context.editedSession) {
          errors.push('No session loaded');
          return errors;
        }

        // Name validation
        if (!context.editedSession.name.trim()) {
          errors.push('Session name is required');
        }

        // Groups validation
        if (context.editedSession.groups.length === 0) {
          errors.push('Session must have at least one exercise group');
        }

        // Exercise validation
        const hasExercises = context.editedSession.groups.some(
          (group) => group.appliedExercises.length > 0
        );
        if (!hasExercises) {
          errors.push('Session must have at least one exercise');
        }

        return errors;
      },
    }),

    resetToOriginal: assign({
      editedSession: ({ context }) => {
        return context.originalSession ? context.originalSession.clone() : null;
      },
      hasUnsavedChanges: () => false,
      error: () => null,
      validationErrors: () => [],
    }),

    clearSession: assign({
      originalSession: () => null,
      editedSession: () => null,
      hasUnsavedChanges: () => false,
      error: () => null,
      validationErrors: () => [],
    }),

    setError: assign({
      error: (_, params: { error: string }) => params.error,
    }),

    clearError: assign({
      error: () => null,
    }),

    markAsSaved: assign({
      originalSession: ({ context }) => {
        return context.editedSession ? context.editedSession.clone() : null;
      },
      hasUnsavedChanges: () => false,
      error: () => null,
      validationErrors: () => [],
    }),
  },
}).createMachine({
  id: 'sessionEditor',
  initial: 'idle',
  context: {
    originalSession: null,
    editedSession: null,
    hasUnsavedChanges: false,
    error: null,
    validationErrors: [],
  },
  states: {
    /**
     * Idle state - no session loaded for editing
     */
    idle: {
      on: {
        LOAD_SESSION: {
          target: 'editing',
          actions: 'loadSession',
        },
      },
    },

    /**
     * Editing state - session is loaded and being edited
     */
    editing: {
      initial: 'active',
      entry: 'clearError',
      on: {
        LOAD_SESSION: {
          target: 'editing',
          actions: 'loadSession',
        },
        CANCEL_EDITING: [
          {
            guard: 'hasUnsavedChanges',
            target: 'confirmingDiscard',
          },
          {
            target: 'idle',
            actions: 'clearSession',
          },
        ],
      },
      states: {
        /**
         * Active editing state - user can make changes
         */
        active: {
          on: {
            UPDATE_SESSION_NAME: {
              actions: 'updateSessionName',
            },
            UPDATE_SESSION_NOTES: {
              actions: 'updateSessionNotes',
            },
            UPDATE_SESSION_DAY: {
              actions: 'updateSessionDay',
            },
            TOGGLE_DELOAD: {
              actions: 'toggleDeload',
            },
            ADD_GROUP: {
              actions: 'addGroup',
            },
            REMOVE_GROUP: {
              actions: 'removeGroup',
            },
            REORDER_GROUP: {
              actions: 'reorderGroup',
            },
            REMOVE_EXERCISE: {
              actions: 'removeExercise',
            },
            VALIDATE_SESSION: {
              target: 'validating',
            },
            SAVE_SESSION: {
              target: 'validating',
            },
            RESET_ERROR: {
              actions: 'clearError',
            },
          },
        },

        /**
         * Validating state - session is being validated before save
         */
        validating: {
          entry: 'validateSession',
          always: [
            {
              guard: 'hasValidationErrors',
              target: 'active',
              actions: {
                type: 'setError',
                params: { error: 'Please fix validation errors before saving' },
              },
            },
            {
              target: 'saving',
            },
          ],
        },

        /**
         * Saving state - session changes are being persisted
         */
        saving: {
          // In a real implementation, this would invoke a service to persist the changes
          // For now, we'll just mark as saved
          entry: 'markAsSaved',
          always: {
            target: 'active',
          },
        },
      },
    },

    /**
     * Confirming discard state - user is being asked to confirm discarding changes
     */
    confirmingDiscard: {
      on: {
        DISCARD_CHANGES: {
          target: 'idle',
          actions: 'clearSession',
        },
        CANCEL_EDITING: {
          target: 'editing.active',
        },
      },
    },
  },
});

/**
 * Type for the session editor actor
 */
export type SessionEditorActor = ReturnType<typeof sessionEditorMachine.createActor>;
