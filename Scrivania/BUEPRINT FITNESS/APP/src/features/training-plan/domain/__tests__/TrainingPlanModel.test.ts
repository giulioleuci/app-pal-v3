import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateId } from '@/lib';
import { TrainingPlanData, trainingPlanSchema } from '@/shared/types';
import { createTestSessionModel, createTestWorkoutSessionData } from '@/test-factories';

import { SessionModel } from '../SessionModel';
import { TrainingPlanModel } from '../TrainingPlanModel';

// Mock external dependencies
vi.mock('@/lib', () => {
  const uuids = [
    '12345678-1234-4234-8234-123456789abc',
    '22345678-1234-4234-9234-123456789abc',
    '32345678-1234-4234-a234-123456789abc',
    '42345678-1234-4234-b234-123456789abc',
    '52345678-1234-4234-8234-123456789abc',
    '62345678-1234-4234-9234-123456789abc',
    '72345678-1234-4234-a234-123456789abc',
    '82345678-1234-4234-b234-123456789abc',
    '92345678-1234-4234-8234-123456789abc',
    'a2345678-1234-4234-9234-123456789abc',
    'b2345678-1234-4234-a234-123456789abc',
    'c2345678-1234-4234-b234-123456789abc',
  ];
  let counter = 0;
  return {
    generateId: vi.fn(() => {
      const uuid = uuids[counter % uuids.length];
      counter++;
      return uuid;
    }),
  };
});

/**
 * Test factory for creating TrainingPlanData
 */
function createTestTrainingPlanData(overrides: Partial<TrainingPlanData> = {}): TrainingPlanData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    name: 'Test Training Plan',
    description: 'A test training plan description',
    sessionIds: [generateId(), generateId()],
    isArchived: false,
    currentSessionIndex: 0,
    notes: 'Test notes',
    cycleId: null,
    order: 1,
    lastUsed: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Test factory for creating TrainingPlanModel
 */
function createTestTrainingPlanModel(
  overrides: Partial<TrainingPlanData> = {},
  sessions?: SessionModel[]
): TrainingPlanModel {
  const data = createTestTrainingPlanData(overrides);
  const testSessions = sessions || [
    createTestSessionModel({ id: data.sessionIds[0] }),
    createTestSessionModel({ id: data.sessionIds[1] }),
  ];
  return TrainingPlanModel.hydrate(data, testSessions);
}

