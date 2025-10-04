import { MaxLogModel } from './MaxLogModel';

/** Defines the contract for max log data persistence. */
export interface IMaxLogRepository {
  save(log: MaxLogModel): Promise<MaxLogModel>;
  findById(id: string): Promise<MaxLogModel | undefined>;
  findAll(profileId: string): Promise<MaxLogModel[]>;
  findLatestByExercise(profileId: string): Promise<Map<string, MaxLogModel>>;
  delete(id: string): Promise<void>;
}
