import { AppliedExercise } from '@/app/db/model/AppliedExercise';
import { Exercise } from '@/app/db/model/Exercise';
import { ExerciseGroup } from '@/app/db/model/ExerciseGroup';
import { ExerciseTemplate } from '@/app/db/model/ExerciseTemplate';
import { HeightRecord } from '@/app/db/model/HeightRecord';
import { MaxLog } from '@/app/db/model/MaxLog';
import { PerformedExerciseLog } from '@/app/db/model/PerformedExerciseLog';
import { PerformedGroup } from '@/app/db/model/PerformedGroup';
import { PerformedSet } from '@/app/db/model/PerformedSet';
import { Profile } from '@/app/db/model/Profile';
import { TrainingCycle } from '@/app/db/model/TrainingCycle';
import { TrainingPlan } from '@/app/db/model/TrainingPlan';
import { UserDetails } from '@/app/db/model/UserDetails';
import { UserSettings } from '@/app/db/model/UserSettings';
import { WeightRecord } from '@/app/db/model/WeightRecord';
import { WorkoutLog } from '@/app/db/model/WorkoutLog';
import { WorkoutSession } from '@/app/db/model/WorkoutSession';
import { HeightRecordModel } from '@/features/body-metrics/domain/HeightRecordModel';
import { WeightRecordModel } from '@/features/body-metrics/domain/WeightRecordModel';
import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseTemplateModel } from '@/features/exercise/domain/ExerciseTemplateModel';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { UserDetailsModel } from '@/features/profile/domain/UserDetailsModel';
import { UserSettingsModel } from '@/features/profile/domain/UserSettingsModel';
import { AppliedExerciseModel } from '@/features/training-plan/domain/AppliedExerciseModel';
import { ExerciseGroupModel } from '@/features/training-plan/domain/ExerciseGroupModel';
import { SessionModel } from '@/features/training-plan/domain/SessionModel';
import { TrainingCycleModel } from '@/features/training-plan/domain/TrainingCycleModel';
import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { PerformedExerciseLogModel } from '@/features/workout/domain/PerformedExerciseLogModel';
import { PerformedGroupLogModel } from '@/features/workout/domain/PerformedGroupLogModel';
import { PerformedSetModel } from '@/features/workout/domain/PerformedSetModel';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import {
  AppliedExerciseData,
  ExerciseData,
  ExerciseGroupData,
  ExerciseTemplateData,
  HeightRecordData,
  MaxLogData,
  PerformedExerciseLogData,
  PerformedGroupData,
  PerformedSetData,
  ProfileData,
  TrainingCycleData,
  TrainingPlanData,
  UserDetailsData,
  UserSettingsData,
  WeightRecordData,
  WorkoutLogData,
  WorkoutSessionData,
} from '@/shared/types';

/**
 * Utility functions for converting WatermelonDB models to Domain models.
 * These functions maintain the same transformation pattern used in repositories
 * while providing a convenient interface for reactive hooks.
 */

/**
 * Transforms a WatermelonDB Profile model to a ProfileModel domain object.
 * @param profile WatermelonDB Profile model
 * @returns ProfileModel domain object
 */
export function profileToDomain(profile: Profile): ProfileModel {
  const profileData: ProfileData = {
    id: profile.id,
    name: profile._raw.name,
    createdAt: new Date(profile._raw.created_at),
    updatedAt: new Date(profile._raw.updated_at),
  };

  return ProfileModel.hydrate(profileData);
}

/**
 * Transforms an array of WatermelonDB Profile models to ProfileModel domain objects.
 * @param profiles Array of WatermelonDB Profile models
 * @returns Array of ProfileModel domain objects
 */
export function profilesToDomain(profiles: Profile[]): ProfileModel[] {
  return profiles.map(profileToDomain);
}

/**
 * Transforms a WatermelonDB Exercise model to an ExerciseModel domain object.
 * @param exercise WatermelonDB Exercise model
 * @returns ExerciseModel domain object
 */
