import { z } from 'zod';

import {
  validateExportFileIntegrity,
  validatePyramidalSet,
  validateTrainingPlan,
  validateUniqueIds,
  validateWorkoutLog,
} from '@/shared/validation';

/**
 * A reusable schema for a UUID string.
 */
export const idSchema = z
  .string({ message: 'errors.validation.common.uuid.required' })
  .uuid({ message: 'errors.validation.common.uuid.invalid' });

/**
 * A reusable schema for a min-max numeric range with a display direction.
 * Ensures that if max is defined, it is greater than or equal to min.
 */
export const minMaxDirectionalSchema = z
  .object({
    min: z.number({ message: 'errors.validation.common.minMax.min.required' }),
    max: z.number().optional().or(z.literal(Infinity)),
    direction: z.enum(['asc', 'desc']).default('asc'),
  })
  .refine((data) => data.max === undefined || data.max === Infinity || data.max >= data.min, {
    message: 'errors.validation.common.minMax.max.gteMin',
  });

// --- Constants & Enums ---

export const allMuscleGroupKeys = [
  'chest',
  'lats',
  'upper_back',
  'lower_back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'calves',
  'abdominals',
  'glutes',
] as const;
export const muscleGroupEnum = z.enum(allMuscleGroupKeys);
export type MuscleGroup = z.infer<typeof muscleGroupEnum>;
export const themeModeEnum = z.enum(['light', 'dark']);
export type ThemeMode = z.infer<typeof themeModeEnum>;
export const unitSystemEnum = z.enum(['metric']);
export type UnitSystem = z.infer<typeof unitSystemEnum>;
export const exerciseCategoryEnum = z.enum([
  'strength',
  'cardio',
  'stretching',
  'hypertrophy',
  'mobility',
  'other',
]);
export type ExerciseCategory = z.infer<typeof exerciseCategoryEnum>;
export const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);
export type Difficulty = z.infer<typeof difficultyEnum>;
export const equipmentEnum = z.enum([
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
  'kettlebell',
  'cable',
  'smithMachine',
  'bench',
  'rack',
  'fitball',
  'step',
  'other',
]);
export type Equipment = z.infer<typeof equipmentEnum>;
export const exerciseGroupTypeEnum = z.enum([
  'single',
  'superset',
  'circuit',
  'emom',
  'amrap',
  'warmup',
  'stretching',
]);
export type ExerciseGroupType = z.infer<typeof exerciseGroupTypeEnum>;
export const setConfigurationTypeEnum = z.enum([
  'standard',
  'drop',
  'myoReps',
  'pyramidal',
  'restPause',
  'mav',
]);

export const setExecutionTypeEnum = z.enum([
  'standard',
  'drop',
  'myoReps',
  'pyramidal',
  'restPause',
  'mav',
]);
export type SetExecutionType = z.infer<typeof setExecutionTypeEnum>;
export const exerciseCounterEnum = z.enum(['reps', 'mins', 'secs']);
export type ExerciseCounter = z.infer<typeof exerciseCounterEnum>;
export const exerciseMovementTypeEnum = z.enum(['pull', 'push', 'static', 'dynamic', 'other']);
export type ExerciseMovementType = z.infer<typeof exerciseMovementTypeEnum>;
export const exerciseMovementPatternEnum = z.enum([
  'verticalPush',
  'verticalPull',
  'horizontalPush',
  'horizontalPull',
  'hipHinge',
  'squat',
  'coreRotation',
]);
export type ExerciseMovementPattern = z.infer<typeof exerciseMovementPatternEnum>;
export const exerciseJointTypeEnum = z.enum(['isolation', 'compound']);
export type ExerciseJointType = z.infer<typeof exerciseJointTypeEnum>;
export const pyramidalModeEnum = z.enum(['ascending', 'descending', 'bothAscendingDescending']);
export const repRangeCategoryEnum = z.enum(['strength', 'hypertrophy', 'endurance']);
export type RepRangeCategory = z.infer<typeof repRangeCategoryEnum>;
export const dashboardWidgetEnum = z.enum([
  'nextWorkout',
  'lastWorkout',
  'motivationalQuote',
  'bodyweightChart',
  'liftRatios',
  'todaysEquipment',
  'muscleGroupVolume',
  'muscleRecovery',
  'adherenceCalendar',
]);
export type DashboardWidget = z.infer<typeof dashboardWidgetEnum>;
export const comparisonTrendEnum = z.enum([
  'improvement',
  'deterioration',
  'maintenance',
  'stagnation',
]);
export const rpeEffortEnum = z.enum(['optimal', 'poor', 'excessive']);
export const trainingCycleGoalEnum = z.enum([
  'hypertrophy',
  'strength',
  'cutting',
  'maintenance',
  'other',
]);
export type TrainingCycleGoal = z.infer<typeof trainingCycleGoalEnum>;
export const dayOfWeekEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
export type DayOfWeek = z.infer<typeof dayOfWeekEnum>;
export const acceptedLiftMappings = [
  'backSquat',
  'bench',
  'deadlift',
  'overheadPress',
  'barbellRow',
  'legExtension',
  'legCurl',
  'latPulldown',
  'cableRow',
  'frontSquat',
] as const;
export const liftMappingEnum = z.enum(acceptedLiftMappings);