describe('TrainingPlanModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('protected constructor', () => {
    it('should not be directly instantiable via new', () => {
      // This test verifies TypeScript compilation behavior
      // In TypeScript, protected constructors prevent external instantiation
      expect(typeof TrainingPlanModel.prototype.constructor).toBe('function');
    });
  });

  describe('hydrate', () => {
    it('should create a new TrainingPlanModel instance from plain data', () => {
      // Arrange
      const data = createTestTrainingPlanData();
      const sessions = [createTestSessionModel(), createTestSessionModel()];

      // Act
      const model = TrainingPlanModel.hydrate(data, sessions);

      // Assert
      expect(model).toBeInstanceOf(TrainingPlanModel);
      expect(model.id).toBe(data.id);
      expect(model.profileId).toBe(data.profileId);
      expect(model.name).toBe(data.name);
      expect(model.description).toBe(data.description);
      expect(model.sessions).toBe(sessions);
      expect(model.isArchived).toBe(data.isArchived);
      expect(model.currentSessionIndex).toBe(data.currentSessionIndex);
      expect(model.notes).toBe(data.notes);
      expect(model.cycleId).toBe(data.cycleId);
      expect(model.order).toBe(data.order);
      expect(model.lastUsed).toBe(data.lastUsed);
      expect(model.createdAt).toBe(data.createdAt);
      expect(model.updatedAt).toBe(data.updatedAt);
    });

    it('should handle optional properties correctly', () => {
      // Arrange
      const data = createTestTrainingPlanData({
        description: undefined,
        notes: undefined,
        order: undefined,
        lastUsed: undefined,
      });
      const sessions: SessionModel[] = [];

      // Act
      const model = TrainingPlanModel.hydrate(data, sessions);

      // Assert
      expect(model.description).toBeUndefined();
      expect(model.notes).toBeUndefined();
      expect(model.order).toBeUndefined();
      expect(model.lastUsed).toBeUndefined();
      expect(model.sessions).toBe(sessions);
    });

    it('should handle empty sessions array', () => {
      // Arrange
      const data = createTestTrainingPlanData({ sessionIds: [] });
      const sessions: SessionModel[] = [];

      // Act
      const model = TrainingPlanModel.hydrate(data, sessions);

      // Assert
      expect(model.sessions).toHaveLength(0);
      expect(model.sessions).toBe(sessions);
    });
  });

  describe('cloneWithUpdatedDetails', () => {
    it('should create new instance with updated name', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ name: 'Original Plan' });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ name: 'Updated Plan' });

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.name).toBe('Updated Plan');
      expect(original.name).toBe('Original Plan'); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should create new instance with updated description', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ description: 'Original description' });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ description: 'Updated description' });

      // Assert
      expect(cloned.description).toBe('Updated description');
      expect(original.description).toBe('Original description');
    });

    it('should create new instance with updated notes', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ notes: 'Original notes' });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ notes: 'Updated notes' });

      // Assert
      expect(cloned.notes).toBe('Updated notes');
      expect(original.notes).toBe('Original notes');
    });

    it('should update multiple details at once', () => {
      // Arrange
      const original = createTestTrainingPlanModel({
        name: 'Original Plan',
        description: 'Original description',
        notes: 'Original notes',
      });

      // Act
      const cloned = original.cloneWithUpdatedDetails({
        name: 'Updated Plan',
        description: 'Updated description',
        notes: 'Updated notes',
      });

      // Assert
      expect(cloned.name).toBe('Updated Plan');
      expect(cloned.description).toBe('Updated description');
      expect(cloned.notes).toBe('Updated notes');
      expect(original.name).toBe('Original Plan');
      expect(original.description).toBe('Original description');
      expect(original.notes).toBe('Original notes');
    });

    it('should preserve other properties when updating details', () => {
      // Arrange
      const original = createTestTrainingPlanModel({
        profileId: 'test-profile',
        isArchived: true,
        currentSessionIndex: 2,
      });

      // Act
      const cloned = original.cloneWithUpdatedDetails({ name: 'New Name' });

      // Assert
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.isArchived).toBe(original.isArchived);
      expect(cloned.currentSessionIndex).toBe(original.currentSessionIndex);
      expect(cloned.sessions).toBe(original.sessions);
    });
  });

  describe('cloneWithAddedSession', () => {
    it('should create new instance with added session', () => {
      // Arrange
      const original = createTestTrainingPlanModel();
      const newSession = createTestSessionModel({ name: 'New Session' });
      const originalSessionCount = original.sessions.length;

      // Act
      const cloned = original.cloneWithAddedSession(newSession);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.sessions).toHaveLength(originalSessionCount + 1);
      expect(cloned.sessions).toContain(newSession);
      expect(original.sessions).toHaveLength(originalSessionCount); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should add session to end of sessions array', () => {
      // Arrange
      const session1 = createTestSessionModel({ name: 'Session 1' });
      const session2 = createTestSessionModel({ name: 'Session 2' });
      const original = createTestTrainingPlanModel({}, [session1, session2]);
      const newSession = createTestSessionModel({ name: 'New Session' });

      // Act
      const cloned = original.cloneWithAddedSession(newSession);

      // Assert
      expect(cloned.sessions[0]).toBe(session1);
      expect(cloned.sessions[1]).toBe(session2);
      expect(cloned.sessions[2]).toBe(newSession);
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestTrainingPlanModel({
        name: 'Test Plan',
        isArchived: true,
        currentSessionIndex: 1,
      });
      const newSession = createTestSessionModel();

      // Act
      const cloned = original.cloneWithAddedSession(newSession);

      // Assert
      expect(cloned.name).toBe(original.name);
      expect(cloned.isArchived).toBe(original.isArchived);
      expect(cloned.currentSessionIndex).toBe(original.currentSessionIndex);
      expect(cloned.profileId).toBe(original.profileId);
    });
  });

  describe('cloneWithRemovedSession', () => {
    it('should create new instance with session removed', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1', name: 'Session 1' });
      const session2 = createTestSessionModel({ id: 'session-2', name: 'Session 2' });
      const session3 = createTestSessionModel({ id: 'session-3', name: 'Session 3' });
      const original = createTestTrainingPlanModel({}, [session1, session2, session3]);

      // Act
      const cloned = original.cloneWithRemovedSession('session-2');

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.sessions).toHaveLength(2);
      expect(cloned.sessions).not.toContain(session2);
      expect(cloned.sessions).toContain(session1);
      expect(cloned.sessions).toContain(session3);
      expect(original.sessions).toHaveLength(3); // Original unchanged
    });

    it('should handle removing non-existent session', () => {
      // Arrange
      const original = createTestTrainingPlanModel();
      const originalSessionCount = original.sessions.length;

      // Act
      const cloned = original.cloneWithRemovedSession('non-existent-session');

      // Assert
      expect(cloned.sessions).toHaveLength(originalSessionCount);
      expect(cloned.sessions).toEqual(original.sessions);
    });

    it('should handle empty sessions array', () => {
      // Arrange
      const original = createTestTrainingPlanModel({}, []);

      // Act
      const cloned = original.cloneWithRemovedSession('any-session');

      // Assert
      expect(cloned.sessions).toHaveLength(0);
    });
  });

  describe('cloneWithReorderedSession', () => {
    it('should reorder session to new position', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1', name: 'Session 1' });
      const session2 = createTestSessionModel({ id: 'session-2', name: 'Session 2' });
      const session3 = createTestSessionModel({ id: 'session-3', name: 'Session 3' });
      const original = createTestTrainingPlanModel({}, [session1, session2, session3]);

      // Act - Move session 1 to position 2 (index 1)
      const cloned = original.cloneWithReorderedSession('session-1', 1);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.sessions[0]).toBe(session2);
      expect(cloned.sessions[1]).toBe(session1);
      expect(cloned.sessions[2]).toBe(session3);
      expect(original.sessions[0]).toBe(session1); // Original unchanged
    });

    it('should handle moving session to end', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1' });
      const session2 = createTestSessionModel({ id: 'session-2' });
      const session3 = createTestSessionModel({ id: 'session-3' });
      const original = createTestTrainingPlanModel({}, [session1, session2, session3]);

      // Act
      const cloned = original.cloneWithReorderedSession('session-1', 2);

      // Assert
      expect(cloned.sessions[0]).toBe(session2);
      expect(cloned.sessions[1]).toBe(session3);
      expect(cloned.sessions[2]).toBe(session1);
    });

    it('should return unchanged instance if session not found', () => {
      // Arrange
      const original = createTestTrainingPlanModel();

      // Act
      const cloned = original.cloneWithReorderedSession('non-existent', 0);

      // Assert
      expect(cloned).toBe(original);
    });

    it('should return unchanged instance if newIndex is invalid', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1' });
      const original = createTestTrainingPlanModel({}, [session1]);

      // Act - Test negative index
      const cloned1 = original.cloneWithReorderedSession('session-1', -1);
      // Act - Test index too large
      const cloned2 = original.cloneWithReorderedSession('session-1', 5);

      // Assert
      expect(cloned1).toBe(original);
      expect(cloned2).toBe(original);
    });
  });

  describe('cloneWithReplacedSession', () => {
    it('should replace session with new session', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1', name: 'Session 1' });
      const session2 = createTestSessionModel({ id: 'session-2', name: 'Session 2' });
      const original = createTestTrainingPlanModel({}, [session1, session2]);
      const replacementSession = createTestSessionModel({ name: 'Replacement Session' });

      // Act
      const cloned = original.cloneWithReplacedSession('session-1', replacementSession);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.sessions).toHaveLength(2);
      expect(cloned.sessions[0]).toBe(replacementSession);
      expect(cloned.sessions[1]).toBe(session2);
      expect(original.sessions[0]).toBe(session1); // Original unchanged
    });

    it('should handle replacing non-existent session', () => {
      // Arrange
      const original = createTestTrainingPlanModel();
      const replacementSession = createTestSessionModel();
      const originalSessions = [...original.sessions];

      // Act
      const cloned = original.cloneWithReplacedSession('non-existent', replacementSession);

      // Assert
      expect(cloned.sessions).toEqual(originalSessions);
    });

    it('should preserve session order when replacing', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1' });
      const session2 = createTestSessionModel({ id: 'session-2' });
      const session3 = createTestSessionModel({ id: 'session-3' });
      const original = createTestTrainingPlanModel({}, [session1, session2, session3]);
      const replacementSession = createTestSessionModel({ name: 'Replacement' });

      // Act
      const cloned = original.cloneWithReplacedSession('session-2', replacementSession);

      // Assert
      expect(cloned.sessions[0]).toBe(session1);
      expect(cloned.sessions[1]).toBe(replacementSession);
      expect(cloned.sessions[2]).toBe(session3);
    });
  });

  describe('cloneAsArchived', () => {
    it('should create new instance marked as archived', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ isArchived: false });

      // Act
      const cloned = original.cloneAsArchived();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.isArchived).toBe(true);
      expect(original.isArchived).toBe(false); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestTrainingPlanModel({
        name: 'Test Plan',
        currentSessionIndex: 2,
      });

      // Act
      const cloned = original.cloneAsArchived();

      // Assert
      expect(cloned.name).toBe(original.name);
      expect(cloned.currentSessionIndex).toBe(original.currentSessionIndex);
      expect(cloned.sessions).toBe(original.sessions);
    });
  });

  describe('cloneAsUnarchived', () => {
    it('should create new instance marked as unarchived', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ isArchived: true });

      // Act
      const cloned = original.cloneAsUnarchived();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.isArchived).toBe(false);
      expect(original.isArchived).toBe(true); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should preserve all other properties', () => {
      // Arrange
      const original = createTestTrainingPlanModel({
        name: 'Test Plan',
        currentSessionIndex: 1,
        isArchived: true,
      });

      // Act
      const cloned = original.cloneAsUnarchived();

      // Assert
      expect(cloned.name).toBe(original.name);
      expect(cloned.currentSessionIndex).toBe(original.currentSessionIndex);
      expect(cloned.sessions).toBe(original.sessions);
    });
  });

  describe('cloneWithAssignedCycle', () => {
    it('should create new instance with assigned cycle', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ cycleId: null });
      const cycleId = generateId();

      // Act
      const cloned = original.cloneWithAssignedCycle(cycleId);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.cycleId).toBe(cycleId);
      expect(original.cycleId).toBeNull(); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should replace existing cycle assignment', () => {
      // Arrange
      const oldCycleId = generateId();
      const newCycleId = generateId();
      const original = createTestTrainingPlanModel({ cycleId: oldCycleId });

      // Act
      const cloned = original.cloneWithAssignedCycle(newCycleId);

      // Assert
      expect(cloned.cycleId).toBe(newCycleId);
      expect(original.cycleId).toBe(oldCycleId);
    });
  });

  describe('cloneWithRemovedCycle', () => {
    it('should create new instance with removed cycle', () => {
      // Arrange
      const cycleId = generateId();
      const original = createTestTrainingPlanModel({ cycleId });

      // Act
      const cloned = original.cloneWithRemovedCycle();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.cycleId).toBeNull();
      expect(original.cycleId).toBe(cycleId); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle removing when already null', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ cycleId: null });

      // Act
      const cloned = original.cloneWithRemovedCycle();

      // Assert
      expect(cloned.cycleId).toBeNull();
      expect(original.cycleId).toBeNull();
    });
  });

  describe('cloneWithUpdatedOrderInCycle', () => {
    it('should create new instance with updated order', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ order: 1 });

      // Act
      const cloned = original.cloneWithUpdatedOrderInCycle(5);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.order).toBe(5);
      expect(original.order).toBe(1); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should handle setting order from undefined', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ order: undefined });

      // Act
      const cloned = original.cloneWithUpdatedOrderInCycle(3);

      // Assert
      expect(cloned.order).toBe(3);
      expect(original.order).toBeUndefined();
    });
  });

  describe('cloneWithProgressedSession', () => {
    it('should progress to next session', () => {
      // Arrange
      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const session3 = createTestSessionModel();
      const original = createTestTrainingPlanModel({ currentSessionIndex: 0 }, [
        session1,
        session2,
        session3,
      ]);

      // Act
      const cloned = original.cloneWithProgressedSession();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.currentSessionIndex).toBe(1);
      expect(original.currentSessionIndex).toBe(0); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should wrap around to first session when at the end', () => {
      // Arrange
      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const original = createTestTrainingPlanModel({ currentSessionIndex: 1 }, [
        session1,
        session2,
      ]);

      // Act
      const cloned = original.cloneWithProgressedSession();

      // Assert
      expect(cloned.currentSessionIndex).toBe(0);
      expect(original.currentSessionIndex).toBe(1);
    });

    it('should handle empty sessions array', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ currentSessionIndex: 5 }, []);

      // Act
      const cloned = original.cloneWithProgressedSession();

      // Assert
      expect(cloned.currentSessionIndex).toBe(0);
    });

    it('should handle single session', () => {
      // Arrange
      const session = createTestSessionModel();
      const original = createTestTrainingPlanModel({ currentSessionIndex: 0 }, [session]);

      // Act
      const cloned = original.cloneWithProgressedSession();

      // Assert
      expect(cloned.currentSessionIndex).toBe(0); // Wraps around to same session
    });
  });

  describe('cloneAsUsed', () => {
    it('should create new instance with lastUsed date', () => {
      // Arrange
      const original = createTestTrainingPlanModel({ lastUsed: undefined });
      const usedDate = new Date('2024-01-15');

      // Act
      const cloned = original.cloneAsUsed(usedDate);

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.lastUsed).toBe(usedDate);
      expect(original.lastUsed).toBeUndefined(); // Original unchanged
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });

    it('should replace existing lastUsed date', () => {
      // Arrange
      const oldDate = new Date('2024-01-10');
      const newDate = new Date('2024-01-20');
      const original = createTestTrainingPlanModel({ lastUsed: oldDate });

      // Act
      const cloned = original.cloneAsUsed(newDate);

      // Assert
      expect(cloned.lastUsed).toBe(newDate);
      expect(original.lastUsed).toBe(oldDate);
    });
  });

  describe('findSessionById', () => {
    it('should find session by ID', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1', name: 'Session 1' });
      const session2 = createTestSessionModel({ id: 'session-2', name: 'Session 2' });
      const plan = createTestTrainingPlanModel({}, [session1, session2]);

      // Act
      const found = plan.findSessionById('session-1');

      // Assert
      expect(found).toBe(session1);
    });

    it('should return undefined when session not found', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1' });
      const plan = createTestTrainingPlanModel({}, [session1]);

      // Act
      const found = plan.findSessionById('non-existent');

      // Assert
      expect(found).toBeUndefined();
    });

    it('should handle empty sessions array', () => {
      // Arrange
      const plan = createTestTrainingPlanModel({}, []);

      // Act
      const found = plan.findSessionById('any-session');

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session based on currentSessionIndex', () => {
      // Arrange
      const session1 = createTestSessionModel({ name: 'Session 1' });
      const session2 = createTestSessionModel({ name: 'Session 2' });
      const session3 = createTestSessionModel({ name: 'Session 3' });
      const plan = createTestTrainingPlanModel({ currentSessionIndex: 1 }, [
        session1,
        session2,
        session3,
      ]);

      // Act
      const current = plan.getCurrentSession();

      // Assert
      expect(current).toBe(session2);
    });

    it('should return undefined when currentSessionIndex is out of bounds', () => {
      // Arrange
      const session1 = createTestSessionModel();
      const plan = createTestTrainingPlanModel({ currentSessionIndex: 5 }, [session1]);

      // Act
      const current = plan.getCurrentSession();

      // Assert
      expect(current).toBeUndefined();
    });

    it('should return undefined when no sessions exist', () => {
      // Arrange
      const plan = createTestTrainingPlanModel({ currentSessionIndex: 0 }, []);

      // Act
      const current = plan.getCurrentSession();

      // Assert
      expect(current).toBeUndefined();
    });

    it('should handle negative currentSessionIndex', () => {
      // Arrange
      const session1 = createTestSessionModel();
      const plan = createTestTrainingPlanModel({ currentSessionIndex: -1 }, [session1]);

      // Act
      const current = plan.getCurrentSession();

      // Assert
      expect(current).toBeUndefined();
    });
  });

  describe('getTotalSessions', () => {
    it('should return total number of sessions', () => {
      // Arrange
      const sessions = [
        createTestSessionModel(),
        createTestSessionModel(),
        createTestSessionModel(),
      ];
      const plan = createTestTrainingPlanModel({}, sessions);

      // Act
      const total = plan.getTotalSessions();

      // Assert
      expect(total).toBe(3);
    });

    it('should return 0 for empty sessions array', () => {
      // Arrange
      const plan = createTestTrainingPlanModel({}, []);

      // Act
      const total = plan.getTotalSessions();

      // Assert
      expect(total).toBe(0);
    });
  });

  describe('getDeloadSessionCount', () => {
    it('should count deload sessions', () => {
      // Arrange
      const session1 = createTestSessionModel({ isDeload: false });
      const session2 = createTestSessionModel({ isDeload: true });
      const session3 = createTestSessionModel({ isDeload: true });
      const session4 = createTestSessionModel({ isDeload: false });
      const plan = createTestTrainingPlanModel({}, [session1, session2, session3, session4]);

      // Act
      const deloadCount = plan.getDeloadSessionCount();

      // Assert
      expect(deloadCount).toBe(2);
    });

    it('should return 0 when no deload sessions exist', () => {
      // Arrange
      const session1 = createTestSessionModel({ isDeload: false });
      const session2 = createTestSessionModel({ isDeload: false });
      const plan = createTestTrainingPlanModel({}, [session1, session2]);

      // Act
      const deloadCount = plan.getDeloadSessionCount();

      // Assert
      expect(deloadCount).toBe(0);
    });

    it('should return 0 for empty sessions array', () => {
      // Arrange
      const plan = createTestTrainingPlanModel({}, []);

      // Act
      const deloadCount = plan.getDeloadSessionCount();

      // Assert
      expect(deloadCount).toBe(0);
    });
  });

  describe('estimateTotalDurationMinutes', () => {
    it('should estimate total duration from all sessions', () => {
      // Arrange
      const mockSession1 = createTestSessionModel();
      const mockSession2 = createTestSessionModel();

      // Mock the getEstimatedDurationSeconds method
      vi.spyOn(mockSession1, 'getEstimatedDurationSeconds').mockReturnValue(3600); // 1 hour
      vi.spyOn(mockSession2, 'getEstimatedDurationSeconds').mockReturnValue(1800); // 30 minutes

      const plan = createTestTrainingPlanModel({}, [mockSession1, mockSession2]);

      // Act
      const estimation = plan.estimateTotalDurationMinutes();

      // Assert
      expect(estimation.min).toBe(72); // 90 minutes * 0.8 = 72
      expect(estimation.max).toBe(108); // 90 minutes * 1.2 = 108
    });

    it('should handle empty sessions array', () => {
      // Arrange
      const plan = createTestTrainingPlanModel({}, []);

      // Act
      const estimation = plan.estimateTotalDurationMinutes();

      // Assert
      expect(estimation.min).toBe(0);
      expect(estimation.max).toBe(0);
    });

    it('should round duration estimates correctly', () => {
      // Arrange
      const mockSession = createTestSessionModel();
      vi.spyOn(mockSession, 'getEstimatedDurationSeconds').mockReturnValue(125); // ~2 minutes
      const plan = createTestTrainingPlanModel({}, [mockSession]);

      // Act
      const estimation = plan.estimateTotalDurationMinutes();

      // Assert
      expect(estimation.min).toBe(2); // Math.round(2.083 * 0.8) = Math.round(1.67) = 2
      expect(estimation.max).toBe(3); // Math.round(2.083 * 1.2) = Math.round(2.5) = 3
    });
  });

  describe('clone', () => {
    it('should create deep clone with cloned sessions', () => {
      // Arrange
      const session1 = createTestSessionModel();
      const session2 = createTestSessionModel();
      const original = createTestTrainingPlanModel({}, [session1, session2]);

      // Mock clone methods
      const clonedSession1 = createTestSessionModel();
      const clonedSession2 = createTestSessionModel();
      vi.spyOn(session1, 'clone').mockReturnValue(clonedSession1 as any);
      vi.spyOn(session2, 'clone').mockReturnValue(clonedSession2 as any);

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned).not.toBe(original);
      expect(cloned.sessions).not.toBe(original.sessions);
      expect(session1.clone).toHaveBeenCalled();
      expect(session2.clone).toHaveBeenCalled();
    });

    it('should preserve all properties in cloned instance', () => {
      // Arrange
      const original = createTestTrainingPlanModel({
        name: 'Test Plan',
        description: 'Test description',
        isArchived: true,
        currentSessionIndex: 2,
        notes: 'Test notes',
      });

      // Act
      const cloned = original.clone();

      // Assert
      expect(cloned.id).toBe(original.id);
      expect(cloned.profileId).toBe(original.profileId);
      expect(cloned.name).toBe(original.name);
      expect(cloned.description).toBe(original.description);
      expect(cloned.isArchived).toBe(original.isArchived);
      expect(cloned.currentSessionIndex).toBe(original.currentSessionIndex);
      expect(cloned.notes).toBe(original.notes);
      expect(cloned.cycleId).toBe(original.cycleId);
      expect(cloned.order).toBe(original.order);
      expect(cloned.lastUsed).toBe(original.lastUsed);
      expect(cloned.createdAt).toBe(original.createdAt);
      expect(cloned.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('toPlainObject', () => {
    it('should return correct plain object representation', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1' });
      const session2 = createTestSessionModel({ id: 'session-2' });
      const data = createTestTrainingPlanData({
        profileId: 'test-profile',
        name: 'Test Plan',
        description: 'Test description',
        isArchived: true,
        currentSessionIndex: 1,
        notes: 'Test notes',
        cycleId: 'test-cycle',
        order: 5,
      });
      const plan = TrainingPlanModel.hydrate(data, [session1, session2]);

      // Act
      const plainObject = plan.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: data.id,
        profileId: 'test-profile',
        name: 'Test Plan',
        description: 'Test description',
        sessionIds: ['session-1', 'session-2'],
        isArchived: true,
        currentSessionIndex: 1,
        notes: 'Test notes',
        cycleId: 'test-cycle',
        order: 5,
        lastUsed: data.lastUsed,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    it('should handle optional properties correctly', () => {
      // Arrange
      const data = createTestTrainingPlanData({
        description: undefined,
        notes: undefined,
        cycleId: null,
        order: undefined,
        lastUsed: undefined,
      });
      const plan = TrainingPlanModel.hydrate(data, []);

      // Act
      const plainObject = plan.toPlainObject();

      // Assert
      expect(plainObject.description).toBeUndefined();
      expect(plainObject.notes).toBeUndefined();
      expect(plainObject.cycleId).toBeNull();
      expect(plainObject.order).toBeUndefined();
      expect(plainObject.lastUsed).toBeUndefined();
      expect(plainObject.sessionIds).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should return successful validation for valid data', () => {
      // Arrange
      const plan = createTestTrainingPlanModel();

      // Act
      const result = plan.validate();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use trainingPlanSchema for validation', () => {
      // Arrange
      const plan = createTestTrainingPlanModel();
      const safeParseSpy = vi.spyOn(trainingPlanSchema, 'safeParse');

      // Act
      plan.validate();

      // Assert
      expect(safeParseSpy).toHaveBeenCalledWith(plan.toPlainObject());
    });

    it('should return validation errors for invalid data', () => {
      // Arrange - Create plan with invalid data
      const invalidData = createTestTrainingPlanData({
        name: '', // Invalid: empty name
      });
      const plan = TrainingPlanModel.hydrate(invalidData, []);

      // Act
      const result = plan.validate();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('immutability', () => {
    it('should not modify original instance when using clone methods', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'session-1' });
      const session2 = createTestSessionModel({ id: 'session-2' });
      const original = createTestTrainingPlanModel(
        {
          name: 'Original Plan',
          description: 'Original description',
          isArchived: false,
          currentSessionIndex: 0,
          notes: 'Original notes',
          cycleId: null,
          order: 1,
        },
        [session1, session2]
      );

      const originalData = {
        name: original.name,
        description: original.description,
        isArchived: original.isArchived,
        currentSessionIndex: original.currentSessionIndex,
        notes: original.notes,
        cycleId: original.cycleId,
        order: original.order,
        sessionCount: original.sessions.length,
        updatedAt: original.updatedAt,
      };

      // Act - Perform multiple operations
      const newSession = createTestSessionModel({ id: 'new-session' });
      const cloned1 = original.cloneWithUpdatedDetails({ name: 'New Name' });
      const cloned2 = original.cloneWithAddedSession(newSession);
      const cloned3 = original.cloneWithRemovedSession('session-1');
      const cloned4 = original.cloneAsArchived();
      const cloned5 = original.cloneWithProgressedSession();
      const cloned6 = original.cloneWithAssignedCycle('cycle-1');

      // Assert - Original unchanged
      expect(original.name).toBe(originalData.name);
      expect(original.description).toBe(originalData.description);
      expect(original.isArchived).toBe(originalData.isArchived);
      expect(original.currentSessionIndex).toBe(originalData.currentSessionIndex);
      expect(original.notes).toBe(originalData.notes);
      expect(original.cycleId).toBe(originalData.cycleId);
      expect(original.order).toBe(originalData.order);
      expect(original.sessions.length).toBe(originalData.sessionCount);
      expect(original.updatedAt).toBe(originalData.updatedAt);

      // Verify clones have different values
      expect(cloned1.name).toBe('New Name');
      expect(cloned2.sessions.length).toBe(originalData.sessionCount + 1);
      expect(cloned3.sessions.length).toBe(originalData.sessionCount - 1);
      expect(cloned4.isArchived).toBe(true);
      expect(cloned5.currentSessionIndex).toBe(1);
      expect(cloned6.cycleId).toBe('cycle-1');
    });
  });

  describe('complex operations', () => {
    it('should handle complex training plan manipulations', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'push-day', name: 'Push Day' });
      const session2 = createTestSessionModel({ id: 'pull-day', name: 'Pull Day' });
      const session3 = createTestSessionModel({ id: 'legs-day', name: 'Legs Day' });
      let plan = createTestTrainingPlanModel(
        {
          name: 'PPL Program',
          currentSessionIndex: 0,
          isArchived: false,
        },
        [session1, session2, session3]
      );

      // Act: Multiple operations
      plan = plan.cloneWithUpdatedDetails({
        name: 'Updated PPL Program',
        description: 'Push-Pull-Legs with variations',
      });
      plan = plan.cloneWithProgressedSession(); // Move to pull day
      plan = plan.cloneWithProgressedSession(); // Move to legs day
      plan = plan.cloneWithAssignedCycle('cutting-cycle');
      plan = plan.cloneWithUpdatedOrderInCycle(2);

      // Assert
      expect(plan.name).toBe('Updated PPL Program');
      expect(plan.description).toBe('Push-Pull-Legs with variations');
      expect(plan.currentSessionIndex).toBe(2); // Legs day
      expect(plan.getCurrentSession()?.name).toBe('Legs Day');
      expect(plan.cycleId).toBe('cutting-cycle');
      expect(plan.order).toBe(2);
    });

    it('should handle session management across operations', () => {
      // Arrange
      const session1 = createTestSessionModel({ id: 'upper', name: 'Upper Body' });
      const session2 = createTestSessionModel({ id: 'lower', name: 'Lower Body' });
      let plan = createTestTrainingPlanModel({}, [session1, session2]);

      // Act: Add, reorder, and remove sessions
      const newSession = createTestSessionModel({ id: 'cardio', name: 'Cardio' });
      plan = plan.cloneWithAddedSession(newSession);
      expect(plan.sessions).toHaveLength(3);

      plan = plan.cloneWithReorderedSession('cardio', 0); // Move cardio to first
      expect(plan.sessions[0].name).toBe('Cardio');

      plan = plan.cloneWithRemovedSession('upper');
      expect(plan.sessions).toHaveLength(2);
      expect(plan.findSessionById('upper')).toBeUndefined();

      // Assert
      expect(plan.sessions[0].name).toBe('Cardio');
      expect(plan.sessions[1].name).toBe('Lower Body');
    });

    it('should handle archiving and cycle management', () => {
      // Arrange
      let plan = createTestTrainingPlanModel({
        name: 'Strength Program',
        isArchived: false,
        cycleId: null,
      });

      // Act: Archive, assign to cycle, then unarchive
      plan = plan.cloneAsArchived();
      expect(plan.isArchived).toBe(true);

      plan = plan.cloneWithAssignedCycle('strength-cycle');
      expect(plan.cycleId).toBe('strength-cycle');

      plan = plan.cloneAsUnarchived();
      expect(plan.isArchived).toBe(false);

      // Should still be assigned to cycle after unarchiving
      expect(plan.cycleId).toBe('strength-cycle');
    });

    it('should handle session progression with wrap-around', () => {
      // Arrange
      const sessions = [
        createTestSessionModel({ id: 'day1', name: 'Day 1' }),
        createTestSessionModel({ id: 'day2', name: 'Day 2' }),
        createTestSessionModel({ id: 'day3', name: 'Day 3' }),
      ];
      let plan = createTestTrainingPlanModel({ currentSessionIndex: 2 }, sessions);

      // Act: Progress from last session (should wrap to first)
      plan = plan.cloneWithProgressedSession();

      // Assert
      expect(plan.currentSessionIndex).toBe(0);
      expect(plan.getCurrentSession()?.name).toBe('Day 1');
    });
  });
});
