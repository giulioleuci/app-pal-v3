import { TrainingCycleModel } from './TrainingCycleModel';

/** Defines the contract for training cycle data persistence. */
export interface ITrainingCycleRepository {
  save(cycle: TrainingCycleModel): Promise<TrainingCycleModel>;
  findById(id: string): Promise<TrainingCycleModel | undefined>;
  findAll(profileId: string): Promise<TrainingCycleModel[]>;
  delete(id: string): Promise<void>;
}