export function exerciseToDomain(exercise: Exercise): ExerciseModel {
  const exerciseData: ExerciseData = {
    id: exercise.id,
    profileId: exercise._raw.profile_id,
    name: exercise._raw.name,
    description: exercise._raw.description,
    category: exercise._raw.category,
    movementType: exercise._raw.movement_type,
    movementPattern: exercise._raw.movement_pattern,
    difficulty: exercise._raw.difficulty,
    equipment: JSON.parse(exercise._raw.equipment || '[]'),
    muscleActivation: JSON.parse(exercise._raw.muscle_activation || '{}'),
    counterType: exercise._raw.counter_type,
    jointType: exercise._raw.joint_type,
    notes: exercise._raw.notes || '',
    substitutions: JSON.parse(exercise._raw.substitutions || '[]'),
    createdAt: exercise._raw.created_at,
    updatedAt: exercise._raw.updated_at,
  };

  return ExerciseModel.hydrate(exerciseData);
}

/**
 * Transforms an array of WatermelonDB Exercise models to ExerciseModel domain objects.
 * @param exercises Array of WatermelonDB Exercise models
 * @returns Array of ExerciseModel domain objects
 */
export function exercisesToDomain(exercises: Exercise[]): ExerciseModel[] {
  return exercises.map(exerciseToDomain);
}

/**
 * Transforms a WatermelonDB TrainingPlan model to a TrainingPlanModel domain object.
 * @param trainingPlan WatermelonDB TrainingPlan model
 * @returns TrainingPlanModel domain object
 */
export function trainingPlanToDomain(trainingPlan: TrainingPlan): TrainingPlanModel {
  const trainingPlanData: TrainingPlanData = {
    id: trainingPlan.id,
    profileId: trainingPlan._raw.profile_id,
    name: trainingPlan._raw.name,
    description: trainingPlan._raw.description,
    sessionIds: trainingPlan._raw.session_ids || [],
    isArchived: trainingPlan._raw.is_archived,
    currentSessionIndex: trainingPlan._raw.current_session_index,
    notes: trainingPlan._raw.notes,
    cycleId: trainingPlan._raw.cycle_id,
    order: trainingPlan._raw.order,
    lastUsed: trainingPlan._raw.last_used,
    createdAt: trainingPlan._raw.created_at,
    updatedAt: trainingPlan._raw.updated_at,
  };

  return TrainingPlanModel.hydrate(trainingPlanData, []);
}

/**
 * Transforms an array of WatermelonDB TrainingPlan models to TrainingPlanModel domain objects.
 * @param trainingPlans Array of WatermelonDB TrainingPlan models
 * @returns Array of TrainingPlanModel domain objects
 */
export function trainingPlansToDomain(trainingPlans: TrainingPlan[]): TrainingPlanModel[] {
  return trainingPlans.map(trainingPlanToDomain);
}

/**
 * Transforms a WatermelonDB TrainingCycle model to a TrainingCycleModel domain object.
 * @param trainingCycle WatermelonDB TrainingCycle model
 * @returns TrainingCycleModel domain object
 */
export function trainingCycleToDomain(trainingCycle: TrainingCycle): TrainingCycleModel {
  const trainingCycleData: TrainingCycleData = {
    id: trainingCycle.id,
    profileId: trainingCycle._raw.profile_id,
    name: trainingCycle._raw.name,
    description: trainingCycle._raw.description,
    isArchived: trainingCycle._raw.is_archived,
    order: trainingCycle._raw.order,
    createdAt: trainingCycle._raw.created_at,
    updatedAt: trainingCycle._raw.updated_at,
  };

  return TrainingCycleModel.hydrate(trainingCycleData);
}

/**
 * Transforms an array of WatermelonDB TrainingCycle models to TrainingCycleModel domain objects.
 * @param trainingCycles Array of WatermelonDB TrainingCycle models
 * @returns Array of TrainingCycleModel domain objects
 */
export function trainingCyclesToDomain(trainingCycles: TrainingCycle[]): TrainingCycleModel[] {
  return trainingCycles.map(trainingCycleToDomain);
}

/**
 * Transforms a WatermelonDB WorkoutSession model to a SessionModel domain object.
 * @param session WatermelonDB WorkoutSession model
 * @returns SessionModel domain object
 */
export function workoutSessionToDomain(session: WorkoutSession): SessionModel {
  const sessionData: WorkoutSessionData = {
    id: session.id,
    profileId: session._raw.profile_id,
    name: session._raw.name,
    groupIds: JSON.parse(session._raw.group_ids || '[]'),
    notes: session._raw.notes || '',
    executionCount: session._raw.execution_count,
    isDeload: session._raw.is_deload,
    dayOfWeek: session._raw.day_of_week,
    createdAt: new Date(session._raw.created_at),
    updatedAt: new Date(session._raw.updated_at),
  };

  return SessionModel.hydrate(sessionData);
}

