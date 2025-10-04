import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, json, relation } from '@nozbe/watermelondb/decorators';

import type { Exercise } from './Exercise';
import type { ExerciseGroup } from './ExerciseGroup';
import type { ExerciseTemplate } from './ExerciseTemplate';
import type { PerformedExerciseLog } from './PerformedExerciseLog';
import type { Profile } from './Profile';

/**
 * WatermelonDB model for AppliedExercise entity.
 * Represents an exercise applied within a specific exercise group with configuration.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class AppliedExercise extends Model {
  static table = 'applied_exercises';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    exercise_groups: { type: 'belongs_to', key: 'exercise_group_id' },
    exercises: { type: 'belongs_to', key: 'exercise_id' },
    exercise_templates: { type: 'belongs_to', key: 'template_id' },
    performed_exercise_logs: { type: 'has_many', foreignKey: 'planned_exercise_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('exercise_group_id') exerciseGroupId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('template_id') templateId!: string;
  @json('set_configuration', (json) => json) setConfiguration!: Record<string, any>;
  @field('rest_time_seconds') restTimeSeconds!: number;
  @field('execution_count') executionCount!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;
  @relation('exercise_groups', 'exercise_group_id') exerciseGroup!: Relation<ExerciseGroup>;
  @relation('exercises', 'exercise_id') exercise!: Relation<Exercise>;
  @relation('exercise_templates', 'template_id') template!: Relation<ExerciseTemplate>;

  // One-to-many relationships
  @children('performed_exercise_logs') performedExerciseLogs!: Query<PerformedExerciseLog>;
}
