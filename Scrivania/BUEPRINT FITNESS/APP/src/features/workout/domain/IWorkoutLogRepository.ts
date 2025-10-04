import { WorkoutLogModel } from './WorkoutLogModel';

/** Defines the contract for workout log aggregate persistence. */
export interface IWorkoutLogRepository {
  save(log: WorkoutLogModel): Promise<WorkoutLogModel>;
  findById(id: string): Promise<WorkoutLogModel | undefined>;
  findAll(
    profileId: string,
    filters?: { dateRange?: { from: Date; to: Date } }
  ): Promise<WorkoutLogModel[]>;
  findLastBySessionId(profileId: string, sessionId: string): Promise<WorkoutLogModel | undefined>;
  delete(id: string): Promise<void>;
}