/**
 * Transforms an array of WatermelonDB WorkoutSession models to SessionModel domain objects.
 * @param sessions Array of WatermelonDB WorkoutSession models
 * @returns Array of SessionModel domain objects
 */
export function workoutSessionsToDomain(sessions: WorkoutSession[]): SessionModel[] {
  return sessions.map(workoutSessionToDomain);
}

/**
 * Transforms a WatermelonDB ExerciseGroup model to an ExerciseGroupModel domain object.
 * @param exerciseGroup WatermelonDB ExerciseGroup model
 * @returns ExerciseGroupModel domain object
 */
export function exerciseGroupToDomain(exerciseGroup: ExerciseGroup): ExerciseGroupModel {
  const exerciseGroupData: ExerciseGroupData = {
    id: exerciseGroup.id,
    profileId: exerciseGroup._raw.profile_id,
    type: exerciseGroup._raw.type as any,
    appliedExerciseIds: JSON.parse(exerciseGroup._raw.applied_exercise_ids || '[]'),
    restTimeSeconds: exerciseGroup._raw.rest_time_seconds,
    rounds: JSON.parse(exerciseGroup._raw.rounds || '{}'),
    durationMinutes: exerciseGroup._raw.duration_minutes,
    createdAt: new Date(exerciseGroup._raw.created_at),
    updatedAt: new Date(exerciseGroup._raw.updated_at),
  };

  return ExerciseGroupModel.hydrate(exerciseGroupData);
}

/**
 * Transforms an array of WatermelonDB ExerciseGroup models to ExerciseGroupModel domain objects.
 * @param exerciseGroups Array of WatermelonDB ExerciseGroup models
 * @returns Array of ExerciseGroupModel domain objects
 */
export function exerciseGroupsToDomain(exerciseGroups: ExerciseGroup[]): ExerciseGroupModel[] {
  return exerciseGroups.map(exerciseGroupToDomain);
}

/**
 * Transforms a WatermelonDB AppliedExercise model to an AppliedExerciseModel domain object.
 * @param appliedExercise WatermelonDB AppliedExercise model
 * @returns AppliedExerciseModel domain object
 */
export function appliedExerciseToDomain(appliedExercise: AppliedExercise): AppliedExerciseModel {
  const appliedExerciseData: AppliedExerciseData = {
    id: appliedExercise.id,
    profileId: appliedExercise._raw.profile_id,
    exerciseId: appliedExercise._raw.exercise_id,
    templateId: appliedExercise._raw.template_id,
    setConfiguration: JSON.parse(appliedExercise._raw.set_configuration || '{}'),
    restTimeSeconds: appliedExercise._raw.rest_time_seconds,
    executionCount: appliedExercise._raw.execution_count,
    createdAt: new Date(appliedExercise._raw.created_at),
    updatedAt: new Date(appliedExercise._raw.updated_at),
  };

  return AppliedExerciseModel.hydrate(appliedExerciseData);
}

/**
 * Transforms an array of WatermelonDB AppliedExercise models to AppliedExerciseModel domain objects.
 * @param appliedExercises Array of WatermelonDB AppliedExercise models
 * @returns Array of AppliedExerciseModel domain objects
 */
export function appliedExercisesToDomain(
  appliedExercises: AppliedExercise[]
): AppliedExerciseModel[] {
  return appliedExercises.map(appliedExerciseToDomain);
}

/**
 * Transforms a WatermelonDB ExerciseTemplate model to an ExerciseTemplateModel domain object.
 * @param exerciseTemplate WatermelonDB ExerciseTemplate model
 * @returns ExerciseTemplateModel domain object
 */
export function exerciseTemplateToDomain(
  exerciseTemplate: ExerciseTemplate
): ExerciseTemplateModel {
  const exerciseTemplateData: ExerciseTemplateData = {
    id: exerciseTemplate.id,
    name: exerciseTemplate._raw.name,
    exerciseId: exerciseTemplate._raw.exercise_id,
    setConfiguration: JSON.parse(exerciseTemplate._raw.set_configuration || '{}'),
    notes: exerciseTemplate._raw.notes || '',
    createdAt: new Date(exerciseTemplate._raw.created_at),
    updatedAt: new Date(exerciseTemplate._raw.updated_at),
  };

  return ExerciseTemplateModel.hydrate(exerciseTemplateData);
}