// --- Set Configuration Schemas (Discriminated Union with Inheritance) ---

const baseSetParamsSchema = z.object({
  sets: minMaxDirectionalSchema,
  load: minMaxDirectionalSchema.optional(),
  percentage: minMaxDirectionalSchema.optional(),
  rpe: minMaxDirectionalSchema.optional(),
});
export type BaseSetParamsData = z.infer<typeof baseSetParamsSchema>;

export const standardSetParamsSchema = baseSetParamsSchema.extend({
  type: z.literal('standard'),
  counts: minMaxDirectionalSchema,
});
export type StandardSetParamsData = z.infer<typeof standardSetParamsSchema>;

export const dropSetParamsSchema = baseSetParamsSchema.extend({
  type: z.literal('drop'),
  startCounts: minMaxDirectionalSchema,
  drops: minMaxDirectionalSchema,
});
export type DropSetParamsData = z.infer<typeof dropSetParamsSchema>;

export const myoRepsParamsSchema = baseSetParamsSchema.extend({
  type: z.literal('myoReps'),
  activationCounts: minMaxDirectionalSchema,
  miniSets: minMaxDirectionalSchema,
  miniSetCounts: minMaxDirectionalSchema,
});
export type MyoRepsParamsData = z.infer<typeof myoRepsParamsSchema>;

export const pyramidalSetParamsSchema = baseSetParamsSchema
  .extend({
    type: z.literal('pyramidal'),
    startCounts: minMaxDirectionalSchema,
    endCounts: minMaxDirectionalSchema,
    step: minMaxDirectionalSchema,
    mode: pyramidalModeEnum,
  })
  .superRefine(validatePyramidalSet);
export type PyramidalSetParamsData = z.infer<typeof pyramidalSetParamsSchema>;

export const restPauseSetParamsSchema = baseSetParamsSchema.extend({
  type: z.literal('restPause'),
  counts: minMaxDirectionalSchema,
  pauses: minMaxDirectionalSchema,
});
export type RestPauseSetParamsData = z.infer<typeof restPauseSetParamsSchema>;

export const mavSetParamsSchema = baseSetParamsSchema.extend({
  type: z.literal('mav'),
  counts: minMaxDirectionalSchema,
});
export type MavSetParamsData = z.infer<typeof mavSetParamsSchema>;

export const setConfigurationSchema = z.discriminatedUnion('type', [
  standardSetParamsSchema,
  dropSetParamsSchema,
  myoRepsParamsSchema,
  pyramidalSetParamsSchema,
  restPauseSetParamsSchema,
  mavSetParamsSchema,
]);
export type AnySetConfigurationData = z.infer<typeof setConfigurationSchema>;

// --- Sub-Set Tracking Schemas ---

export const subSetDataSchema = z.object({
  weight: z.number().nonnegative().optional(),
  counts: z.number().nonnegative(),
  restSeconds: z.number().int().nonnegative().optional(),
  dropNumber: z.number().int().positive().optional(), // For drop sets
});
export type SubSetData = z.infer<typeof subSetDataSchema>;

// --- Core Data Schemas ---

