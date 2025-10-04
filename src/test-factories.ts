import { faker } from '@faker-js/faker';
import { vi } from 'vitest';

import { HeightRecordModel, WeightRecordModel } from '@/features/body-metrics/domain';
import { ExerciseModel, ExerciseTemplateModel } from '@/features/exercise/domain';
import { MaxLogModel } from '@/features/max-log/domain';
import {
  CustomThemeModel,
  ProfileModel,
  UserDetailsModel,
  UserSettingsModel,
} from '@/features/profile/domain';
import {
  AppliedExerciseModel,
  ExerciseGroupModel,
  SessionModel,
  TrainingCycleModel,
  TrainingPlanModel,
} from '@/features/training-plan/domain';
import {
  PerformedExerciseLogModel,
  PerformedGroupLogModel,
  PerformedSetModel,
  WorkoutLogModel,
} from '@/features/workout/domain';
import { generateId } from '@/lib';
import {
  AnySetConfigurationData,
  AppliedExerciseData,
  CustomThemeData,
  DayOfWeek,
  ExerciseData,
  ExerciseGroupData,
  ExerciseTemplateData,
  HeightRecordData,
  MaxLogData,
  PerformedExerciseLogData,
  PerformedGroupData,
  PerformedSetData,
  ProfileData,
  StandardSetParamsData,
  TrainingCycleData,
  TrainingCycleGoal,
  TrainingPlanData,
  UserDetailsData,
  UserSettingsData,
  WeightRecordData,
  WorkoutLogData,
  WorkoutSessionData,
} from '@/shared/types';

/**
 * A collection of factory functions for creating test data and domain models.
 * These centralize test object creation, making tests more readable and maintainable.
 */

// --- Data Factories ---