/**
 * Transforms an array of WatermelonDB ExerciseTemplate models to ExerciseTemplateModel domain objects.
 * @param exerciseTemplates Array of WatermelonDB ExerciseTemplate models
 * @returns Array of ExerciseTemplateModel domain objects
 */
export function exerciseTemplatesToDomain(
  exerciseTemplates: ExerciseTemplate[]
): ExerciseTemplateModel[] {
  return exerciseTemplates.map(exerciseTemplateToDomain);
}

/**
 * Transforms a WatermelonDB WorkoutLog model to a WorkoutLogModel domain object.
 * @param workoutLog WatermelonDB WorkoutLog model
 * @returns WorkoutLogModel domain object
 */
export function workoutLogToDomain(workoutLog: WorkoutLog): WorkoutLogModel {
  const workoutLogData: WorkoutLogData = {
    id: workoutLog.id,
    profileId: workoutLog._raw.profile_id,
    trainingPlanId: workoutLog._raw.training_plan_id,
    trainingPlanName: workoutLog._raw.training_plan_name,
    sessionId: workoutLog._raw.session_id,
    sessionName: workoutLog._raw.session_name,
    performedGroupIds: JSON.parse(workoutLog._raw.performed_group_ids || '[]'),
    startTime: new Date(workoutLog._raw.start_time),
    endTime: workoutLog._raw.end_time ? new Date(workoutLog._raw.end_time) : undefined,
    durationSeconds: workoutLog._raw.duration_seconds,
    totalVolume: workoutLog._raw.total_volume,
    notes: workoutLog._raw.notes || '',
    userRating: workoutLog._raw.user_rating,
    createdAt: new Date(workoutLog._raw.created_at),
    updatedAt: new Date(workoutLog._raw.updated_at),
  };

  return WorkoutLogModel.hydrate(workoutLogData);
}

/**
 * Transforms an array of WatermelonDB WorkoutLog models to WorkoutLogModel domain objects.
 * @param workoutLogs Array of WatermelonDB WorkoutLog models
 * @returns Array of WorkoutLogModel domain objects
 */
export function workoutLogsToDomain(workoutLogs: WorkoutLog[]): WorkoutLogModel[] {
  return workoutLogs.map(workoutLogToDomain);
}

/**
 * Transforms a WatermelonDB PerformedGroup model to a PerformedGroupLogModel domain object.
 * @param performedGroup WatermelonDB PerformedGroup model
 * @returns PerformedGroupLogModel domain object
 */
export function performedGroupToDomain(performedGroup: PerformedGroup): PerformedGroupLogModel {
  const performedGroupData: PerformedGroupData = {
    id: performedGroup.id,
    profileId: performedGroup._raw.profile_id,
    plannedGroupId: performedGroup._raw.planned_group_id,
    type: performedGroup._raw.type as any,
    performedExerciseLogIds: JSON.parse(performedGroup._raw.performed_exercise_log_ids || '[]'),
    actualRestSeconds: performedGroup._raw.actual_rest_seconds,
  };

  return PerformedGroupLogModel.hydrate(performedGroupData);
}

/**
 * Transforms an array of WatermelonDB PerformedGroup models to PerformedGroupLogModel domain objects.
 * @param performedGroups Array of WatermelonDB PerformedGroup models
 * @returns Array of PerformedGroupLogModel domain objects
 */
export function performedGroupsToDomain(
  performedGroups: PerformedGroup[]
): PerformedGroupLogModel[] {
  return performedGroups.map(performedGroupToDomain);
}

/**
 * Transforms a WatermelonDB PerformedExerciseLog model to a PerformedExerciseLogModel domain object.
 * @param performedExerciseLog WatermelonDB PerformedExerciseLog model
 * @returns PerformedExerciseLogModel domain object
 */
