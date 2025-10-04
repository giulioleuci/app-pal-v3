import { TrainingPlanModel } from './TrainingPlanModel';

/** Defines the contract for training plan aggregate persistence. */
export interface ITrainingPlanRepository {
  save(plan: TrainingPlanModel): Promise<TrainingPlanModel>;
  findById(id: string): Promise<TrainingPlanModel | undefined>;
  findAll(
    profileId: string,
    filters?: { isArchived?: boolean; cycleId?: string }
  ): Promise<TrainingPlanModel[]>;
  delete(id: string): Promise<void>;
}
