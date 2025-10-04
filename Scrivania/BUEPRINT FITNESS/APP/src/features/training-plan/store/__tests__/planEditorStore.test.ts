import { act, renderHook } from '@testing-library/react';
import isEqual from 'lodash.isequal';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionModel, TrainingPlanModel } from '../../domain';
import { usePlanEditorStore } from '../planEditorStore';

// Mock lodash.isequal
vi.mock('lodash.isequal', () => ({
  default: vi.fn(),
}));

// Mock the domain models
vi.mock('../../domain', () => ({
  TrainingPlanModel: {
    hydrate: vi.fn(),
  },
  SessionModel: {
    hydrate: vi.fn(),
  },
}));

describe('planEditorStore', () => {
  let mockSession: SessionModel;
  let mockUpdatedPlan: TrainingPlanModel;
  let mockPlanWithAddedSession: TrainingPlanModel;
  let mockPlanWithRemovedSession: TrainingPlanModel;
  let mockPlanWithReorderedSession: TrainingPlanModel;

  const createMockPlan = (overrides: Partial<TrainingPlanModel> = {}) => {
    const basePlan = {
      id: 'plan-1',
      name: 'Test Plan',
      description: 'Test Description',
      profileId: 'profile-1',
      sessions: [mockSession],
      isArchived: false,
      currentSessionIndex: 0,
      notes: 'Plan notes',
      cycleId: null,
      order: 1,
      lastUsed: new Date('2023-01-01'),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      cloneWithUpdatedDetails: vi.fn(),
      cloneWithAddedSession: vi.fn(),
      cloneWithRemovedSession: vi.fn(),
      cloneWithReorderedSession: vi.fn(),
      toPlainObject: vi.fn().mockReturnValue({
        id: 'plan-1',
        name: 'Test Plan',
        description: 'Test Description',
        profileId: 'profile-1',
        sessionIds: ['session-1'],
        isArchived: false,
        currentSessionIndex: 0,
        notes: 'Plan notes',
        cycleId: null,
        order: 1,
        lastUsed: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      }),
      ...overrides,
    };
    return basePlan as unknown as TrainingPlanModel;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock session
    mockSession = {
      id: 'session-1',
      name: 'Test Session',
      profileId: 'profile-1',
      groups: [],
      notes: 'Session notes',
      executionCount: 0,
      isDeload: false,
      dayOfWeek: null,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      toPlainObject: vi.fn().mockReturnValue({
        id: 'session-1',
        name: 'Test Session',
        profileId: 'profile-1',
        groupIds: [],
        notes: 'Session notes',
        executionCount: 0,
        isDeload: false,
        dayOfWeek: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      }),
    } as unknown as SessionModel;

    // Mock updated plan
    mockUpdatedPlan = createMockPlan({
      name: 'Updated Plan',
      description: 'Updated Description',
      updatedAt: new Date('2023-01-02'),
      toPlainObject: vi.fn().mockReturnValue({
        id: 'plan-1',
        name: 'Updated Plan',
        description: 'Updated Description',
        profileId: 'profile-1',
        sessionIds: ['session-1'],
        isArchived: false,
        currentSessionIndex: 0,
        notes: 'Plan notes',
        cycleId: null,
        order: 1,
        lastUsed: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }),
    });

    // Mock plan with added session
    mockPlanWithAddedSession = createMockPlan({
      sessions: [mockSession, { ...mockSession, id: 'session-2' }],
      updatedAt: new Date('2023-01-02'),
      toPlainObject: vi.fn().mockReturnValue({
        id: 'plan-1',
        name: 'Test Plan',
        description: 'Test Description',
        profileId: 'profile-1',
        sessionIds: ['session-1', 'session-2'],
        isArchived: false,
        currentSessionIndex: 0,
        notes: 'Plan notes',
        cycleId: null,
        order: 1,
        lastUsed: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }),
    });

    // Mock plan with removed session
    mockPlanWithRemovedSession = createMockPlan({
      sessions: [],
      updatedAt: new Date('2023-01-02'),
      toPlainObject: vi.fn().mockReturnValue({
        id: 'plan-1',
        name: 'Test Plan',
        description: 'Test Description',
        profileId: 'profile-1',
        sessionIds: [],
        isArchived: false,
        currentSessionIndex: 0,
        notes: 'Plan notes',
        cycleId: null,
        order: 1,
        lastUsed: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }),
    });

    // Mock plan with reordered sessions
    mockPlanWithReorderedSession = createMockPlan({
      sessions: [{ ...mockSession, id: 'session-2' }, mockSession],
      updatedAt: new Date('2023-01-02'),
      toPlainObject: vi.fn().mockReturnValue({
        id: 'plan-1',
        name: 'Test Plan',
        description: 'Test Description',
        profileId: 'profile-1',
        sessionIds: ['session-2', 'session-1'],
        isArchived: false,
        currentSessionIndex: 0,
        notes: 'Plan notes',
        cycleId: null,
        order: 1,
        lastUsed: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }),
    });

    // Reset store to initial state before each test
    const { result } = renderHook(() => usePlanEditorStore());
    act(() => {
      result.current.unload();
    });
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      expect(result.current.originalPlan).toBeNull();
      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('loadPlan', () => {
    it('should load a plan and set it as both original and draft', () => {
      const { result } = renderHook(() => usePlanEditorStore());
      const mockPlan = createMockPlan();

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      expect(result.current.originalPlan).toBe(mockPlan);
      expect(result.current.draftPlan).toBe(mockPlan);
      expect(result.current.isDirty).toBe(false);
    });

    it('should replace existing plan when loading a new one', () => {
      const { result } = renderHook(() => usePlanEditorStore());
      const mockPlan = createMockPlan();

      // Load first plan
      act(() => {
        result.current.loadPlan(mockPlan);
      });

      const newPlan = createMockPlan({
        id: 'plan-2',
        name: 'New Plan',
      });

      // Load second plan
      act(() => {
        result.current.loadPlan(newPlan);
      });

      expect(result.current.originalPlan).toBe(newPlan);
      expect(result.current.draftPlan).toBe(newPlan);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('updateDetails', () => {
    it('should update plan details and mark as dirty when details change', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      // Mock the clone method to return updated plan
      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });

      // Mock isEqual to return false (different plans)
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Load the plan first
      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.updateDetails({
          name: 'Updated Plan',
          description: 'Updated Description',
        });
      });

      expect(mockClone).toHaveBeenCalledWith({
        name: 'Updated Plan',
        description: 'Updated Description',
      });
      expect(result.current.draftPlan).toBe(mockUpdatedPlan);
      expect(result.current.isDirty).toBe(true);
    });

    it('should update plan details but not mark as dirty when no actual changes', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      // Mock the clone method to return the same plan
      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });

      // Mock isEqual to return true (same plans)
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

      // Load the plan first
      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.updateDetails({
          name: 'Test Plan',
          description: 'Test Description',
        });
      });

      expect(mockClone).toHaveBeenCalledWith({
        name: 'Test Plan',
        description: 'Test Description',
      });
      expect(result.current.draftPlan).toBe(mockUpdatedPlan);
      expect(result.current.isDirty).toBe(false);
    });

    it('should not update anything when draftPlan is null', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      act(() => {
        result.current.updateDetails({
          name: 'Updated Plan',
          description: 'Updated Description',
        });
      });

      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });

    it('should call isEqual with correct parameters', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Load the plan first
      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.updateDetails({ name: 'Updated Plan' });
      });

      expect(isEqual).toHaveBeenCalledWith(
        mockPlan.toPlainObject(),
        mockUpdatedPlan.toPlainObject()
      );
    });
  });

  describe('addSession', () => {
    it('should add a session and mark as dirty', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockAddSession = vi.fn().mockReturnValue(mockPlanWithAddedSession);
      const mockPlan = createMockPlan({ cloneWithAddedSession: mockAddSession });

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      const newSession = {
        ...mockSession,
        id: 'session-2',
        name: 'New Session',
      } as unknown as SessionModel;

      act(() => {
        result.current.addSession(newSession);
      });

      expect(mockAddSession).toHaveBeenCalledWith(newSession);
      expect(result.current.draftPlan).toBe(mockPlanWithAddedSession);
      expect(result.current.isDirty).toBe(true);
    });

    it('should not add session when draftPlan is null', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      act(() => {
        result.current.addSession(mockSession);
      });

      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('removeSession', () => {
    it('should remove a session and mark as dirty when result differs from original', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockRemoveSession = vi.fn().mockReturnValue(mockPlanWithRemovedSession);
      const mockPlan = createMockPlan({ cloneWithRemovedSession: mockRemoveSession });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.removeSession('session-1');
      });

      expect(mockRemoveSession).toHaveBeenCalledWith('session-1');
      expect(result.current.draftPlan).toBe(mockPlanWithRemovedSession);
      expect(result.current.isDirty).toBe(true);
    });

    it('should remove a session but not mark as dirty when result matches original', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockRemoveSession = vi.fn().mockReturnValue(mockPlanWithRemovedSession);
      const mockPlan = createMockPlan({ cloneWithRemovedSession: mockRemoveSession });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.removeSession('session-1');
      });

      expect(mockRemoveSession).toHaveBeenCalledWith('session-1');
      expect(result.current.draftPlan).toBe(mockPlanWithRemovedSession);
      expect(result.current.isDirty).toBe(false);
    });

    it('should not remove session when draftPlan is null', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      act(() => {
        result.current.removeSession('session-1');
      });

      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });

    it('should call isEqual with correct parameters when removing session', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockRemoveSession = vi.fn().mockReturnValue(mockPlanWithRemovedSession);
      const mockPlan = createMockPlan({ cloneWithRemovedSession: mockRemoveSession });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.removeSession('session-1');
      });

      expect(isEqual).toHaveBeenCalledWith(
        mockPlan.toPlainObject(),
        mockPlanWithRemovedSession.toPlainObject()
      );
    });
  });

  describe('reorderSession', () => {
    it('should reorder a session and mark as dirty when result differs from original', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockReorderSession = vi.fn().mockReturnValue(mockPlanWithReorderedSession);
      const mockPlan = createMockPlan({ cloneWithReorderedSession: mockReorderSession });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.reorderSession('session-1', 1);
      });

      expect(mockReorderSession).toHaveBeenCalledWith('session-1', 1);
      expect(result.current.draftPlan).toBe(mockPlanWithReorderedSession);
      expect(result.current.isDirty).toBe(true);
    });

    it('should reorder a session but not mark as dirty when result matches original', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockReorderSession = vi.fn().mockReturnValue(mockPlanWithReorderedSession);
      const mockPlan = createMockPlan({ cloneWithReorderedSession: mockReorderSession });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.reorderSession('session-1', 0);
      });

      expect(mockReorderSession).toHaveBeenCalledWith('session-1', 0);
      expect(result.current.draftPlan).toBe(mockPlanWithReorderedSession);
      expect(result.current.isDirty).toBe(false);
    });

    it('should not reorder session when draftPlan is null', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      act(() => {
        result.current.reorderSession('session-1', 1);
      });

      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });

    it('should call isEqual with correct parameters when reordering session', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockReorderSession = vi.fn().mockReturnValue(mockPlanWithReorderedSession);
      const mockPlan = createMockPlan({ cloneWithReorderedSession: mockReorderSession });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.reorderSession('session-1', 1);
      });

      expect(isEqual).toHaveBeenCalledWith(
        mockPlan.toPlainObject(),
        mockPlanWithReorderedSession.toPlainObject()
      );
    });
  });

  describe('reset', () => {
    it('should reset draft plan to original plan and clear dirty flag', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Load plan and make changes
      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.updateDetails({ name: 'Updated Plan' });
      });

      // Verify it's dirty
      expect(result.current.isDirty).toBe(true);
      expect(result.current.draftPlan).toBe(mockUpdatedPlan);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.draftPlan).toBe(mockPlan);
      expect(result.current.originalPlan).toBe(mockPlan);
      expect(result.current.isDirty).toBe(false);
    });

    it('should handle reset when originalPlan is null', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      act(() => {
        result.current.reset();
      });

      expect(result.current.draftPlan).toBeNull();
      expect(result.current.originalPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('unload', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Load plan and make changes
      act(() => {
        result.current.loadPlan(mockPlan);
      });

      act(() => {
        result.current.updateDetails({ name: 'Updated Plan' });
      });

      // Verify store has data
      expect(result.current.originalPlan).toBe(mockPlan);
      expect(result.current.draftPlan).toBe(mockUpdatedPlan);
      expect(result.current.isDirty).toBe(true);

      // Unload
      act(() => {
        result.current.unload();
      });

      expect(result.current.originalPlan).toBeNull();
      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('complex state management scenarios', () => {
    it('should handle multiple operations and maintain correct dirty state', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockAddSession = vi.fn().mockReturnValue(mockPlanWithAddedSession);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });

      // Set up mocks for the updated plan
      Object.assign(mockUpdatedPlan, { cloneWithAddedSession: mockAddSession });

      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      // Update details
      act(() => {
        result.current.updateDetails({ name: 'Updated Plan' });
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.draftPlan).toBe(mockUpdatedPlan);

      // Add session to the updated plan
      act(() => {
        result.current.addSession(mockSession);
      });

      expect(mockAddSession).toHaveBeenCalledWith(mockSession);
      expect(result.current.draftPlan).toBe(mockPlanWithAddedSession);
      expect(result.current.isDirty).toBe(true);
    });

    it('should properly handle state when operations return to original state', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const intermediatePlan = createMockPlan({ name: 'Intermediate' });
      const mockClone1 = vi.fn().mockReturnValue(intermediatePlan);
      const mockClone2 = vi.fn().mockReturnValue(mockUpdatedPlan);

      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone1 });
      Object.assign(intermediatePlan, { cloneWithUpdatedDetails: mockClone2 });

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      // First change - should be dirty
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.updateDetails({ name: 'Intermediate' });
      });

      expect(result.current.isDirty).toBe(true);

      // Second change returns to original - should not be dirty
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

      act(() => {
        result.current.updateDetails({ name: 'Test Plan' });
      });

      expect(result.current.isDirty).toBe(false);
    });

    it('should handle edge case when originalPlan is null during comparison operations', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      // Don't load a plan, so originalPlan remains null
      act(() => {
        result.current.removeSession('session-1');
      });

      // Should not crash and should maintain state
      expect(result.current.originalPlan).toBeNull();
      expect(result.current.draftPlan).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('zustand store behavior', () => {
    it('should allow multiple components to access the same store state', () => {
      const { result: result1 } = renderHook(() => usePlanEditorStore());
      const { result: result2 } = renderHook(() => usePlanEditorStore());

      const mockPlan = createMockPlan();

      act(() => {
        result1.current.loadPlan(mockPlan);
      });

      // Both hooks should see the same state
      expect(result2.current.originalPlan).toBe(mockPlan);
      expect(result2.current.draftPlan).toBe(mockPlan);
      expect(result2.current.isDirty).toBe(false);
    });

    it('should update all subscribers when state changes', () => {
      const { result: result1 } = renderHook(() => usePlanEditorStore());
      const { result: result2 } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });
      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result1.current.loadPlan(mockPlan);
      });

      act(() => {
        result1.current.updateDetails({ name: 'Updated from hook 1' });
      });

      // Both hooks should see the updated state
      expect(result2.current.draftPlan).toBe(mockUpdatedPlan);
      expect(result2.current.isDirty).toBe(true);
    });
  });

  describe('immer integration', () => {
    it('should properly handle immutable updates through immer', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      const initialState = {
        originalPlan: result.current.originalPlan,
        draftPlan: result.current.draftPlan,
        isDirty: result.current.isDirty,
      };

      (isEqual as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      act(() => {
        result.current.updateDetails({ name: 'Updated Plan' });
      });

      // Original state should remain unchanged
      expect(initialState.originalPlan).toBe(mockPlan);
      expect(initialState.draftPlan).toBe(mockPlan);
      expect(initialState.isDirty).toBe(false);

      // New state should be different
      expect(result.current.originalPlan).toBe(mockPlan);
      expect(result.current.draftPlan).toBe(mockUpdatedPlan);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle errors in domain model methods gracefully', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockImplementation(() => {
        throw new Error('Domain model error');
      });
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      expect(() => {
        act(() => {
          result.current.updateDetails({ name: 'Updated Plan' });
        });
      }).toThrow('Domain model error');

      // Store should maintain previous state
      expect(result.current.originalPlan).toBe(mockPlan);
      expect(result.current.draftPlan).toBe(mockPlan);
      expect(result.current.isDirty).toBe(false);
    });

    it('should handle isEqual comparison errors gracefully', () => {
      const { result } = renderHook(() => usePlanEditorStore());

      const mockClone = vi.fn().mockReturnValue(mockUpdatedPlan);
      const mockPlan = createMockPlan({ cloneWithUpdatedDetails: mockClone });

      act(() => {
        result.current.loadPlan(mockPlan);
      });

      (isEqual as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('isEqual error');
      });

      expect(() => {
        act(() => {
          result.current.updateDetails({ name: 'Updated Plan' });
        });
      }).toThrow('isEqual error');
    });
  });
});
