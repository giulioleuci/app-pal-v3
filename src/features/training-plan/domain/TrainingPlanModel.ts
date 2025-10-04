import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import { TrainingPlanData, trainingPlanSchema } from '@/shared/types';

import { SessionModel } from './SessionModel';

/**
 * A domain model representing a training plan aggregate root.
 * Contains sessions, metadata, and orchestrates the training cycle progression.
 */
export class TrainingPlanModel extends BaseModel<TrainingPlanData> {
  [immerable] = true;

  public readonly profileId: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly sessions: SessionModel[];
  public readonly isArchived: boolean;
  public readonly currentSessionIndex: number;
  public readonly notes?: string;
  public readonly cycleId: string | null;
  public readonly order?: number;
  public readonly lastUsed?: Date;

  protected constructor(props: TrainingPlanData, sessions: SessionModel[]) {
    super(props);
    this.profileId = props.profileId;
    this.name = props.name;
    this.description = props.description;
    this.sessions = sessions;
    this.isArchived = props.isArchived;
    this.currentSessionIndex = props.currentSessionIndex;
    this.notes = props.notes;
    this.cycleId = props.cycleId;
    this.order = props.order;
    this.lastUsed = props.lastUsed;
  }

  /**
   * Creates a new TrainingPlanModel instance from plain data.
   * @param props The training plan data to hydrate from
   * @param sessions The session models that belong to this training plan
   * @returns A new TrainingPlanModel instance
   */
  public static hydrate(props: TrainingPlanData, sessions: SessionModel[]): TrainingPlanModel {
    return new TrainingPlanModel(props, sessions);
  }

  private createUpdatedInstance(
    updates: Partial<TrainingPlanData>,
    newSessions?: SessionModel[]
  ): TrainingPlanModel {
    const currentData = this.toPlainObject();
    // Ensure the new updatedAt is always greater than the current one
    const newUpdatedAt = new Date(Math.max(new Date().getTime(), this.updatedAt.getTime() + 1));
    const newData = { ...currentData, ...updates, updatedAt: newUpdatedAt };
    return new TrainingPlanModel(newData, newSessions || this.sessions);
  }

  /**
   * Creates a new training plan instance with updated details.
   * @param details The details to update (name, description, notes)
   * @returns A new TrainingPlanModel instance with updated details
   */
  cloneWithUpdatedDetails(details: {
    name?: string;
    description?: string;
    notes?: string;
  }): TrainingPlanModel {
    return this.createUpdatedInstance(details);
  }

  /**
   * Creates a new training plan instance with an added session.
   * @param session The session to add
   * @returns A new TrainingPlanModel instance with the added session
   */
  cloneWithAddedSession(session: SessionModel): TrainingPlanModel {
    const newSessions = [...this.sessions, session];
    return this.createUpdatedInstance({}, newSessions);
  }

  /**
   * Creates a new training plan instance with a removed session.
   * @param sessionId The ID of the session to remove
   * @returns A new TrainingPlanModel instance with the session removed
   */
  cloneWithRemovedSession(sessionId: string): TrainingPlanModel {
    const newSessions = this.sessions.filter((s) => s.id !== sessionId);
    return this.createUpdatedInstance({}, newSessions);
  }

  /**
   * Creates a new training plan instance with a reordered session.
   * @param sessionId The ID of the session to reorder
   * @param newIndex The new index position for the session
   * @returns A new TrainingPlanModel instance with reordered sessions
   */
  cloneWithReorderedSession(sessionId: string, newIndex: number): TrainingPlanModel {
    const newSessions = [...this.sessions];
    const oldIndex = newSessions.findIndex((s) => s.id === sessionId);
    if (oldIndex === -1 || newIndex < 0 || newIndex >= newSessions.length) return this;
    const [item] = newSessions.splice(oldIndex, 1);
    newSessions.splice(newIndex, 0, item);
    return this.createUpdatedInstance({}, newSessions);
  }

  /**
   * Creates a new training plan instance with a replaced session.
   * @param sessionId The ID of the session to replace
   * @param newSession The new session to replace with
   * @returns A new TrainingPlanModel instance with the replaced session
   */
  cloneWithReplacedSession(sessionId: string, newSession: SessionModel): TrainingPlanModel {
    const newSessions = this.sessions.map((s) => (s.id === sessionId ? newSession : s));
    return this.createUpdatedInstance({}, newSessions);
  }

