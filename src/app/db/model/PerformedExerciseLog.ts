import { Model } from '@nozbe/watermelondb';
import { children, field, json, relation } from '@nozbe/watermelondb/decorators';

/**
 * WatermelonDB model for PerformedExerciseLog entity.
 * Represents an exercise actually performed during a workout with its performance data.
 * This model handles only data persistence - business logic remains in the Domain layer.
 */
export class PerformedExerciseLog extends Model {
  static table = 'performed_exercise_logs';
  static associations = {
    profiles: { type: 'belongs_to', key: 'profile_id' },
    performed_groups: { type: 'belongs_to', key: 'performed_group_id' },
    exercises: { type: 'belongs_to', key: 'exercise_id' },
    applied_exercises: { type: 'belongs_to', key: 'planned_exercise_id' },
    performed_sets: { type: 'has_many', foreignKey: 'performed_exercise_log_id' },
  } as const;

  @field('profile_id') profileId!: string;
  @field('performed_group_id') performedGroupId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('planned_exercise_id') plannedExerciseId!: string;
  @field('notes') notes!: string;
  @field('is_skipped') isSkipped!: boolean;
  @field('exercise_name') exerciseName!: string;
  @field('exercise_category') exerciseCategory!: string;
  @json('muscle_activation', (json) => json) muscleActivation!: Record<string, number>;
  @field('total_sets') totalSets!: number;
  @field('total_counts') totalCounts!: number;
  @field('total_volume') totalVolume!: number;
  @json('rep_category_distribution', (json) => json) repCategoryDistribution!: Record<
    string,
    number
  >;
  @field('comparison_trend') comparisonTrend!: string;
  @field('comparison_sets_change') comparisonSetsChange!: number;
  @field('comparison_counts_change') comparisonCountsChange!: number;
  @field('comparison_volume_change') comparisonVolumeChange!: number;
  @field('comparison_volume') comparisonVolume!: number;
  @field('comparison_avg_weight') comparisonAvgWeight!: number;
  @field('comparison_max_weight') comparisonMaxWeight!: number;
  @field('comparison_total_reps') comparisonTotalReps!: number;
  @field('rpe_effort') rpeEffort!: string;
  @field('estimated_1rm') estimated1RM!: number;

  // Many-to-one relationships
  @relation('profiles', 'profile_id') profile;
  @relation('performed_groups', 'performed_group_id') performedGroup;
  @relation('exercises', 'exercise_id') exercise;
  @relation('applied_exercises', 'planned_exercise_id') plannedExercise;

  // One-to-many relationships
  @children('performed_sets') performedSets;
}