/**
 * Creates a plain data object for a Profile with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestProfileData(overrides: Partial<ProfileData> = {}): ProfileData {
  const now = new Date();
  return {
    id: generateId(),
    name: faker.person.firstName(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for an Exercise with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestExerciseData(overrides: Partial<ExerciseData> = {}): ExerciseData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    name: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    category: 'strength',
    movementType: 'push',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    muscleActivation: {
      chest: 1.0,
      lats: 0.0,
      upper_back: 0.0,
      lower_back: 0.0,
      shoulders: 0.3,
      biceps: 0.0,
      triceps: 0.7,
      forearms: 0.0,
      quadriceps: 0.0,
      hamstrings: 0.0,
      calves: 0.0,
      abdominals: 0.2,
      glutes: 0.0,
    },
    counterType: 'reps',
    jointType: 'compound',
    substitutions: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for UserSettings with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestUserSettingsData(
  overrides: Partial<UserSettingsData> = {}
): UserSettingsData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    themeMode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    unitSystem: 'metric',
    bmiFormula: 'classic',
    activeTrainingPlanId: null,
    autoStartRestTimer: true,
    autoStartShortRestTimer: true,
    liftMappings: {
      backSquat: generateId(),
      bench: generateId(),
      deadlift: generateId(),
      overheadPress: generateId(),
      barbellRow: generateId(),
      legExtension: generateId(),
      legCurl: generateId(),
      latPulldown: generateId(),
      cableRow: generateId(),
      frontSquat: generateId(),
    },
    dashboardLayout: ['nextWorkout', 'lastWorkout', 'motivationalQuote', 'todaysEquipment'],
    dashboardVisibility: {
      nextWorkout: true,
      lastWorkout: true,
      motivationalQuote: true,
      bodyweightChart: true,
      liftRatios: true,
      todaysEquipment: true,
      muscleGroupVolume: true,
      muscleRecovery: true,
      adherenceCalendar: true,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for UserDetails with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestUserDetailsData(
  overrides: Partial<UserDetailsData> = {}
): UserDetailsData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    fullName: faker.person.fullName(),
    biologicalSex: faker.helpers.arrayElement(['male', 'female']),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for CustomTheme with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestCustomThemeData(
  overrides: Partial<CustomThemeData> = {}
): CustomThemeData {
  return {
    id: generateId(),
    profileId: generateId(),
    name: faker.lorem.words(2),
    mode: faker.helpers.arrayElement(['light', 'dark']),
    primaryColor: faker.color.rgb({ format: 'hex' }),
    secondaryColor: faker.color.rgb({ format: 'hex' }),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a plain data object for StandardSetParams with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestStandardSetParamsData(
  overrides: Partial<StandardSetParamsData> = {}
): StandardSetParamsData {
  return {
    type: 'standard',
    sets: { min: 3, max: 3, direction: 'asc' },
    counts: { min: 8, max: 12, direction: 'asc' },
    load: { min: 100, max: 120, direction: 'asc' },
    percentage: { min: 70, max: 80, direction: 'asc' },
    rpe: { min: 7, max: 8, direction: 'asc' },
    ...overrides,
  };
}

/**
 * Creates a plain data object for ExerciseTemplate with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestExerciseTemplateData(
  overrides: Partial<ExerciseTemplateData> = {}
): ExerciseTemplateData {
  const now = new Date();
  const setConfiguration: AnySetConfigurationData =
    overrides.setConfiguration || createTestStandardSetParamsData();

  return {
    id: generateId(),
    name: faker.lorem.words(3),
    exerciseId: generateId(),
    setConfiguration,
    notes: faker.lorem.sentence(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// --- Model Factories ---

/**
 * Creates a ProfileModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestProfileModel(overrides: Partial<ProfileData> = {}): ProfileModel {
  return ProfileModel.hydrate(createTestProfileData(overrides));
}

/**
 * Creates a UserSettingsModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestUserSettingsModel(
  overrides: Partial<UserSettingsData> = {}
): UserSettingsModel {
  return UserSettingsModel.hydrate(createTestUserSettingsData(overrides));
}

/**
 * Creates a UserDetailsModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestUserDetailsModel(
  overrides: Partial<UserDetailsData> = {}
): UserDetailsModel {
  return UserDetailsModel.hydrate(createTestUserDetailsData(overrides));
}

/**
 * Creates a CustomThemeModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestCustomThemeModel(
  overrides: Partial<CustomThemeData> = {}
): CustomThemeModel {
  return CustomThemeModel.hydrate(createTestCustomThemeData(overrides));
}

/**
 * Creates an ExerciseModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestExerciseModel(overrides: Partial<ExerciseData> = {}): ExerciseModel {
  return ExerciseModel.hydrate(createTestExerciseData(overrides));
}

/**
 * Creates an ExerciseTemplateModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestExerciseTemplateModel(
  overrides: Partial<ExerciseTemplateData> = {}
): ExerciseTemplateModel {
  return ExerciseTemplateModel.hydrate(createTestExerciseTemplateData(overrides));
}

/**
 * Creates a plain data object for AppliedExercise with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestAppliedExerciseData(
  overrides: Partial<AppliedExerciseData> = {}
): AppliedExerciseData {
  const now = new Date();
  const setConfiguration: AnySetConfigurationData =
    overrides.setConfiguration || createTestStandardSetParamsData();

  return {
    id: generateId(),
    profileId: generateId(),
    exerciseId: generateId(),
    templateId: faker.helpers.arrayElement([null, generateId()]),
    setConfiguration,
    restTimeSeconds: faker.helpers.maybe(() => faker.number.int({ min: 30, max: 180 })),
    executionCount: faker.number.int({ min: 0, max: 10 }),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for ExerciseGroup with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestExerciseGroupData(
  overrides: Partial<ExerciseGroupData> = {}
): ExerciseGroupData {
  const now = new Date();
  const type =
    overrides.type ||
    faker.helpers.arrayElement(['single', 'superset', 'circuit', 'warmup', 'stretching'] as const);

  const baseData = {
    id: generateId(),
    profileId: generateId(),
    type,
    appliedExerciseIds: [generateId(), generateId()],
    restTimeSeconds: faker.helpers.maybe(() => faker.number.int({ min: 60, max: 300 })),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  // Add type-specific properties for EMOM/AMRAP
  if (type === 'emom' || type === 'amrap') {
    return {
      ...baseData,
      durationMinutes: faker.number.int({ min: 5, max: 20 }),
      ...overrides,
    } as ExerciseGroupData;
  }

  // Add rounds for circuit types
  if (type === 'circuit') {
    return {
      ...baseData,
      rounds: {
        min: faker.number.int({ min: 2, max: 4 }),
        max: faker.number.int({ min: 4, max: 6 }),
        direction: faker.helpers.arrayElement(['asc', 'desc'] as const),
      },
      ...overrides,
    } as ExerciseGroupData;
  }

  return baseData as ExerciseGroupData;
}

/**
 * Creates a plain data object for WorkoutSession with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestWorkoutSessionData(
  overrides: Partial<WorkoutSessionData> = {}
): WorkoutSessionData {
  const now = new Date();
  const dayOptions: (DayOfWeek | null)[] = [
    null,
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return {
    id: generateId(),
    profileId: generateId(),
    name: faker.lorem.words(3),
    groupIds: [generateId(), generateId()],
    notes: faker.helpers.maybe(() => faker.lorem.paragraph()),
    executionCount: faker.number.int({ min: 0, max: 15 }),
    isDeload: faker.datatype.boolean(),
    dayOfWeek: faker.helpers.arrayElement(dayOptions),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates an AppliedExerciseModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestAppliedExerciseModel(
  overrides: Partial<AppliedExerciseData> = {}
): AppliedExerciseModel {
  return AppliedExerciseModel.hydrate(createTestAppliedExerciseData(overrides));
}

/**
 * Creates an ExerciseGroupModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param appliedExercises Optional applied exercises array, will create test ones if not provided
 */
