import { produce } from 'immer';

import { generateId } from '@/lib';
import { TrainingPlanMustHaveSessionsError } from '@/shared/errors';
import { ExerciseGroupData } from '@/shared/types';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { ExerciseGroupModel } from '../ExerciseGroupModel';
import { SessionModel } from '../SessionModel';
import { TrainingPlanModel } from '../TrainingPlanModel';

/**
 * A builder for constructing a TrainingPlanModel from scratch.
 * Provides a fluent API for step-by-step creation of a valid training plan.
 */
export class TrainingPlanBuilder {
  private plan: TrainingPlanModel;
  private currentSessionId: string | null = null;

  /**
   * Creates a new TrainingPlanBuilder instance.
   * @param initialPlan The initial, empty TrainingPlanModel to build upon
   */
  constructor(initialPlan: TrainingPlanModel) {
    this.plan = initialPlan;
  }

  /**
   * Adds a new session to the training plan and selects it as the current session.
   * @param name The name of the session to add
   * @returns This builder instance for method chaining
   */
  addSession(name: string): this {
    const now = new Date();
    const newSession = SessionModel.hydrate(
      {
        id: generateId(),
        profileId: this.plan.profileId,
        name,
        groupIds: [],
        createdAt: now,
        updatedAt: now,
        isDeload: false,
        dayOfWeek: null,
        executionCount: 0,
      },
      []
    );

    this.plan = this.plan.cloneWithAddedSession(newSession);
    this.currentSessionId = newSession.id;
    return this;
  }

  /**
   * Removes a session from the training plan.
   * If the removed session was the current session, selects the first available session.
   * @param sessionId The ID of the session to remove
   * @returns This builder instance for method chaining
   */
  removeSession(sessionId: string): this {
    this.plan = this.plan.cloneWithRemovedSession(sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = this.plan.sessions[0]?.id || null;
    }
    return this;
  }

  /**
   * Selects a session as the current working session.
   * @param sessionId The ID of the session to select
   * @returns This builder instance for method chaining
   */
  selectSession(sessionId: string): this {
    if (this.plan.findSessionById(sessionId)) {
      this.currentSessionId = sessionId;
    }
    return this;
  }

  /**
   * Updates the details of the currently selected session.
   * @param details The details to update
   * @returns This builder instance for method chaining
   */
  updateCurrentSessionDetails(details: { name: string }): this {
    if (!this.currentSessionId) return this;
    const session = this.plan.findSessionById(this.currentSessionId);
    if (!session) return this;

    const updatedSession = produce(session, (draft) => {
      draft.name = details.name;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).updatedAt = new Date();
    });

    this.plan = this.plan.cloneWithReplacedSession(this.currentSessionId, updatedSession);
    return this;
  }

  /**
   * Adds a single exercise to the currently selected session.
   * This method creates a 'single' type ExerciseGroupData object. It then uses the
   * ExerciseGroupModel.hydrate static method to instantiate a new ExerciseGroupModel
   * containing the provided AppliedExerciseModel. Finally, it immutably adds this
   * new group to the currently selected SessionModel within the plan.
   * @param exercise The applied exercise to add as a single exercise group
   * @returns This builder instance for method chaining
   */
  addExerciseToCurrentSession(exercise: AppliedExerciseModel): this {
    if (!this.currentSessionId) return this;
    const session = this.plan.findSessionById(this.currentSessionId);
    if (!session) return this;

    const now = new Date();
    const groupData: ExerciseGroupData = {
      id: generateId(),
      profileId: this.plan.profileId,
      type: 'single',
      appliedExerciseIds: [exercise.id],
      createdAt: now,
      updatedAt: now,
    };

    const exerciseGroup = ExerciseGroupModel.hydrate(groupData, [exercise]);
    const updatedSession = session.cloneWithAddedGroup(exerciseGroup);
    this.plan = this.plan.cloneWithReplacedSession(this.currentSessionId, updatedSession);
    return this;
  }

  /**
   * Adds a superset of two exercises to the currently selected session.
   * This method creates a 'superset' type ExerciseGroupData object. It then uses the
   * ExerciseGroupModel.hydrate static method to instantiate a new SupersetGroupModel,
   * which will throw an error if the provided exercises array does not contain
   * exactly two items. Finally, it immutably adds this new group to the currently
   * selected SessionModel.
   * @param exercises The array of applied exercises to add as a superset (must be exactly 2)
   * @returns This builder instance for method chaining
   */
  addSupersetToCurrentSession(exercises: AppliedExerciseModel[]): this {
    if (!this.currentSessionId) return this;
    const session = this.plan.findSessionById(this.currentSessionId);
    if (!session) return this;

    const now = new Date();
    const groupData: ExerciseGroupData = {
      id: generateId(),
      profileId: this.plan.profileId,
      type: 'superset',
      appliedExerciseIds: exercises.map((e) => e.id),
      createdAt: now,
      updatedAt: now,
    };

    const supersetGroup = ExerciseGroupModel.hydrate(groupData, exercises);
    const updatedSession = session.cloneWithAddedGroup(supersetGroup);
    this.plan = this.plan.cloneWithReplacedSession(this.currentSessionId, updatedSession);
    return this;
  }

  /**
   * Finalizes and returns the constructed TrainingPlanModel.
   * Performs final validation to ensure the plan is in a valid state.
   * @returns The constructed TrainingPlanModel
   * @throws {TrainingPlanMustHaveSessionsError} If the plan contains no sessions
   */
  build(): TrainingPlanModel {
    if (this.plan.sessions.length === 0) {
      throw new TrainingPlanMustHaveSessionsError();
    }
    return this.plan;
  }
}