export function performedExerciseLogToDomain(
  performedExerciseLog: PerformedExerciseLog
): PerformedExerciseLogModel {
  const performedExerciseLogData: PerformedExerciseLogData = {
    id: performedExerciseLog.id,
    profileId: performedExerciseLog._raw.profile_id,
    exerciseId: performedExerciseLog._raw.exercise_id,
    plannedExerciseId: performedExerciseLog._raw.planned_exercise_id,
    setIds: JSON.parse(performedExerciseLog._raw.set_ids || '[]'),
    notes: performedExerciseLog._raw.notes || '',
    isSkipped: performedExerciseLog._raw.is_skipped,
    exerciseName: performedExerciseLog._raw.exercise_name,
    exerciseCategory: performedExerciseLog._raw.exercise_category as any,
    muscleActivation: JSON.parse(performedExerciseLog._raw.muscle_activation || '{}'),
    totalSets: performedExerciseLog._raw.total_sets,
    totalCounts: performedExerciseLog._raw.total_counts,
    totalVolume: performedExerciseLog._raw.total_volume,
    repCategoryDistribution: JSON.parse(
      performedExerciseLog._raw.rep_category_distribution || '{}'
    ),
    comparisonTrend: performedExerciseLog._raw.comparison_trend as any,
    comparisonSetsChange: performedExerciseLog._raw.comparison_sets_change,
    comparisonCountsChange: performedExerciseLog._raw.comparison_counts_change,
    comparisonVolumeChange: performedExerciseLog._raw.comparison_volume_change,
    rpeEffort: performedExerciseLog._raw.rpe_effort as any,
    estimated1RM: performedExerciseLog._raw.estimated_1rm,
  };

  return PerformedExerciseLogModel.hydrate(performedExerciseLogData);
}

/**
 * Transforms an array of WatermelonDB PerformedExerciseLog models to PerformedExerciseLogModel domain objects.
 * @param performedExerciseLogs Array of WatermelonDB PerformedExerciseLog models
 * @returns Array of PerformedExerciseLogModel domain objects
 */
export function performedExerciseLogsToDomain(
  performedExerciseLogs: PerformedExerciseLog[]
): PerformedExerciseLogModel[] {
  return performedExerciseLogs.map(performedExerciseLogToDomain);
}

/**
 * Transforms a WatermelonDB PerformedSet model to a PerformedSetModel domain object.
 * @param performedSet WatermelonDB PerformedSet model
 * @returns PerformedSetModel domain object
 */
export function performedSetToDomain(performedSet: PerformedSet): PerformedSetModel {
  const performedSetData: PerformedSetData = {
    id: performedSet.id,
    profileId: performedSet._raw.profile_id,
    counterType: performedSet._raw.counter_type as any,
    counts: performedSet._raw.counts,
    weight: performedSet._raw.weight,
    completed: performedSet._raw.completed,
    notes: performedSet._raw.notes || '',
    rpe: performedSet._raw.rpe,
    percentage: performedSet._raw.percentage,
    plannedLoad: JSON.parse(performedSet._raw.planned_load || 'null'),
    plannedRpe: JSON.parse(performedSet._raw.planned_rpe || 'null'),
    plannedCounts: JSON.parse(performedSet._raw.planned_counts || 'null'),
  };

  return PerformedSetModel.hydrate(performedSetData);
}

/**
 * Transforms an array of WatermelonDB PerformedSet models to PerformedSetModel domain objects.
 * @param performedSets Array of WatermelonDB PerformedSet models
 * @returns Array of PerformedSetModel domain objects
 */
export function performedSetsToDomain(performedSets: PerformedSet[]): PerformedSetModel[] {
  return performedSets.map(performedSetToDomain);
}

/**
 * Transforms a WatermelonDB MaxLog model to a MaxLogModel domain object.
 * @param maxLog WatermelonDB MaxLog model
 * @returns MaxLogModel domain object
 */
export function maxLogToDomain(maxLog: MaxLog): MaxLogModel {
  const maxLogData: MaxLogData = {
    id: maxLog.id,
    profileId: maxLog._raw.profile_id,
    exerciseId: maxLog._raw.exercise_id,
    weightEnteredByUser: maxLog._raw.weight_entered_by_user,
    date: new Date(maxLog._raw.date),
    reps: maxLog._raw.reps,
    notes: maxLog._raw.notes || '',
    estimated1RM: maxLog._raw.estimated_1rm,
    maxBrzycki: maxLog._raw.max_brzycki,
    maxBaechle: maxLog._raw.max_baechle,
    createdAt: new Date(maxLog._raw.created_at),
    updatedAt: new Date(maxLog._raw.updated_at),
  };

  return MaxLogModel.hydrate(maxLogData);
}

/**
 * Transforms an array of WatermelonDB MaxLog models to MaxLogModel domain objects.
 * @param maxLogs Array of WatermelonDB MaxLog models
 * @returns Array of MaxLogModel domain objects
 */
export function maxLogsToDomain(maxLogs: MaxLog[]): MaxLogModel[] {
  return maxLogs.map(maxLogToDomain);
}

/**
 * Transforms a WatermelonDB WeightRecord model to a WeightRecordModel domain object.
 * @param weightRecord WatermelonDB WeightRecord model
 * @returns WeightRecordModel domain object
 */