export function createTestExerciseGroupModel(
  overrides: Partial<ExerciseGroupData> = {},
  appliedExercises?: AppliedExerciseModel[]
): ExerciseGroupModel {
  const data = createTestExerciseGroupData(overrides);
  const exercises = appliedExercises || [
    createTestAppliedExerciseModel(),
    createTestAppliedExerciseModel(),
  ];
  return ExerciseGroupModel.hydrate(data, exercises);
}

/**
 * Creates a SessionModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param groups Optional groups array, will create test ones if not provided
 */
export function createTestSessionModel(
  overrides: Partial<WorkoutSessionData> = {},
  groups?: ExerciseGroupModel[]
): SessionModel {
  const data = createTestWorkoutSessionData(overrides);
  const sessionGroups = groups || [createTestExerciseGroupModel(), createTestExerciseGroupModel()];
  return SessionModel.hydrate(data, sessionGroups);
}

/**
 * Creates a plain data object for TrainingPlan with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestTrainingPlanData(
  overrides: Partial<TrainingPlanData> = {}
): TrainingPlanData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    sessionIds: [generateId(), generateId()],
    isArchived: faker.datatype.boolean(),
    currentSessionIndex: faker.number.int({ min: 0, max: 3 }),
    notes: faker.helpers.maybe(() => faker.lorem.paragraph()),
    cycleId: faker.helpers.arrayElement([null, generateId()]),
    order: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 10 })),
    lastUsed: faker.helpers.maybe(() => faker.date.recent()),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for TrainingCycle with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestTrainingCycleData(
  overrides: Partial<TrainingCycleData> = {}
): TrainingCycleData {
  const now = new Date();
  const startDate = faker.date.future();
  const endDate = faker.date.future({ refDate: startDate });
  const goals: TrainingCycleGoal[] = ['hypertrophy', 'strength', 'cutting', 'maintenance', 'other'];

  return {
    id: generateId(),
    profileId: generateId(),
    name: faker.lorem.words(2),
    startDate,
    endDate,
    goal: faker.helpers.arrayElement(goals),
    notes: faker.helpers.maybe(() => faker.lorem.paragraph()),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a TrainingPlanModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param sessions Optional sessions array, will create test ones if not provided
 */
