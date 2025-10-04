import { Database, Q } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { AppliedExercise } from './model/AppliedExercise';
import { CustomTheme } from './model/CustomTheme';
import { Exercise } from './model/Exercise';
import { ExerciseGroup } from './model/ExerciseGroup';
import { ExerciseTemplate } from './model/ExerciseTemplate';
import { HeightRecord } from './model/HeightRecord';
import { MaxLog } from './model/MaxLog';
import { PerformedExerciseLog } from './model/PerformedExerciseLog';
import { PerformedGroup } from './model/PerformedGroup';
import { PerformedSet } from './model/PerformedSet';
// Import all WatermelonDB models
import { Profile } from './model/Profile';
import { TrainingCycle } from './model/TrainingCycle';
import { TrainingPlan } from './model/TrainingPlan';
import { UserDetails } from './model/UserDetails';
import { UserSettings } from './model/UserSettings';
import { WeightRecord } from './model/WeightRecord';
import { WorkoutLog } from './model/WorkoutLog';
import { WorkoutSession } from './model/WorkoutSession';
import { WorkoutState } from './model/WorkoutState';
import schema from './schema';

// WatermelonDB adapter configuration
// Use LokiJSAdapter for browser/web environments (IndexedDB-based storage)
const adapter = new LokiJSAdapter({
  schema,
  // No migrations needed for initial version
  useWebWorker: false,
  useIncrementalIndexedDB: true,
});

// Initialize the WatermelonDB database
export const database = new Database({
  adapter,
  // Register all model classes with WatermelonDB
  modelClasses: [
    // Profile and user-related models
    Profile,
    UserSettings,
    UserDetails,
    CustomTheme,
    // Exercise-related models
    Exercise,
    ExerciseTemplate,
    // Training plan related models
    TrainingCycle,
    TrainingPlan,
    WorkoutSession,
    ExerciseGroup,
    AppliedExercise,
    // Workout log related models
    WorkoutLog,
    PerformedGroup,
    PerformedExerciseLog,
    PerformedSet,
    // Body metrics models
    WeightRecord,
    HeightRecord,
    // Max log model
    MaxLog,
    // Workout state model
    WorkoutState,
  ],
});

// Export the ExtendedDatabase type for injection
export type BlueprintFitnessDB = ExtendedDatabase;

/**
 * Collection wrapper that provides a simplified interface over WatermelonDB collections.
 * Handles data format conversion between domain format (camelCase) and database format (snake_case).
 */
class CollectionWrapper {
  constructor(
    private database: Database,
    private tableName: string,
    private fieldMapping: Record<string, string>
  ) {}

