import { ExerciseModel } from './ExerciseModel';

/** Defines the contract for exercise data persistence. */
export interface IExerciseRepository {
  save(exercise: ExerciseModel): Promise<ExerciseModel>;
  saveBulk(exercises: ExerciseModel[]): Promise<void>;
  findById(profileId: string, id: string): Promise<ExerciseModel | undefined>;
  findByIds(profileId: string, ids: string[]): Promise<ExerciseModel[]>;
  findAll(profileId: string): Promise<ExerciseModel[]>;
  delete(profileId: string, id: string): Promise<void>;
}