export function createTestTrainingPlanModel(
  overrides: Partial<TrainingPlanData> = {},
  sessions?: SessionModel[]
): TrainingPlanModel {
  const data = createTestTrainingPlanData(overrides);
  const trainingSessions = sessions || [
    createTestSessionModel({ id: data.sessionIds[0] }),
    createTestSessionModel({ id: data.sessionIds[1] }),
  ];
  return TrainingPlanModel.hydrate(data, trainingSessions);
}

/**
 * Creates a TrainingCycleModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestTrainingCycleModel(
  overrides: Partial<TrainingCycleData> = {}
): TrainingCycleModel {
  return TrainingCycleModel.hydrate(createTestTrainingCycleData(overrides));
}

// --- Workout Domain Test Factories ---

/**
 * Creates a plain data object for PerformedSet with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestPerformedSetData(
  overrides: Partial<PerformedSetData> = {}
): PerformedSetData {
  // Ensure weight and percentage are mutually exclusive
  const useWeight = faker.datatype.boolean();
  const weight = useWeight
    ? faker.number.float({ min: 5, max: 200, fractionDigits: 1 })
    : undefined;
  const percentage = !useWeight
    ? faker.helpers.maybe(() => faker.number.int({ min: 50, max: 100 }))
    : undefined;

  return {
    id: generateId(),
    profileId: generateId(),
    counterType: 'reps',
    counts: faker.number.int({ min: 1, max: 20 }),
    weight,
    completed: faker.datatype.boolean(),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    rpe: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 10 })),
    percentage,
    plannedLoad: faker.helpers.maybe(() => ({
      min: faker.number.int({ min: 50, max: 100 }),
      max: faker.number.int({ min: 100, max: 150 }),
      direction: faker.helpers.arrayElement(['asc', 'desc'] as const),
    })),
    plannedRpe: faker.helpers.maybe(() => ({
      min: faker.number.int({ min: 6, max: 8 }),
      max: faker.number.int({ min: 8, max: 10 }),
      direction: faker.helpers.arrayElement(['asc', 'desc'] as const),
    })),
    plannedCounts: faker.helpers.maybe(() => ({
      min: faker.number.int({ min: 6, max: 10 }),
      max: faker.number.int({ min: 10, max: 15 }),
      direction: faker.helpers.arrayElement(['asc', 'desc'] as const),
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a plain data object for PerformedExerciseLog with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestPerformedExerciseLogData(
  overrides: Partial<PerformedExerciseLogData> = {}
): PerformedExerciseLogData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    exerciseId: generateId(),
    plannedExerciseId: faker.helpers.maybe(() => generateId()),
    setIds: [generateId(), generateId(), generateId()],
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    isSkipped: faker.datatype.boolean(),
    exerciseName: faker.lorem.words(2),
    exerciseCategory: faker.helpers.arrayElement([
      'strength',
      'hypertrophy',
      'cardio',
      'stretching',
      'mobility',
      'other',
    ] as const),
    muscleActivation: {
      chest: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      lats: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      upper_back: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      lower_back: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      shoulders: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      biceps: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      triceps: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      forearms: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      quadriceps: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      hamstrings: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      calves: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      abdominals: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
      glutes: faker.number.float({ min: 0, max: 1, fractionDigits: 1 }),
    },
    totalSets: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 })),
    totalCounts: faker.helpers.maybe(() => faker.number.int({ min: 10, max: 50 })),
    totalVolume: faker.helpers.maybe(() =>
      faker.number.float({ min: 500, max: 5000, fractionDigits: 1 })
    ),
    repCategoryDistribution: faker.helpers.maybe(() => ({
      strength: faker.number.int({ min: 0, max: 3 }),
      hypertrophy: faker.number.int({ min: 0, max: 3 }),
      endurance: faker.number.int({ min: 0, max: 3 }),
    })),
    comparisonTrend: faker.helpers.maybe(() =>
      faker.helpers.arrayElement(['improvement', 'deterioration', 'maintenance'] as const)
    ),
    comparisonSetsChange: faker.helpers.maybe(() => faker.number.int({ min: -2, max: 2 })),
    comparisonCountsChange: faker.helpers.maybe(() => faker.number.int({ min: -10, max: 10 })),
    comparisonVolumeChange: faker.helpers.maybe(() =>
      faker.number.float({ min: -500, max: 500, fractionDigits: 1 })
    ),
    rpeEffort: faker.helpers.maybe(() =>
      faker.helpers.arrayElement(['poor', 'optimal', 'excessive'] as const)
    ),
    estimated1RM: faker.helpers.maybe(() =>
      faker.number.float({ min: 50, max: 300, fractionDigits: 1 })
    ),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for PerformedGroup with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestPerformedGroupData(
  overrides: Partial<PerformedGroupData & { createdAt: Date; updatedAt: Date }> = {}
): PerformedGroupData & { createdAt: Date; updatedAt: Date } {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    plannedGroupId: faker.helpers.maybe(() => generateId()),
    type: faker.helpers.arrayElement([
      'single',
      'superset',
      'circuit',
      'emom',
      'amrap',
      'warmup',
      'stretching',
    ] as const),
    performedExerciseLogIds: [generateId(), generateId()],
    actualRestSeconds: faker.helpers.maybe(() => faker.number.int({ min: 30, max: 300 })),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as PerformedGroupData & { createdAt: Date; updatedAt: Date };
}

/**
 * Creates a plain data object for WorkoutLog with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestWorkoutLogData(overrides: Partial<WorkoutLogData> = {}): WorkoutLogData {
  const now = new Date();
  const startTime = faker.date.recent();

  // Generate consistent endTime and durationSeconds
  const duration = faker.number.int({ min: 1800, max: 7200 }); // 30-120 minutes in seconds
  const endTime = faker.helpers.maybe(() => new Date(startTime.getTime() + duration * 1000));
  const durationSeconds = endTime ? duration : undefined;

  return {
    id: generateId(),
    profileId: generateId(),
    trainingPlanId: faker.helpers.maybe(() => generateId()),
    trainingPlanName: faker.lorem.words(3),
    sessionId: faker.helpers.maybe(() => generateId()),
    sessionName: faker.lorem.words(2),
    performedGroupIds: [generateId(), generateId()],
    startTime,
    endTime,
    durationSeconds,
    totalVolume: faker.helpers.maybe(() =>
      faker.number.float({ min: 1000, max: 10000, fractionDigits: 1 })
    ),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    userRating: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 })),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// --- Body Metrics Domain Test Factories ---

/**
 * Creates a plain data object for WeightRecord with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestWeightRecordData(
  overrides: Partial<WeightRecordData> = {}
): WeightRecordData {
  const now = new Date();
  const recordedDate = faker.date.recent({ days: 30 });
  return {
    id: generateId(),
    profileId: generateId(),
    date: recordedDate,
    weight: faker.number.float({ min: 50, max: 120, fractionDigits: 1 }),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a plain data object for HeightRecord with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestHeightRecordData(
  overrides: Partial<HeightRecordData> = {}
): HeightRecordData {
  const now = new Date();
  return {
    id: generateId(),
    profileId: generateId(),
    date: faker.date.recent({ days: 365 }),
    height: faker.number.float({ min: 150, max: 200, fractionDigits: 1 }),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// --- Max Log Domain Test Factories ---

/**
 * Creates a plain data object for MaxLog with default values.
 * @param overrides Partial data to override the defaults.
 */