export const profileSchema = z.object({
  id: idSchema,
  name: z
    .string({ message: 'errors.validation.profile.name.required' })
    .min(1, { message: 'errors.validation.profile.name.required' }),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProfileData = z.infer<typeof profileSchema>;

export const userSettingsSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  themeMode: themeModeEnum,
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'errors.validation.userSettings.primaryColor.invalid' }),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, {
    message: 'errors.validation.userSettings.secondaryColor.invalid',
  }),
  unitSystem: unitSystemEnum,
  bmiFormula: z.enum(['classic', 'new']).default('classic'),
  activeTrainingPlanId: idSchema.nullable().default(null),
  autoStartRestTimer: z.boolean().default(true),
  autoStartShortRestTimer: z.boolean().default(true),
  liftMappings: z
    .record(z.string(), idSchema)
    .optional()
    .default(() => ({})),
  dashboardLayout: z
    .array(dashboardWidgetEnum)
    .default(['nextWorkout', 'lastWorkout', 'motivationalQuote', 'todaysEquipment']),
  dashboardVisibility: z
    .record(dashboardWidgetEnum, z.boolean())
    .optional()
    .default(() => ({
      nextWorkout: true,
      lastWorkout: true,
      motivationalQuote: true,
      bodyweightChart: true,
      liftRatios: true,
      todaysEquipment: true,
      muscleGroupVolume: true,
      muscleRecovery: true,
      adherenceCalendar: true,
    })),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserSettingsData = z.infer<typeof userSettingsSchema>;

export const userDetailsSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    fullName: z.string().optional(),
    biologicalSex: z.enum(['male', 'female']).optional(),
    dateOfBirth: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.dateOfBirth && data.dateOfBirth > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.userDetails.dateOfBirth.future',
        path: ['dateOfBirth'],
      });
    }
  });
export type UserDetailsData = z.infer<typeof userDetailsSchema>;

export const weightRecordSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  date: z.date({ message: 'errors.validation.weightRecord.date.required' }),
  weight: z
    .number({ message: 'errors.validation.weightRecord.weight.required' })
    .positive({ message: 'errors.validation.weightRecord.weight.positive' }),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type WeightRecordData = z.infer<typeof weightRecordSchema>;

export const heightRecordSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  date: z.date({ message: 'errors.validation.heightRecord.date.required' }),
  height: z
    .number({ message: 'errors.validation.heightRecord.height.required' })
    .positive({ message: 'errors.validation.heightRecord.height.positive' }),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type HeightRecordData = z.infer<typeof heightRecordSchema>;

export const exerciseSubstitutionSchema = z.object({
  exerciseId: idSchema,
  priority: z
    .number()
    .int()
    .min(1, { message: 'errors.validation.exerciseSubstitution.priority.min' })
    .max(5, { message: 'errors.validation.exerciseSubstitution.priority.max' }),
  reason: z.string().optional(),
});
export type ExerciseSubstitutionData = z.infer<typeof exerciseSubstitutionSchema>;

export const exerciseSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    name: z.string().min(1, { message: 'errors.validation.exercise.name.required' }),
    description: z.string(),
    category: exerciseCategoryEnum,
    movementType: exerciseMovementTypeEnum,
    movementPattern: exerciseMovementPatternEnum.optional(),
    difficulty: difficultyEnum,
    equipment: z.array(equipmentEnum),
    muscleActivation: z.record(muscleGroupEnum, z.number().min(0).max(1)),
    counterType: exerciseCounterEnum,
    jointType: exerciseJointTypeEnum,
    notes: z.string().optional(),
    substitutions: z.array(exerciseSubstitutionSchema).default([]),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.substitutions.some((sub) => sub.exerciseId === data.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.exercise.substitutions.self',
        path: ['substitutions'],
      });
    }
    validateUniqueIds(
      data.substitutions.map((s) => s.exerciseId),
      'substitutions',
      ctx
    );
    if (data.equipment.length === 1 && data.equipment[0] === 'other') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.exercise.equipment.otherOnly',
        path: ['equipment'],
      });
    }
  });
export type ExerciseData = z.infer<typeof exerciseSchema>;

export const exerciseTemplateSchema = z.object({
  id: idSchema,
  name: z.string().min(1, { message: 'errors.validation.exerciseTemplate.name.required' }),
  exerciseId: idSchema,
  setConfiguration: setConfigurationSchema,
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ExerciseTemplateData = z.infer<typeof exerciseTemplateSchema>;

export const trainingCycleSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    name: z.string().min(1, { message: 'errors.validation.trainingCycle.name.required' }),
    startDate: z.date(),
    endDate: z.date(),
    goal: trainingCycleGoalEnum,
    notes: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.trainingCycle.endDate.beforeStart',
        path: ['endDate'],
      });
    }
  });
export type TrainingCycleData = z.infer<typeof trainingCycleSchema>;

