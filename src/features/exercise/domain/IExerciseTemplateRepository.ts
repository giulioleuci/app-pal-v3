import { ExerciseTemplateModel } from './ExerciseTemplateModel';

/** Defines the contract for exercise template data persistence. */
export interface IExerciseTemplateRepository {
  save(template: ExerciseTemplateModel): Promise<ExerciseTemplateModel>;
  findById(id: string): Promise<ExerciseTemplateModel | undefined>;
  findAll(profileId: string): Promise<ExerciseTemplateModel[]>;
  delete(id: string): Promise<void>;
}