  /**
   * Converts domain format data to database format
   */
  private toDatabaseFormat(data: any): any {
    const dbData: any = {};
    for (const [domainField, dbField] of Object.entries(this.fieldMapping)) {
      if (data[domainField] !== undefined) {
        let value = data[domainField];
        // Convert Date objects to timestamps for database storage
        if (value instanceof Date) {
          value = value.getTime();
        }
        // Convert arrays/objects to JSON strings for database storage
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          value = JSON.stringify(value);
        }
        dbData[dbField] = value;
      }
    }
    return dbData;
  }

  /**
   * Converts database format data to domain format
   */
  private async toDomainFormat(record: any): Promise<any> {
    const domainData: any = { id: record.id };
    for (const [domainField, dbField] of Object.entries(this.fieldMapping)) {
      if (record._raw[dbField] !== undefined) {
        let value = record._raw[dbField];
        // Convert timestamps back to Date objects
        if (
          domainField.includes('At') ||
          domainField === 'date' ||
          domainField === 'lastUsed' ||
          domainField.includes('Time')
        ) {
          value = new Date(value);
        }
        // Parse JSON strings back to objects/arrays for specific fields
        if (
          typeof value === 'string' &&
          (domainField.includes('equipment') ||
            domainField.includes('muscle') ||
            domainField.includes('substitutions') ||
            domainField.includes('Configuration') ||
            domainField.includes('rounds') ||
            domainField.includes('planned') ||
            domainField.includes('Ids') || // Handle all ID array fields (appliedExerciseIds, sessionIds, etc.)
            domainField.endsWith('Ids')) // Alternative pattern for ID array fields
        ) {
          try {
            value = JSON.parse(value);
          } catch (_error) {
            // Keep as string if parsing fails
          }
        }
        domainData[domainField] = value;
      }
    }

    // Handle virtual fields for aggregate relationships
    await this.addVirtualFields(record, domainData);

    return domainData;
  }

  /**
   * Add virtual fields needed for aggregate compatibility
   */
  private async addVirtualFields(record: any, domainData: any): Promise<void> {
    const tableName = this.tableName;

    if (tableName === 'training_plans') {
      // Add sessionIds array for training plans
      const sessions = await record.workoutSessions.fetch();
      domainData.sessionIds = sessions.map((s: any) => s.id);
    } else if (tableName === 'workout_sessions') {
      // Add groupIds array for workout sessions
      const groups = await record.exerciseGroups.fetch();
      domainData.groupIds = groups.map((g: any) => g.id);
    } else if (tableName === 'exercise_groups') {
      // Skip virtual fields for exercise_groups - appliedExerciseIds should come from stored data
      // This allows tests to store IDs directly without requiring related records to exist
    } else if (tableName === 'workout_logs') {
      // Add performedGroupIds array for workout logs
      const groups = await record.performedGroups.fetch();
      domainData.performedGroupIds = groups.map((g: any) => g.id);
    } else if (tableName === 'performed_groups') {
      // Add performedExerciseLogIds array for performed groups
      const exercises = await record.performedExerciseLogs.fetch();
      domainData.performedExerciseLogIds = exercises.map((e: any) => e.id);
    } else if (tableName === 'performed_exercise_logs') {
      // Add setIds array for performed exercises
      const sets = await record.performedSets.fetch();
      domainData.setIds = sets.map((s: any) => s.id);
    }
  }

  /**
   * Get a single record by ID in domain format
   */
  async get(id: string): Promise<any | undefined> {
    try {
      const collection = this.database.get(this.tableName);
      const record = await collection.find(id);
      // Check if the record is marked as deleted
      if (record._raw._status === 'deleted') {
        return undefined;
      }
      return await this.toDomainFormat(record);
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Save/update a single record
   */
  async put(data: any): Promise<any> {
    return this.database.write(async () => {
      const collection = this.database.get(this.tableName);
      const dbData = this.toDatabaseFormat(data);

      try {
        // Try to find existing record
        const existing = await collection.find(data.id);
        await existing.update((rec: any) => {
          Object.assign(rec._raw, dbData);
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        await collection.create((rec: any) => {
          rec._raw.id = data.id;
          Object.assign(rec._raw, dbData);
        });
      }
    });
  }

  /**
   * Save/update multiple records
   */
  async bulkPut(dataArray: any[]): Promise<void> {
    return this.database.write(async () => {
      const collection = this.database.get(this.tableName);

      for (const data of dataArray) {
        const dbData = this.toDatabaseFormat(data);

        try {
          // Try to find existing record
          const existing = await collection.find(data.id);
          await existing.update((rec: any) => {
            Object.assign(rec._raw, dbData);
          });
        } catch (_error) {
          // Record doesn't exist, create new one
          await collection.create((rec: any) => {
            rec._raw.id = data.id;
            Object.assign(rec._raw, dbData);
          });
        }
      }
    });
  }

  /**
   * Get multiple records by IDs
   */
  async bulkGet(ids: string[]): Promise<(any | undefined)[]> {
    const collection = this.database.get(this.tableName);
    const results: (any | undefined)[] = [];

    for (const id of ids) {
      try {
        const record = await collection.find(id);
        if (record._raw._status !== 'deleted') {
          results.push(await this.toDomainFormat(record));
        } else {
          results.push(undefined);
        }
      } catch (_error) {
        results.push(undefined);
      }
    }

    return results;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    return this.database.write(async () => {
      try {
        const collection = this.database.get(this.tableName);
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Record doesn't exist, nothing to delete
      }
    });
  }

  /**
   * Query records with a where clause
   */
  where(field: string) {
    return new QueryBuilder(this.database, this.tableName, this.fieldMapping, field, this);
  }

  /**
   * Get all records in the collection
   */
  async toArray(): Promise<any[]> {
    const collection = this.database.get(this.tableName);
    const records = await collection.query().fetch();
    const filteredRecords = records.filter((record) => record._raw._status !== 'deleted');

    const results = [];
    for (const record of filteredRecords) {
      results.push(await this.toDomainFormat(record));
    }
    return results;
  }

  /**
   * Add a new record to the collection (for compatibility with tests)
   */
  async add(data: any): Promise<void> {
    return this.put(data);
  }

  /**
   * Update a record by ID (for compatibility with tests)
   */
  async update(id: string, updates: any): Promise<void> {
    return this.database.write(async () => {
      const collection = this.database.get(this.tableName);
      try {
        const record = await collection.find(id);
        await record.update((rec: any) => {
          const dbUpdates = this.toDatabaseFormat(updates);
          Object.assign(rec._raw, dbUpdates);
        });
      } catch (_error) {
        // Record doesn't exist, silently fail
      }
    });
  }

  /**
   * Count records in collection
   */
  async count(): Promise<number> {
    const collection = this.database.get(this.tableName);
    const records = await collection.query().fetch();
    return records.filter((record) => record._raw._status !== 'deleted').length;
  }
}

/**
 * Query builder for WatermelonDB queries with a simplified API
 */
class QueryBuilder {
  private whereClause: any = null;
  private andClauses: ((record: any) => boolean)[] = [];

  constructor(
    private database: Database,
    private tableName: string,
    private fieldMapping: Record<string, string>,
    private field: string,
    private parentWrapper: CollectionWrapper
  ) {}

  /**
   * Filter by field equals value
   */
  equals(value: any) {
    const dbField = this.fieldMapping[this.field] || this.field;
    this.whereClause = { [dbField]: value };
    return this;
  }

  /**
   * Add additional AND condition
   */
  and(predicate: (record: any) => boolean) {
    this.andClauses.push(predicate);
    return this;
  }

  /**
   * Execute the query and return results
   */
  async toArray(): Promise<any[]> {
    const collection = this.database.get(this.tableName);
    let query = collection.query();

    if (this.whereClause) {
      const field = Object.keys(this.whereClause)[0];
      const value = Object.values(this.whereClause)[0];
      // WatermelonDB query syntax: Q.where(field, value)
      query = collection.query(Q.where(field, value));
    }

    const records = await query.fetch();
    const filteredRecords = records.filter((record) => record._raw._status !== 'deleted');

    let results = [];
    for (const record of filteredRecords) {
      results.push(await this.parentWrapper['toDomainFormat'](record));
    }

    // Apply additional AND clauses
    for (const predicate of this.andClauses) {
      results = results.filter(predicate);
    }

    return results;
  }

  /**
   * Get the first result from the query
   */
  async first(): Promise<any | undefined> {
    const results = await this.toArray();
    return results.length > 0 ? results[0] : undefined;
  }
}

// Field mappings for each collection (domain -> database field names)
const profileFieldMapping = {
  id: 'id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  name: 'name',
  lastUsed: 'last_used',
  isActive: 'is_active',
};

const userSettingsFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  theme: 'theme',
  language: 'language',
  units: 'units',
  restTimerSound: 'rest_timer_sound',
  workoutMusic: 'workout_music',
  autoProgressiveOverload: 'auto_progressive_overload',
};

const trainingPlanFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  name: 'name',
  description: 'description',
  cycleId: 'cycle_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  isArchived: 'is_archived',
  sessionIds: 'session_ids',
};

const workoutSessionFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  name: 'name',
  groupIds: 'group_ids',
  notes: 'notes',
  executionCount: 'execution_count',
  isDeload: 'is_deload',
  dayOfWeek: 'day_of_week',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const exerciseGroupFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  type: 'type',
  appliedExerciseIds: 'applied_exercise_ids',
  restTimeSeconds: 'rest_time_seconds',
  rounds: 'rounds',
  durationMinutes: 'duration_minutes',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const appliedExerciseFieldMapping = {
  id: 'id',
  groupId: 'group_id',
  exerciseId: 'exercise_id',
  order: 'order',
  plannedSets: 'planned_sets',
  plannedReps: 'planned_reps',
  plannedWeight: 'planned_weight',
  plannedDuration: 'planned_duration',
  plannedDistance: 'planned_distance',
  notes: 'notes',
  substitutions: 'substitutions',
};

const workoutLogFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  trainingPlanId: 'training_plan_id',
  trainingPlanName: 'training_plan_name',
  sessionId: 'session_id',
  sessionName: 'session_name',
  performedGroupIds: 'performed_group_ids',
  startTime: 'start_time',
  endTime: 'end_time',
  durationSeconds: 'duration_seconds',
  totalVolume: 'total_volume',
  notes: 'notes',
  userRating: 'user_rating',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const performedGroupFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  plannedGroupId: 'planned_group_id',
  type: 'type',
  performedExerciseLogIds: 'performed_exercise_log_ids',
  actualRestSeconds: 'actual_rest_seconds',
};

const performedExerciseFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  exerciseId: 'exercise_id',
  plannedExerciseId: 'planned_exercise_id',
  setIds: 'set_ids',
  notes: 'notes',
  isSkipped: 'is_skipped',
  exerciseName: 'exercise_name',
  exerciseCategory: 'exercise_category',
  muscleActivation: 'muscle_activation',
  totalSets: 'total_sets',
  totalCounts: 'total_counts',
  totalVolume: 'total_volume',
  repCategoryDistribution: 'rep_category_distribution',
  comparisonTrend: 'comparison_trend',
  comparisonSetsChange: 'comparison_sets_change',
  comparisonCountsChange: 'comparison_counts_change',
  comparisonVolumeChange: 'comparison_volume_change',
  rpeEffort: 'rpe_effort',
};

const performedSetFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  counterType: 'counter_type',
  counts: 'counts',
  weight: 'weight',
  completed: 'completed',
  notes: 'notes',
  rpe: 'rpe',
  percentage: 'percentage',
  plannedLoad: 'planned_load',
  plannedRpe: 'planned_rpe',
  plannedCounts: 'planned_counts',
};

const exerciseFieldMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  primaryMuscles: 'primary_muscles',
  secondaryMuscles: 'secondary_muscles',
  equipment: 'equipment',
  instructions: 'instructions',
  tips: 'tips',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const maxLogFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  exerciseId: 'exercise_id',
  weight: 'weight',
  reps: 'reps',
  date: 'date',
  notes: 'notes',
};

const weightRecordFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  weight: 'weight',
  date: 'date',
  notes: 'notes',
};

const heightRecordFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  height: 'height',
  date: 'date',
  notes: 'notes',
};

const workoutStateFieldMapping = {
  id: 'id',
  profileId: 'profile_id',
  state: 'state',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

// Extend the Database class with collection wrappers
class ExtendedDatabase extends Database {
  public profiles: CollectionWrapper;
  public userSettings: CollectionWrapper;
  public trainingPlans: CollectionWrapper;
  public workoutSessions: CollectionWrapper;
  public exerciseGroups: CollectionWrapper;
  public appliedExercises: CollectionWrapper;
  public workoutLogs: CollectionWrapper;
  public performedGroups: CollectionWrapper;
  public performedExerciseLogs: CollectionWrapper;
  public performedSets: CollectionWrapper;
  public exercises: CollectionWrapper;
  public maxLogs: CollectionWrapper;
  public weightRecords: CollectionWrapper;
  public heightRecords: CollectionWrapper;
  public workoutStates: CollectionWrapper;

  constructor(options: any) {
    super(options);

    // Initialize collection wrappers
    this.profiles = new CollectionWrapper(this, 'profiles', profileFieldMapping);
    this.userSettings = new CollectionWrapper(this, 'user_settings', userSettingsFieldMapping);
    this.trainingPlans = new CollectionWrapper(this, 'training_plans', trainingPlanFieldMapping);
    this.workoutSessions = new CollectionWrapper(
      this,
      'workout_sessions',
      workoutSessionFieldMapping
    );
    this.exerciseGroups = new CollectionWrapper(this, 'exercise_groups', exerciseGroupFieldMapping);
    this.appliedExercises = new CollectionWrapper(
      this,
      'applied_exercises',
      appliedExerciseFieldMapping
    );
    this.workoutLogs = new CollectionWrapper(this, 'workout_logs', workoutLogFieldMapping);
    this.performedGroups = new CollectionWrapper(
      this,
      'performed_groups',
      performedGroupFieldMapping
    );
    this.performedExerciseLogs = new CollectionWrapper(
      this,
      'performed_exercise_logs',
      performedExerciseFieldMapping
    );
    this.performedSets = new CollectionWrapper(this, 'performed_sets', performedSetFieldMapping);
    this.exercises = new CollectionWrapper(this, 'exercises', exerciseFieldMapping);
    this.maxLogs = new CollectionWrapper(this, 'max_logs', maxLogFieldMapping);
    this.weightRecords = new CollectionWrapper(this, 'weight_records', weightRecordFieldMapping);
    this.heightRecords = new CollectionWrapper(this, 'height_records', heightRecordFieldMapping);
    this.workoutStates = new CollectionWrapper(this, 'workout_states', workoutStateFieldMapping);
  }
}

// Create the extended database instance
export const extendedDatabase = new ExtendedDatabase({
  adapter,
  modelClasses: [
    // Profile and user-related models
    Profile,
    UserSettings,
    UserDetails,
    CustomTheme,
    // Exercise-related models
    Exercise,
    ExerciseTemplate,
    // Training plan related models
    TrainingCycle,
    TrainingPlan,
    WorkoutSession,
    ExerciseGroup,
    AppliedExercise,
    // Workout log related models
    WorkoutLog,
    PerformedGroup,
    PerformedExerciseLog,
    PerformedSet,
    // Body metrics models
    WeightRecord,
    HeightRecord,
    // Max log model
    MaxLog,
    // Workout state model
    WorkoutState,
  ],
});

// Export the extended database instance as db for compatibility
export const db = extendedDatabase;