export const trainingPlanSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    name: z.string().min(1, { message: 'errors.validation.trainingPlan.name.required' }),
    description: z.string().optional(),
    sessionIds: z.array(idSchema),
    isArchived: z.boolean().default(false),
    currentSessionIndex: z.number().int().default(0),
    notes: z.string().optional(),
    cycleId: idSchema.nullable().default(null),
    order: z.number().int().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastUsed: z.date().optional(),
  })
  .superRefine(validateTrainingPlan);
export type TrainingPlanData = z.infer<typeof trainingPlanSchema>;

export const workoutSessionSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    name: z.string().min(1, { message: 'errors.validation.workoutSession.name.required' }),
    groupIds: z.array(idSchema),
    notes: z.string().optional(),
    executionCount: z.number().int().nonnegative().default(0),
    isDeload: z.boolean().default(false),
    dayOfWeek: dayOfWeekEnum.nullable().default(null),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => validateUniqueIds(data.groupIds, 'groupIds', ctx));
export type WorkoutSessionData = z.infer<typeof workoutSessionSchema>;

// --- Exercise Group Schemas (with inheritance) ---

const baseExerciseGroupSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  appliedExerciseIds: z.array(idSchema),
  restTimeSeconds: z.number().int().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BaseExerciseGroupData = z.infer<typeof baseExerciseGroupSchema>;

export const singleExerciseGroupSchema = baseExerciseGroupSchema
  .extend({
    type: z.literal('single'),
  })
  .refine((data) => data.appliedExerciseIds.length <= 1, {
    message: 'errors.validation.singleExerciseGroup.maxLength',
  });
export type SingleExerciseGroupData = z.infer<typeof singleExerciseGroupSchema>;

export const supersetExerciseGroupSchema = baseExerciseGroupSchema
  .extend({
    type: z.literal('superset'),
    rounds: minMaxDirectionalSchema,
  })
  .refine((data) => data.appliedExerciseIds.length === 2, {
    message: 'errors.validation.supersetExerciseGroup.exactLength',
  });
export type SupersetExerciseGroupData = z.infer<typeof supersetExerciseGroupSchema>;

export const circuitExerciseGroupSchema = baseExerciseGroupSchema.extend({
  type: z.literal('circuit'),
  rounds: minMaxDirectionalSchema,
});
export type CircuitExerciseGroupData = z.infer<typeof circuitExerciseGroupSchema>;

export const emomExerciseGroupSchema = baseExerciseGroupSchema.extend({
  type: z.literal('emom'),
  rounds: minMaxDirectionalSchema,
  durationMinutes: z.number().int().positive().default(1),
});
export type EmomExerciseGroupData = z.infer<typeof emomExerciseGroupSchema>;

export const amrapExerciseGroupSchema = baseExerciseGroupSchema.extend({
  type: z.literal('amrap'),
  rounds: minMaxDirectionalSchema,
  durationMinutes: z.number().int().positive(),
});
export type AmrapExerciseGroupData = z.infer<typeof amrapExerciseGroupSchema>;

export const warmupExerciseGroupSchema = baseExerciseGroupSchema.extend({
  type: z.literal('warmup'),
  rounds: minMaxDirectionalSchema,
});
export type WarmupExerciseGroupData = z.infer<typeof warmupExerciseGroupSchema>;

export const stretchingExerciseGroupSchema = baseExerciseGroupSchema.extend({
  type: z.literal('stretching'),
  rounds: minMaxDirectionalSchema,
});
export type StretchingExerciseGroupData = z.infer<typeof stretchingExerciseGroupSchema>;

export const exerciseGroupSchema = z.discriminatedUnion('type', [
  singleExerciseGroupSchema,
  supersetExerciseGroupSchema,
  circuitExerciseGroupSchema,
  emomExerciseGroupSchema,
  amrapExerciseGroupSchema,
  warmupExerciseGroupSchema,
  stretchingExerciseGroupSchema,
]);
export type ExerciseGroupData = z.infer<typeof exerciseGroupSchema>;

export const appliedExerciseSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  exerciseId: idSchema,
  templateId: idSchema.nullable(),
  setConfiguration: setConfigurationSchema,
  restTimeSeconds: z.number().int().optional(),
  executionCount: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AppliedExerciseData = z.infer<typeof appliedExerciseSchema>;

