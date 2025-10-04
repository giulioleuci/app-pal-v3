import { HeightRecordModel } from './HeightRecordModel';
import { WeightRecordModel } from './WeightRecordModel';

/** Defines the contract for body metrics data persistence. */
export interface IBodyMetricsRepository {
  saveWeight(record: WeightRecordModel): Promise<WeightRecordModel>;
  saveHeight(record: HeightRecordModel): Promise<HeightRecordModel>;
  findWeightHistory(profileId: string): Promise<WeightRecordModel[]>;
  findHeightHistory(profileId: string): Promise<HeightRecordModel[]>;
  findLatestWeight(profileId: string): Promise<WeightRecordModel | undefined>;
  findWeightById(recordId: string): Promise<WeightRecordModel | undefined>;
  findHeightById(recordId: string): Promise<HeightRecordModel | undefined>;
  deleteWeight(id: string): Promise<void>;
  deleteHeight(id: string): Promise<void>;
}
