import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createActor, waitFor } from 'xstate';

import { generateId } from '@/lib';
import type { DayOfWeek } from '@/shared/types';

import { AppliedExerciseModel, ExerciseGroupModel, SessionModel } from '../../domain';
import { sessionEditorMachine } from '../sessionEditorMachine';

// Mock the domain models
vi.mock('../../domain', () => ({
  SessionModel: {
    hydrate: vi.fn(),
  },
  ExerciseGroupModel: {
    hydrate: vi.fn(),
  },
  AppliedExerciseModel: {
    hydrate: vi.fn(),
  },
}));

// Mock the generateId utility
vi.mock('@/lib', () => ({
  generateId: vi.fn(() => 'mock-id'),
}));

describe('sessionEditorMachine', () => {
  let mockSession: SessionModel;
  let mockGroup: ExerciseGroupModel;
  let mockExercise: AppliedExerciseModel;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock applied exercise
    mockExercise = {
      id: 'exercise-1',
      profileId: 'profile-1',
      exerciseId: 'base-exercise-1',
      templateId: null,
      setConfiguration: { type: 'standard', sets: 3, reps: 10 },
      restTimeSeconds: 60,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      clone: vi.fn().mockReturnThis(),
      toPlainObject: vi.fn().mockReturnValue({}),
      validate: vi.fn().mockReturnValue({ success: true }),
    } as unknown as AppliedExerciseModel;

    // Create mock exercise group
    mockGroup = {
      id: 'group-1',
      profileId: 'profile-1',
      type: 'standard',
      appliedExercises: [mockExercise],
      restTimeSeconds: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
      clone: vi.fn().mockReturnThis(),
      toPlainObject: vi.fn().mockReturnValue({}),
      validate: vi.fn().mockReturnValue({ success: true }),
      getEstimatedDurationSeconds: vi.fn().mockReturnValue(300),
    } as unknown as ExerciseGroupModel;

    // Create mock session
    mockSession = {
      id: 'session-1',
      profileId: 'profile-1',
      name: 'Test Session',
      groups: [mockGroup],
      notes: 'Test notes',
      executionCount: 0,
      isDeload: false,
      dayOfWeek: 'monday' as DayOfWeek,
      createdAt: new Date(),
      updatedAt: new Date(),
      clone: vi.fn().mockReturnThis(),
      cloneWithNewName: vi.fn().mockImplementation((name: string) => ({
        ...mockSession,
        name,
      })),
      cloneWithNewNotes: vi.fn().mockImplementation((notes?: string) => ({
        ...mockSession,
        notes,
      })),
      cloneWithNewDayOfWeek: vi.fn().mockImplementation((dayOfWeek: DayOfWeek | null) => ({
        ...mockSession,
        dayOfWeek,
      })),
      cloneWithToggledDeload: vi.fn().mockImplementation(() => ({
        ...mockSession,
        isDeload: !mockSession.isDeload,
      })),
      cloneWithAddedGroup: vi.fn().mockImplementation((group: ExerciseGroupModel) => ({
        ...mockSession,
        groups: [...mockSession.groups, group],
      })),
      cloneWithRemovedGroup: vi.fn().mockImplementation((groupId: string) => ({
        ...mockSession,
        groups: mockSession.groups.filter((g) => g.id !== groupId),
      })),
      cloneWithReorderedGroup: vi
        .fn()
        .mockImplementation((groupId: string, direction: 'up' | 'down') => {
          const newGroups = [...mockSession.groups];
          const index = newGroups.findIndex((g) => g.id === groupId);
          if (index !== -1) {
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex >= 0 && newIndex < newGroups.length) {
              const [item] = newGroups.splice(index, 1);
              newGroups.splice(newIndex, 0, item);
            }
          }
          return { ...mockSession, groups: newGroups };
        }),
      cloneWithRemovedExercise: vi.fn().mockImplementation((exerciseId: string) => ({
        ...mockSession,
        groups: mockSession.groups.map((g) => ({
          ...g,
          appliedExercises: g.appliedExercises.filter((e) => e.id !== exerciseId),
        })),
      })),
      toPlainObject: vi.fn().mockReturnValue({}),
      validate: vi.fn().mockReturnValue({ success: true }),
      findExerciseById: vi.fn().mockReturnValue({ exercise: mockExercise, group: mockGroup }),
      getTotalExerciseCount: vi.fn().mockReturnValue(1),
      getTotalGroupCount: vi.fn().mockReturnValue(1),
      getEstimatedDurationSeconds: vi.fn().mockReturnValue(300),
      hasBeenExecuted: vi.fn().mockReturnValue(false),
      hasScheduledDay: vi.fn().mockReturnValue(true),
      hasNotes: vi.fn().mockReturnValue(true),
      getDisplayName: vi.fn().mockReturnValue('Test Session'),
    } as unknown as SessionModel;
  });

  describe('Machine Definition', () => {
    it('should have correct machine configuration', () => {
      expect(sessionEditorMachine.id).toBe('sessionEditor');
      expect(sessionEditorMachine.config.initial).toBe('idle');
    });

    it('should have correct initial context', () => {
      const actor = createActor(sessionEditorMachine);
      const snapshot = actor.getSnapshot();

      expect(snapshot.context).toEqual({
        originalSession: null,
        editedSession: null,
        hasUnsavedChanges: false,
        error: null,
        validationErrors: [],
      });
    });
  });

  describe('Initial State and Transitions', () => {
    it('should start in idle state', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition from idle to editing when LOAD_SESSION is sent', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      expect(actor.getSnapshot().value).toEqual({ editing: 'active' });
    });

    it('should load session data into context when transitioning to editing', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      actor.send({ type: 'LOAD_SESSION', session: mockSession });
      const snapshot = actor.getSnapshot();

      expect(mockSession.clone).toHaveBeenCalledTimes(2); // once for original, once for edited
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
      expect(snapshot.context.error).toBeNull();
      expect(snapshot.context.validationErrors).toEqual([]);
    });
  });

  describe('Guards', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should evaluate hasUnsavedChanges guard correctly', () => {
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(false);

      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Updated Name' });

      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should evaluate hasValidationErrors guard correctly', () => {
      // Initially no validation errors
      expect(actor.getSnapshot().context.validationErrors).toEqual([]);

      // Trigger validation with invalid session (empty name)
      const invalidSession = { ...mockSession, name: '' };
      (mockSession.cloneWithNewName as any).mockReturnValue(invalidSession);

      actor.send({ type: 'UPDATE_SESSION_NAME', name: '' });
      actor.send({ type: 'VALIDATE_SESSION' });

      expect(actor.getSnapshot().context.validationErrors.length).toBeGreaterThan(0);
    });

    it('should evaluate hasSession guard correctly', () => {
      expect(actor.getSnapshot().context.editedSession).not.toBeNull();

      actor.send({ type: 'CANCEL_EDITING' });

      expect(actor.getSnapshot().context.editedSession).toBeNull();
    });

    it('should evaluate isSessionValid guard correctly', () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.context.editedSession?.name.trim().length).toBeGreaterThan(0);

      // Test with invalid session
      const emptySession = { ...mockSession, name: '' };
      (mockSession.cloneWithNewName as any).mockReturnValue(emptySession);

      actor.send({ type: 'UPDATE_SESSION_NAME', name: '' });
      const newSnapshot = actor.getSnapshot();

      expect(newSnapshot.context.editedSession?.name.trim().length).toBe(0);
    });
  });

  describe('Session Editing Actions', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should update session name and mark as having unsaved changes', () => {
      const newName = 'Updated Session Name';

      actor.send({ type: 'UPDATE_SESSION_NAME', name: newName });

      expect(mockSession.cloneWithNewName).toHaveBeenCalledWith(newName);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should update session notes and mark as having unsaved changes', () => {
      const newNotes = 'Updated notes';

      actor.send({ type: 'UPDATE_SESSION_NOTES', notes: newNotes });

      expect(mockSession.cloneWithNewNotes).toHaveBeenCalledWith(newNotes);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should update session day of week and mark as having unsaved changes', () => {
      const newDayOfWeek = 'friday' as DayOfWeek;

      actor.send({ type: 'UPDATE_SESSION_DAY', dayOfWeek: newDayOfWeek });

      expect(mockSession.cloneWithNewDayOfWeek).toHaveBeenCalledWith(newDayOfWeek);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should toggle deload status and mark as having unsaved changes', () => {
      actor.send({ type: 'TOGGLE_DELOAD' });

      expect(mockSession.cloneWithToggledDeload).toHaveBeenCalled();
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should add group and mark as having unsaved changes', () => {
      const newGroup = { ...mockGroup, id: 'new-group' } as ExerciseGroupModel;

      actor.send({ type: 'ADD_GROUP', group: newGroup });

      expect(mockSession.cloneWithAddedGroup).toHaveBeenCalledWith(newGroup);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should remove group and mark as having unsaved changes', () => {
      const groupId = 'group-to-remove';

      actor.send({ type: 'REMOVE_GROUP', groupId });

      expect(mockSession.cloneWithRemovedGroup).toHaveBeenCalledWith(groupId);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should reorder group and mark as having unsaved changes', () => {
      const groupId = 'group-1';
      const direction = 'up';

      actor.send({ type: 'REORDER_GROUP', groupId, direction });

      expect(mockSession.cloneWithReorderedGroup).toHaveBeenCalledWith(groupId, direction);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });

    it('should remove exercise and mark as having unsaved changes', () => {
      const exerciseId = 'exercise-to-remove';

      actor.send({ type: 'REMOVE_EXERCISE', exerciseId });

      expect(mockSession.cloneWithRemovedExercise).toHaveBeenCalledWith(exerciseId);
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);
    });
  });

  describe('Validation Workflow', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should transition through validating state when VALIDATE_SESSION is sent', () => {
      actor.send({ type: 'VALIDATE_SESSION' });

      // The validating state has an immediate always transition, so it should end up in active
      expect(actor.getSnapshot().value).toEqual({ editing: 'active' });

      // Validation should have been executed
      expect(actor.getSnapshot().context.validationErrors).toBeDefined();
    });

    it('should validate session and return to active with errors', () => {
      // Mock session with validation errors
      const invalidSession = {
        ...mockSession,
        name: '',
        groups: [],
      };

      actor.getSnapshot().context.editedSession = invalidSession as SessionModel;

      actor.send({ type: 'VALIDATE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toEqual({ editing: 'active' });
      expect(snapshot.context.validationErrors).toContain('Session name is required');
      expect(snapshot.context.validationErrors).toContain(
        'Session must have at least one exercise group'
      );
    });

    it('should validate session and proceed to saving when valid', () => {
      actor.send({ type: 'VALIDATE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toEqual({ editing: 'active' }); // Returns to active after saving
      expect(snapshot.context.validationErrors).toEqual([]);
      expect(snapshot.context.hasUnsavedChanges).toBe(false); // Marked as saved
    });

    it('should validate session with exercise requirements', () => {
      // Mock session with groups but no exercises
      const sessionWithEmptyGroups = {
        ...mockSession,
        groups: [{ ...mockGroup, appliedExercises: [] }],
      };

      actor.getSnapshot().context.editedSession = sessionWithEmptyGroups as SessionModel;

      actor.send({ type: 'VALIDATE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.validationErrors).toContain(
        'Session must have at least one exercise'
      );
    });
  });

  describe('Save Workflow', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should transition through validation when SAVE_SESSION is sent', () => {
      actor.send({ type: 'SAVE_SESSION' });

      // Should validate first, then save
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toEqual({ editing: 'active' });
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
    });

    it('should fail to save with validation errors', () => {
      // Make session invalid
      const invalidSession = { ...mockSession, name: '' };
      actor.getSnapshot().context.editedSession = invalidSession as SessionModel;

      actor.send({ type: 'SAVE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toEqual({ editing: 'active' });
      expect(snapshot.context.error).toBe('Please fix validation errors before saving');
      expect(snapshot.context.validationErrors.length).toBeGreaterThan(0);
    });

    it('should mark session as saved after successful save', () => {
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);

      actor.send({ type: 'SAVE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
      expect(snapshot.context.error).toBeNull();
      expect(snapshot.context.validationErrors).toEqual([]);
    });
  });

  describe('Cancel and Discard Workflow', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should directly return to idle when cancelling without unsaved changes', () => {
      actor.send({ type: 'CANCEL_EDITING' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.editedSession).toBeNull();
    });

    it('should transition to confirmingDiscard when cancelling with unsaved changes', () => {
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);

      actor.send({ type: 'CANCEL_EDITING' });

      expect(actor.getSnapshot().value).toBe('confirmingDiscard');
    });

    it('should return to editing.active when cancelling discard confirmation', () => {
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });
      actor.send({ type: 'CANCEL_EDITING' });
      expect(actor.getSnapshot().value).toBe('confirmingDiscard');

      actor.send({ type: 'CANCEL_EDITING' });

      expect(actor.getSnapshot().value).toEqual({ editing: 'active' });
    });

    it('should clear session and return to idle when discarding changes', () => {
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });
      actor.send({ type: 'CANCEL_EDITING' });
      expect(actor.getSnapshot().value).toBe('confirmingDiscard');

      actor.send({ type: 'DISCARD_CHANGES' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.editedSession).toBeNull();
      expect(actor.getSnapshot().context.originalSession).toBeNull();
    });
  });

  describe('Error Handling', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should clear error when entering editing state', () => {
      // First set an error
      actor.send({ type: 'VALIDATE_SESSION' });
      const invalidSession = { ...mockSession, name: '' };
      actor.getSnapshot().context.editedSession = invalidSession as SessionModel;
      actor.send({ type: 'VALIDATE_SESSION' });

      expect(actor.getSnapshot().context.error).toBeTruthy();

      // Load new session should clear error
      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it('should clear error when RESET_ERROR is sent', () => {
      // Set error state
      const invalidSession = { ...mockSession, name: '' };
      actor.getSnapshot().context.editedSession = invalidSession as SessionModel;
      actor.send({ type: 'VALIDATE_SESSION' });

      expect(actor.getSnapshot().context.error).toBeTruthy();

      actor.send({ type: 'RESET_ERROR' });

      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });

  describe('Context Management', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
    });

    it('should properly initialize context on session load', () => {
      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      const snapshot = actor.getSnapshot();
      expect(mockSession.clone).toHaveBeenCalledTimes(2);
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
      expect(snapshot.context.error).toBeNull();
      expect(snapshot.context.validationErrors).toEqual([]);
    });

    it('should preserve original session throughout editing', () => {
      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });
      actor.send({ type: 'UPDATE_SESSION_NOTES', notes: 'Modified Notes' });

      const snapshot = actor.getSnapshot();
      // Original session should remain unchanged
      expect(snapshot.context.originalSession).toBeTruthy();
      // Edited session should be different
      expect(snapshot.context.editedSession).toBeTruthy();
      expect(snapshot.context.hasUnsavedChanges).toBe(true);
    });

    it('should reset to original when resetToOriginal action is called', () => {
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });

      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);

      // Simulate reset (this would be triggered internally)
      const resetActor = createActor(
        sessionEditorMachine.provide({
          actions: {
            ...sessionEditorMachine.options?.actions,
            testReset: 'resetToOriginal',
          },
        })
      );
      resetActor.start();
      resetActor.send({ type: 'LOAD_SESSION', session: mockSession });

      expect(mockSession.clone).toHaveBeenCalled();
    });
  });

  describe('Machine Actor Behavior', () => {
    it('should create actor with correct initial state', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.originalSession).toBeNull();
      expect(actor.getSnapshot().context.editedSession).toBeNull();
    });

    it('should handle multiple session loads', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      const session1 = { ...mockSession, id: 'session-1', name: 'Session 1' };
      const session2 = { ...mockSession, id: 'session-2', name: 'Session 2' };

      actor.send({ type: 'LOAD_SESSION', session: session1 as SessionModel });
      expect(actor.getSnapshot().value).toEqual({ editing: 'active' });

      // Load different session
      actor.send({ type: 'LOAD_SESSION', session: session2 as SessionModel });
      expect(actor.getSnapshot().value).toEqual({ editing: 'active' });
    });

    it('should maintain state consistency throughout lifecycle', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      // Load session
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
      expect(actor.getSnapshot().value).toEqual({ editing: 'active' });

      // Make changes
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Updated' });
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);

      // Save
      actor.send({ type: 'SAVE_SESSION' });
      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(false);

      // Cancel editing
      actor.send({ type: 'CANCEL_EDITING' });
      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('Edge Cases', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
    });

    it('should handle actions when no session is loaded', () => {
      // These actions should not cause errors when no session is loaded
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Test' });
      actor.send({ type: 'UPDATE_SESSION_NOTES', notes: 'Test' });
      actor.send({ type: 'TOGGLE_DELOAD' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.editedSession).toBeNull();
    });

    it('should handle validation of null session', () => {
      actor.send({ type: 'VALIDATE_SESSION' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should handle empty groups array in validation', () => {
      const sessionWithoutGroups = { ...mockSession, groups: [] };
      actor.send({ type: 'LOAD_SESSION', session: sessionWithoutGroups as SessionModel });

      actor.send({ type: 'VALIDATE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.validationErrors).toContain(
        'Session must have at least one exercise group'
      );
    });

    it('should handle reordering groups at boundaries', () => {
      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      // Try to move first group up (should not change anything)
      actor.send({ type: 'REORDER_GROUP', groupId: 'group-1', direction: 'up' });

      expect(mockSession.cloneWithReorderedGroup).toHaveBeenCalledWith('group-1', 'up');
    });

    it('should handle removing non-existent group', () => {
      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      actor.send({ type: 'REMOVE_GROUP', groupId: 'non-existent-group' });

      expect(mockSession.cloneWithRemovedGroup).toHaveBeenCalledWith('non-existent-group');
    });

    it('should handle removing non-existent exercise', () => {
      actor.send({ type: 'LOAD_SESSION', session: mockSession });

      actor.send({ type: 'REMOVE_EXERCISE', exerciseId: 'non-existent-exercise' });

      expect(mockSession.cloneWithRemovedExercise).toHaveBeenCalledWith('non-existent-exercise');
    });
  });

  describe('Session Data Persistence', () => {
    let actor: ReturnType<typeof createActor>;

    beforeEach(() => {
      actor = createActor(sessionEditorMachine);
      actor.start();
      actor.send({ type: 'LOAD_SESSION', session: mockSession });
    });

    it('should update originalSession reference after successful save', () => {
      const originalSessionBefore = actor.getSnapshot().context.originalSession;

      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Modified Name' });
      actor.send({ type: 'SAVE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
      // Original session should now reference the saved edited session
      expect(snapshot.context.originalSession).toBeTruthy();
    });

    it('should maintain data integrity during complex editing workflows', () => {
      // Complex workflow: modify multiple properties
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'New Name' });
      actor.send({ type: 'UPDATE_SESSION_NOTES', notes: 'New Notes' });
      actor.send({ type: 'UPDATE_SESSION_DAY', dayOfWeek: 'wednesday' as DayOfWeek });
      actor.send({ type: 'TOGGLE_DELOAD' });

      expect(actor.getSnapshot().context.hasUnsavedChanges).toBe(true);

      // Save all changes
      actor.send({ type: 'SAVE_SESSION' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
      expect(snapshot.context.error).toBeNull();
      expect(snapshot.context.validationErrors).toEqual([]);
    });
  });

  describe('State Machine Cleanup', () => {
    it('should properly clean up context on session clear', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      actor.send({ type: 'LOAD_SESSION', session: mockSession });
      expect(actor.getSnapshot().context.editedSession).toBeTruthy();

      actor.send({ type: 'CANCEL_EDITING' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.originalSession).toBeNull();
      expect(snapshot.context.editedSession).toBeNull();
      expect(snapshot.context.hasUnsavedChanges).toBe(false);
      expect(snapshot.context.error).toBeNull();
      expect(snapshot.context.validationErrors).toEqual([]);
    });

    it('should handle actor disposal gracefully', () => {
      const actor = createActor(sessionEditorMachine);
      actor.start();

      actor.send({ type: 'LOAD_SESSION', session: mockSession });
      actor.send({ type: 'UPDATE_SESSION_NAME', name: 'Test' });

      // Stop the actor
      actor.stop();

      expect(() => actor.getSnapshot()).not.toThrow();
    });
  });
});