export const workoutLogSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    trainingPlanId: idSchema.optional(),
    trainingPlanName: z
      .string()
      .min(1, { message: 'errors.validation.workoutLog.trainingPlanName.required' }),
    sessionId: idSchema.optional(),
    sessionName: z
      .string()
      .min(1, { message: 'errors.validation.workoutLog.sessionName.required' }),
    performedGroupIds: z.array(idSchema),
    startTime: z.date(),
    endTime: z.date().optional(),
    durationSeconds: z.number().int().optional(),
    totalVolume: z.number().optional(),
    notes: z.string().optional(),
    userRating: z.number().min(0).max(5).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine(validateWorkoutLog);
export type WorkoutLogData = z.infer<typeof workoutLogSchema>;

export const performedGroupSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  plannedGroupId: idSchema.optional(),
  type: exerciseGroupTypeEnum,
  performedExerciseLogIds: z.array(idSchema),
  actualRestSeconds: z.number().int().optional(),
});
export type PerformedGroupData = z.infer<typeof performedGroupSchema>;

export const performedExerciseLogSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    exerciseId: idSchema,
    plannedExerciseId: idSchema.optional(),
    setIds: z.array(idSchema),
    notes: z.string().optional(),
    isSkipped: z.boolean().default(false),
    exerciseName: z.string(),
    exerciseCategory: exerciseCategoryEnum,
    muscleActivation: z.record(muscleGroupEnum, z.number().min(0).max(1)),
    totalSets: z.number().int().optional(),
    totalCounts: z.number().int().optional(),
    totalVolume: z.number().optional(),
    repCategoryDistribution: z.record(repRangeCategoryEnum, z.number()).optional(),
    comparisonTrend: comparisonTrendEnum.optional(),
    comparisonSetsChange: z.number().optional(),
    comparisonCountsChange: z.number().optional(),
    comparisonVolumeChange: z.number().optional(),
    comparisonVolume: z.number().optional(),
    comparisonAvgWeight: z.number().optional(),
    comparisonMaxWeight: z.number().optional(),
    comparisonTotalReps: z.number().optional(),
    rpeEffort: rpeEffortEnum.optional(),
    estimated1RM: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.isSkipped &&
      (data.totalVolume !== 0 || data.totalCounts !== 0 || data.totalSets !== 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.performedExerciseLog.skipped.nonZero',
        path: ['isSkipped'],
      });
    }
  });
export type PerformedExerciseLogData = z.infer<typeof performedExerciseLogSchema>;

export const performedSetSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    counterType: exerciseCounterEnum,
    counts: z.number().nonnegative(),
    weight: z.number().nonnegative().optional(),
    completed: z.boolean(),
    notes: z.string().optional(),
    rpe: z.number().min(1).max(10).optional(),
    percentage: z.number().min(0).max(100).optional(),
    plannedLoad: minMaxDirectionalSchema.optional(),
    plannedRpe: minMaxDirectionalSchema.optional(),
    plannedCounts: minMaxDirectionalSchema.optional(),
    // Sub-set tracking fields (v3 additions)
    subSets: z.array(subSetDataSchema).optional().default([]),
    executionType: setExecutionTypeEnum.optional().default('standard'),
    isSubSetCompleted: z.array(z.boolean()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.percentage !== undefined && data.weight !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'errors.validation.performedSet.weightAndPercentage',
        path: ['percentage'],
      });
    }

    // Validate sub-set tracking consistency
    if (data.subSets && data.subSets.length > 0) {
      if (data.isSubSetCompleted && data.isSubSetCompleted.length !== data.subSets.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'errors.validation.performedSet.subSetCompletionMismatch',
          path: ['isSubSetCompleted'],
        });
      }

      // Validate drop set structure
      if (data.executionType === 'drop') {
        const hasDropNumbers = data.subSets.every(
          (subset, index) => subset.dropNumber === undefined || subset.dropNumber === index + 1
        );
        if (!hasDropNumbers) {
          ctx.addIssue({
            code: 'custom',
            message: 'errors.validation.performedSet.dropSet.invalidDropNumbers',
            path: ['subSets'],
          });
        }
      }
    }

    // Ensure backward compatibility: if no subSets but advanced execution type
    if (data.executionType !== 'standard' && (!data.subSets || data.subSets.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'errors.validation.performedSet.advancedTypeRequiresSubSets',
        path: ['subSets'],
      });
    }
  });
export type PerformedSetData = z.infer<typeof performedSetSchema>;