export function weightRecordToDomain(weightRecord: WeightRecord): WeightRecordModel {
  const weightRecordData: WeightRecordData = {
    id: weightRecord.id,
    profileId: weightRecord._raw.profile_id,
    date: new Date(weightRecord._raw.date),
    weight: weightRecord._raw.weight,
    notes: weightRecord._raw.notes || '',
    createdAt: new Date(weightRecord._raw.created_at),
    updatedAt: new Date(weightRecord._raw.updated_at),
  };

  return WeightRecordModel.hydrate(weightRecordData);
}

/**
 * Transforms an array of WatermelonDB WeightRecord models to WeightRecordModel domain objects.
 * @param weightRecords Array of WatermelonDB WeightRecord models
 * @returns Array of WeightRecordModel domain objects
 */
export function weightRecordsToDomain(weightRecords: WeightRecord[]): WeightRecordModel[] {
  return weightRecords.map(weightRecordToDomain);
}

/**
 * Transforms a WatermelonDB HeightRecord model to a HeightRecordModel domain object.
 * @param heightRecord WatermelonDB HeightRecord model
 * @returns HeightRecordModel domain object
 */
export function heightRecordToDomain(heightRecord: HeightRecord): HeightRecordModel {
  const heightRecordData: HeightRecordData = {
    id: heightRecord.id,
    profileId: heightRecord._raw.profile_id,
    date: new Date(heightRecord._raw.date),
    height: heightRecord._raw.height,
    notes: heightRecord._raw.notes || '',
    createdAt: new Date(heightRecord._raw.created_at),
    updatedAt: new Date(heightRecord._raw.updated_at),
  };

  return HeightRecordModel.hydrate(heightRecordData);
}

/**
 * Transforms an array of WatermelonDB HeightRecord models to HeightRecordModel domain objects.
 * @param heightRecords Array of WatermelonDB HeightRecord models
 * @returns Array of HeightRecordModel domain objects
 */
export function heightRecordsToDomain(heightRecords: HeightRecord[]): HeightRecordModel[] {
  return heightRecords.map(heightRecordToDomain);
}

/**
 * Transforms a WatermelonDB UserSettings model to a UserSettingsModel domain object.
 * @param userSettings WatermelonDB UserSettings model
 * @returns UserSettingsModel domain object
 */
export function userSettingsToDomain(userSettings: UserSettings): UserSettingsModel {
  const userSettingsData: UserSettingsData = {
    id: userSettings.id,
    profileId: userSettings._raw.profile_id,
    themeMode: userSettings._raw.theme_mode as any,
    primaryColor: userSettings._raw.primary_color,
    secondaryColor: userSettings._raw.secondary_color,
    unitSystem: userSettings._raw.unit_system as any,
    bmiFormula: userSettings._raw.bmi_formula as any,
    activeTrainingPlanId: userSettings._raw.active_training_plan_id,
    autoStartRestTimer: userSettings._raw.auto_start_rest_timer,
    autoStartShortRestTimer: userSettings._raw.auto_start_short_rest_timer,
    liftMappings: JSON.parse(userSettings._raw.lift_mappings || '{}'),
    dashboardLayout: JSON.parse(userSettings._raw.dashboard_layout || '[]'),
    dashboardVisibility: JSON.parse(userSettings._raw.dashboard_visibility || '{}'),
    createdAt: new Date(userSettings._raw.created_at),
    updatedAt: new Date(userSettings._raw.updated_at),
  };

  return UserSettingsModel.hydrate(userSettingsData);
}

/**
 * Transforms a WatermelonDB UserDetails model to a UserDetailsModel domain object.
 * @param userDetails WatermelonDB UserDetails model
 * @returns UserDetailsModel domain object
 */
export function userDetailsToDomain(userDetails: UserDetails): UserDetailsModel {
  const userDetailsData: UserDetailsData = {
    id: userDetails.id,
    profileId: userDetails._raw.profile_id,
    fullName: userDetails._raw.full_name,
    biologicalSex: userDetails._raw.biological_sex as any,
    dateOfBirth: userDetails._raw.date_of_birth
      ? new Date(userDetails._raw.date_of_birth)
      : undefined,
    createdAt: new Date(userDetails._raw.created_at),
    updatedAt: new Date(userDetails._raw.updated_at),
  };

  return UserDetailsModel.hydrate(userDetailsData);
}