export function createTestMaxLogData(overrides: Partial<MaxLogData> = {}): MaxLogData {
  const now = new Date();
  const weight = faker.number.float({ min: 40, max: 200, fractionDigits: 1 });
  const reps = faker.number.int({ min: 1, max: 12 });

  // Calculate realistic estimates based on common formulas
  const brzyckiEstimate = reps === 1 ? weight : weight / (1.0278 - 0.0278 * reps);
  const epleyEstimate = reps === 1 ? weight : weight * (1 + 0.0333 * reps);
  const averageEstimate = (brzyckiEstimate + epleyEstimate) / 2;

  const recordedDate = faker.date.recent({ days: 90 });

  return {
    id: generateId(),
    profileId: generateId(),
    exerciseId: generateId(),
    weightEnteredByUser: weight,
    date: recordedDate,
    reps,
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    estimated1RM: averageEstimate,
    maxBrzycki: brzyckiEstimate,
    maxBaechle: epleyEstimate,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a WeightRecordModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestWeightRecordModel(
  overrides: Partial<WeightRecordData> = {}
): WeightRecordModel {
  return WeightRecordModel.hydrate(createTestWeightRecordData(overrides));
}

/**
 * Creates a HeightRecordModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestHeightRecordModel(
  overrides: Partial<HeightRecordData> = {}
): HeightRecordModel {
  return HeightRecordModel.hydrate(createTestHeightRecordData(overrides));
}

/**
 * Creates a MaxLogModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param formulas Optional formula strategies for 1RM calculation.
 */
export function createTestMaxLogModel(
  overrides: Partial<MaxLogData> = {},
  formulas?: any[]
): MaxLogModel {
  return MaxLogModel.hydrate(createTestMaxLogData(overrides), formulas);
}

/**
 * Creates a PerformedSetModel instance for testing.
 * @param overrides Partial data to override the defaults.
 */
export function createTestPerformedSetModel(
  overrides: Partial<PerformedSetData> = {}
): PerformedSetModel {
  return PerformedSetModel.hydrate(createTestPerformedSetData(overrides));
}

/**
 * Creates a PerformedExerciseLogModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param sets Optional sets array, will create test ones if not provided
 */
export function createTestPerformedExerciseLogModel(
  overrides: Partial<PerformedExerciseLogData> = {},
  sets?: PerformedSetModel[]
): PerformedExerciseLogModel {
  const data = createTestPerformedExerciseLogData(overrides);
  const performedSets = sets || [createTestPerformedSetModel(), createTestPerformedSetModel()];
  return PerformedExerciseLogModel.hydrate(data, performedSets);
}

/**
 * Creates a PerformedGroupLogModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param exercises Optional exercises array, will create test ones if not provided
 */
export function createTestPerformedGroupLogModel(
  overrides: Partial<PerformedGroupData> = {},
  exercises?: PerformedExerciseLogModel[]
): PerformedGroupLogModel {
  const data = createTestPerformedGroupData(overrides);
  const performedExercises = exercises || [
    createTestPerformedExerciseLogModel(),
    createTestPerformedExerciseLogModel(),
  ];
  return PerformedGroupLogModel.hydrate(data, performedExercises);
}

/**
 * Creates a WorkoutLogModel instance for testing.
 * @param overrides Partial data to override the defaults.
 * @param groups Optional groups array, will create test ones if not provided
 */
export function createTestWorkoutLogModel(
  overrides: Partial<WorkoutLogData> = {},
  groups?: PerformedGroupLogModel[]
): WorkoutLogModel {
  const data = createTestWorkoutLogData(overrides);
  const performedGroups = groups || [
    createTestPerformedGroupLogModel(),
    createTestPerformedGroupLogModel(),
  ];
  return WorkoutLogModel.hydrate(data, performedGroups);
}

// --- Mock Utilities ---

/**
 * Creates a mock WatermelonDB Query object for testing.
 * This mock provides both `.observe()` and `.fetch()` methods that are required by `useObserveQuery`.
 *
 * @param mockData Array of data to return from both observe and fetch methods
 * @param options Configuration options for the mock behavior
 */
export function createMockWatermelonQuery<T = any>(
  mockData: T[] = [],
  options: {
    observeError?: Error;
    fetchError?: Error;
    observeDelay?: number;
    fetchDelay?: number;
  } = {}
) {
  const { observeError, fetchError, observeDelay = 0, fetchDelay = 0 } = options;

  // Create observable-like object with subscribe method
  const createObservable = (data: T[], error?: Error) => ({
    subscribe: vi.fn(
      (observer: { next?: (value: T[]) => void; error?: (error: Error) => void }) => {
        const timeoutId = setTimeout(() => {
          if (error) {
            observer.error?.(error);
          } else {
            observer.next?.(data);
          }
        }, observeDelay);

        // Return unsubscribe function
        return {
          unsubscribe: vi.fn(() => {
            clearTimeout(timeoutId);
          }),
        };
      }
    ),
  });

  // Create the mock query object
  const mockQuery = {
    observe: vi.fn(() => createObservable(mockData, observeError)),
    fetch: vi.fn(() => {
      if (fetchError) {
        return Promise.reject(fetchError);
      }
      return new Promise<T[]>((resolve) => {
        setTimeout(() => resolve(mockData), fetchDelay);
      });
    }),
  };

  return mockQuery;
}

/**
 * Creates a mock WatermelonDB Exercise model for testing.
 * This mock provides the structure expected by transformation functions.
 *
 * @param data The exercise data to use (will be converted to _raw format)
 */
export function createMockWatermelonExercise(data: Partial<ExerciseData> = {}) {
  const exerciseData = createTestExerciseData(data);

  // Create mock WatermelonDB Exercise model with _raw property
  const mockExercise = {
    id: exerciseData.id,
    _raw: {
      profile_id: exerciseData.profileId,
      name: exerciseData.name,
      description: exerciseData.description,
      category: exerciseData.category,
      movement_type: exerciseData.movementType,
      movement_pattern: exerciseData.movementPattern || null,
      difficulty: exerciseData.difficulty,
      equipment: JSON.stringify(exerciseData.equipment),
      muscle_activation: JSON.stringify(exerciseData.muscleActivation),
      counter_type: exerciseData.counterType,
      joint_type: exerciseData.jointType,
      notes: exerciseData.notes || null,
      substitutions: JSON.stringify(exerciseData.substitutions),
      created_at: exerciseData.createdAt,
      updated_at: exerciseData.updatedAt,
    },
  };

  return mockExercise;
}

/**
 * Creates a mock WatermelonDB WeightRecord model for testing.
 * This mock provides the structure expected by transformation functions.
 *
 * @param data The weight record data to use (will be converted to _raw format)
 */
export function createMockWatermelonWeightRecord(data: Partial<WeightRecordData> = {}) {
  const weightRecordData = createTestWeightRecordData(data);

  // Create mock WatermelonDB WeightRecord model with _raw property
  const mockWeightRecord = {
    id: weightRecordData.id,
    _raw: {
      id: weightRecordData.id,
      profile_id: weightRecordData.profileId,
      date: weightRecordData.date.getTime(),
      weight: weightRecordData.weight,
      notes: weightRecordData.notes || null,
      created_at: weightRecordData.createdAt.getTime(),
      updated_at: weightRecordData.updatedAt.getTime(),
    },
  };

  return mockWeightRecord;
}

/**
 * Creates a mock WatermelonDB HeightRecord model for testing.
 * This mock provides the structure expected by transformation functions.
 *
 * @param data The height record data to use (will be converted to _raw format)
 */
export function createMockWatermelonHeightRecord(data: Partial<HeightRecordData> = {}) {
  const heightRecordData = createTestHeightRecordData(data);

  // Create mock WatermelonDB HeightRecord model with _raw property
  const mockHeightRecord = {
    id: heightRecordData.id,
    _raw: {
      id: heightRecordData.id,
      profile_id: heightRecordData.profileId,
      date: heightRecordData.date.getTime(),
      height: heightRecordData.height,
      notes: heightRecordData.notes || null,
      created_at: heightRecordData.createdAt.getTime(),
      updated_at: heightRecordData.updatedAt.getTime(),
    },
  };

  return mockHeightRecord;
}
