import type { Query, Relation } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, json, relation } from '@nozbe/watermelondb/decorators';

import type { AppliedExercise } from './AppliedExercise';
import type { ExerciseTemplate } from './ExerciseTemplate';
import type { MaxLog } from './MaxLog';
import type { PerformedExerciseLog } from './PerformedExerciseLog';
import type { Profile } from './Profile';

/**
 * WatermelonDB model for Exercise entity.
 * Represents individual exercises in the fitness application.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class Exercise extends Model {
  static table = 'exercises';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    exercise_templates: { type: 'has_many', foreignKey: 'exercise_id' },
    applied_exercises: { type: 'has_many', foreignKey: 'exercise_id' },
    max_logs: { type: 'has_many', foreignKey: 'exercise_id' },
    performed_exercise_logs: { type: 'has_many', foreignKey: 'exercise_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('category') category!: string;
  @field('movement_type') movementType!: string;
  @field('movement_pattern') movementPattern!: string;
  @field('difficulty') difficulty!: string;
  @json('equipment', (json) => json) equipment!: string[];
  @json('muscle_activation', (json) => json) muscleActivation!: Record<string, number>;
  @field('counter_type') counterType!: string;
  @field('joint_type') jointType!: string;
  @field('notes') notes!: string;
  @json('substitutions', (json) => json) substitutions!: Array<{
    exerciseId: string;
    priority: number;
    reason?: string;
  }>;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile!: Relation<Profile>;

  // One-to-many relationships
  @children('exercise_templates') exerciseTemplates!: Query<ExerciseTemplate>;
  @children('applied_exercises') appliedExercises!: Query<AppliedExercise>;
  @children('max_logs') maxLogs!: Query<MaxLog>;
  @children('performed_exercise_logs') performedExerciseLogs!: Query<PerformedExerciseLog>;
}
