import type { Query } from '@nozbe/watermelondb';
import { Model } from '@nozbe/watermelondb';
import { children, date, field } from '@nozbe/watermelondb/decorators';

/**
 * WatermelonDB model for Profile entity.
 * Represents a user profile in the Blueprint Fitness application.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class Profile extends Model {
  static table = 'profiles';

  @field('name') name!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // One-to-many relationships
  @children('user_settings') userSettings!: Query<Model>;
  @children('user_details') userDetails!: Query<Model>;
  @children('custom_themes') customThemes!: Query<Model>;
  @children('exercises') exercises!: Query<Model>;
  @children('training_cycles') trainingCycles!: Query<Model>;
  @children('training_plans') trainingPlans!: Query<Model>;
  @children('workout_sessions') workoutSessions!: Query<Model>;
  @children('exercise_groups') exerciseGroups!: Query<Model>;
  @children('applied_exercises') appliedExercises!: Query<Model>;
  @children('workout_logs') workoutLogs!: Query<Model>;
  @children('performed_groups') performedGroups!: Query<Model>;
  @children('performed_exercise_logs') performedExerciseLogs!: Query<Model>;
  @children('performed_sets') performedSets!: Query<Model>;
  @children('weight_records') weightRecords!: Query<Model>;
  @children('height_records') heightRecords!: Query<Model>;
  @children('max_logs') maxLogs!: Query<Model>;
  @children('workout_states') workoutStates!: Query<Model>;
}
