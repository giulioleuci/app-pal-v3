import { CircuitRequiresMultipleExercisesError } from '@/shared/errors';
import { ExerciseGroupData } from '@/shared/types';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { ExerciseGroupModel } from '../ExerciseGroupModel';

/**
 * A specialized exercise group model for circuit training.
 * Extends the base ExerciseGroupModel with circuit-specific functionality.
 */
export class CircuitGroupModel extends ExerciseGroupModel {
  /**
   * Creates a new CircuitGroupModel instance.
   * @param props The exercise group data to hydrate from
   * @param appliedExercises The applied exercises that belong to this group
   * @throws {CircuitRequiresMultipleExercisesError} If the number of exercises is less than 2
   */
  constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[]) {
    super(props, appliedExercises);
    if (this.appliedExercises.length < 2) {
      throw new CircuitRequiresMultipleExercisesError();
    }
  }
}
