import { SupersetRequiresMultipleExercisesError } from '@/shared/errors';
import { ExerciseGroupData } from '@/shared/types';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { ExerciseGroupModel } from '../ExerciseGroupModel';

/**
 * A specialized exercise group model for superset training.
 * Extends the base ExerciseGroupModel with superset-specific functionality.
 */
export class SupersetGroupModel extends ExerciseGroupModel {
  /**
   * Creates a new SupersetGroupModel instance.
   * @param props The exercise group data to hydrate from
   * @param appliedExercises The applied exercises that belong to this group
   * @throws {SupersetRequiresMultipleExercisesError} If the number of exercises is not exactly 2
   */
  constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[]) {
    super(props, appliedExercises);
    if (this.appliedExercises.length !== 2) {
      throw new SupersetRequiresMultipleExercisesError();
    }
  }
}
