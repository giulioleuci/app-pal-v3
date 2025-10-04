import { AmrapEmomRequiresDurationError } from '@/shared/errors';
import { ExerciseGroupData } from '@/shared/types';

import { AppliedExerciseModel } from '../AppliedExerciseModel';
import { ExerciseGroupModel } from '../ExerciseGroupModel';

/**
 * A specialized exercise group model for As Many Rounds As Possible (AMRAP) training.
 * Extends the base ExerciseGroupModel with AMRAP-specific functionality.
 */
export class AMRAPGroupModel extends ExerciseGroupModel {
  /**
   * Creates a new AMRAPGroupModel instance.
   * @param props The exercise group data to hydrate from
   * @param appliedExercises The applied exercises that belong to this group
   * @throws {AmrapEmomRequiresDurationError} If the duration is not defined or is less than 1
   */
  constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[]) {
    super(props, appliedExercises);
    if (!this.durationMinutes || this.durationMinutes < 1) {
      throw new AmrapEmomRequiresDurationError('AMRAP');
    }
  }
}