export const maxLogSchema = z
  .object({
    id: idSchema,
    profileId: idSchema,
    exerciseId: idSchema,
    weightEnteredByUser: z
      .number()
      .positive({ message: 'errors.validation.maxLog.weight.positive' }),
    date: z.date(),
    reps: z.number().positive({ message: 'errors.validation.maxLog.reps.positive' }),
    notes: z.string().optional(),
    estimated1RM: z.number().positive(),
    maxBrzycki: z.number().positive().optional(),
    maxBaechle: z.number().positive().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.date > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.validation.maxLog.date.future',
        path: ['date'],
      });
    }
  });
export type MaxLogData = z.infer<typeof maxLogSchema>;

export const customThemeSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  name: z.string().min(1, { message: 'errors.validation.customTheme.name.required' }),
  mode: themeModeEnum,
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'errors.validation.customTheme.primaryColor.invalid' }),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, {
    message: 'errors.validation.customTheme.secondaryColor.invalid',
  }),
});
export type CustomThemeData = z.infer<typeof customThemeSchema>;

export const workoutStateSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  state: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type WorkoutStateData = z.infer<typeof workoutStateSchema>;

// --- Backup & Data Export Schemas ---

export const exportFileSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportDate: z.date(),
    payloadType: z.enum([
      'FULL_BACKUP',
      'SINGLE_PLAN',
      'EXERCISE_LIBRARY',
      'WORKOUT_HISTORY',
      'MAX_LOG_HISTORY',
    ]),
    payload: z.object({
      trainingCycles: z.array(trainingCycleSchema).optional(),
      trainingPlans: z.array(trainingPlanSchema).optional(),
      sessions: z.array(workoutSessionSchema).optional(),
      groups: z.array(exerciseGroupSchema).optional(),
      appliedExercises: z.array(appliedExerciseSchema).optional(),
      exercises: z.array(exerciseSchema).optional(),
      exerciseTemplates: z.array(exerciseTemplateSchema).optional(),
      logs: z.array(workoutLogSchema).optional(),
      performedGroups: z.array(performedGroupSchema).optional(),
      performedExercises: z.array(performedExerciseLogSchema).optional(),
      performedSets: z.array(performedSetSchema).optional(),
      userSettings: userSettingsSchema.optional(),
      userDetails: userDetailsSchema.optional(),
      weightRecords: z.array(weightRecordSchema).optional(),
      heightRecords: z.array(heightRecordSchema).optional(),
      maxLogs: z.array(maxLogSchema).optional(),
      customThemes: z.array(customThemeSchema).optional(),
    }),
  })
  .superRefine(validateExportFileIntegrity);
export type ExportFileData = z.infer<typeof exportFileSchema>;

// --- Analysis & Data Sync Types ---

export const analysisFiltersSchema = z.object({
  dateRange: z.object({ from: z.date(), to: z.date() }).optional(),
  trainingPlanId: z.string().optional(),
  sessionId: z.string().optional(),
});
export type AnalysisFiltersData = z.infer<typeof analysisFiltersSchema>;

export const generalStatsSchema = z.object({
  totalWorkouts: z.number(),
  totalVolume: z.number(),
  totalSets: z.number(),
  averageDurationSeconds: z.number(),
});
export type GeneralStatsData = z.infer<typeof generalStatsSchema>;

export const progressionDataPointSchema = z.object({
  date: z.date(),
  value: z.number(),
});
export type ProgressionDataPointData = z.infer<typeof progressionDataPointSchema>;

export const exerciseProgressionSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  volume: z.array(progressionDataPointSchema),
  maxWeight: z.array(progressionDataPointSchema),
});
export type ExerciseProgressionData = z.infer<typeof exerciseProgressionSchema>;

export const analysisReportSchema = z.object({
  generalStats: generalStatsSchema,
  muscleDistribution: z.record(muscleGroupEnum, z.number()),
  progression: z.array(exerciseProgressionSchema),
  bodyweightToLiftRatios: z.record(z.string(), z.number()),
  volumeByMuscleGroup: z.array(
    z.object({ date: z.date(), values: z.record(muscleGroupEnum, z.number()) })
  ),
  adherence: z.object({ completed: z.number(), planned: z.number(), percentage: z.number() }),
  repCategoryDistribution: z.record(repRangeCategoryEnum, z.number()),
});
export type AnalysisReportData = z.infer<typeof analysisReportSchema>;

export const importResultSchema = z.object({
  created: z.number(),
  updated: z.number(),
  ignored: z.number(),
  deleted: z.number(),
});
export type ImportResultData = z.infer<typeof importResultSchema>;
