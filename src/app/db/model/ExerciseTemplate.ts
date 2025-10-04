import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, json, relation } from '@nozbe/watermelondb/decorators';

import type { AppliedExercise } from './AppliedExercise';
import type { Exercise } from './Exercise';

/**
 * WatermelonDB model for ExerciseTemplate entity.
 * Represents predefined exercise configurations with set parameters.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class ExerciseTemplate extends Model {
  static table = 'exercise_templates';
  static associations = {
    exercises: { type: 'belongs_to', key: 'exercise_id' },
    applied_exercises: { type: 'has_many', foreignKey: 'template_id' },
  } as const;

  @field('name') name!: string;
  @field('exercise_id') exerciseId!: string;
  @json('set_configuration', (json) => json) setConfiguration!: Record<string, any>;
  @field('notes') notes!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('exercises', 'exercise_id') exercise!: Relation<Exercise>;

  // One-to-many relationships
  @children('applied_exercises') appliedExercises!: Query<AppliedExercise>;
}