  /**
   * Creates a new training plan instance marked as archived.
   * @returns A new TrainingPlanModel instance with isArchived set to true
   */
  cloneAsArchived(): TrainingPlanModel {
    return this.createUpdatedInstance({ isArchived: true });
  }

  /**
   * Creates a new training plan instance marked as unarchived.
   * @returns A new TrainingPlanModel instance with isArchived set to false
   */
  cloneAsUnarchived(): TrainingPlanModel {
    return this.createUpdatedInstance({ isArchived: false });
  }

  /**
   * Creates a new training plan instance with assigned training cycle.
   * @param cycleId The ID of the training cycle to assign
   * @returns A new TrainingPlanModel instance with the assigned cycle
   */
  cloneWithAssignedCycle(cycleId: string): TrainingPlanModel {
    return this.createUpdatedInstance({ cycleId, order: this.order || 1 });
  }

  /**
   * Creates a new training plan instance with removed training cycle.
   * @returns A new TrainingPlanModel instance with no assigned cycle
   */
  cloneWithRemovedCycle(): TrainingPlanModel {
    return this.createUpdatedInstance({ cycleId: null });
  }

  /**
   * Creates a new training plan instance with updated order within a cycle.
   * @param newOrder The new order position within the cycle
   * @returns A new TrainingPlanModel instance with updated order
   */
  cloneWithUpdatedOrderInCycle(newOrder: number): TrainingPlanModel {
    return this.createUpdatedInstance({ order: newOrder });
  }

  /**
   * Creates a new training plan instance with progressed session index.
   * Cycles to the next session, wrapping around to the first if at the end.
   * @returns A new TrainingPlanModel instance with progressed session index
   */
  cloneWithProgressedSession(): TrainingPlanModel {
    const newIndex =
      this.sessions.length > 0 ? (this.currentSessionIndex + 1) % this.sessions.length : 0;
    return this.createUpdatedInstance({ currentSessionIndex: newIndex });
  }

  /**
   * Creates a new training plan instance marked as used at a specific date.
   * @param date The date when the plan was used
   * @returns A new TrainingPlanModel instance with updated lastUsed date
   */
  cloneAsUsed(date: Date): TrainingPlanModel {
    return this.createUpdatedInstance({ lastUsed: date });
  }

  /**
   * Finds a session by its ID within this training plan.
   * @param sessionId The ID of the session to find
   * @returns The session model or undefined if not found
   */
  findSessionById(sessionId: string): SessionModel | undefined {
    return this.sessions.find((s) => s.id === sessionId);
  }

  /**
   * Gets the current active session based on the current session index.
   * @returns The current session model or undefined if no sessions exist
   */
  getCurrentSession(): SessionModel | undefined {
    return this.sessions[this.currentSessionIndex];
  }

  /**
   * Gets the total number of sessions in this training plan.
   * @returns The total session count
   */
  getTotalSessions(): number {
    return this.sessions.length;
  }

  /**
   * Gets the count of deload sessions in this training plan.
   * @returns The number of deload sessions
   */
  getDeloadSessionCount(): number {
    return this.sessions.filter((s) => s.isDeload).length;
  }

  /**
   * Estimates the total duration range for completing all sessions.
   * @returns An object with min and max duration estimates in minutes
   */
  estimateTotalDurationMinutes(): { min: number; max: number } {
    const totalSeconds = this.sessions.reduce((acc, s) => acc + s.getEstimatedDurationSeconds(), 0);
    const totalMinutes = totalSeconds / 60;
    return {
      min: Math.round(totalMinutes * 0.8),
      max: Math.round(totalMinutes * 1.2),
    };
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this TrainingPlanModel
   */
  clone(): this {
    return produce(this, (draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (draft as any).sessions = this.sessions.map((s) => s.clone());
    }) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain TrainingPlanData object
   */
  toPlainObject(): TrainingPlanData {
    return {
      id: this.id,
      profileId: this.profileId,
      name: this.name,
      description: this.description,
      sessionIds: this.sessions.map((s) => s.id),
      isArchived: this.isArchived,
      currentSessionIndex: this.currentSessionIndex,
      notes: this.notes,
      cycleId: this.cycleId,
      order: this.order,
      lastUsed: this.lastUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return trainingPlanSchema.safeParse(this.toPlainObject());
  }
}
