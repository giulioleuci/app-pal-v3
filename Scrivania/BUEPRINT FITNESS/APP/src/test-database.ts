import { Database, Model } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { type BlueprintFitnessDB } from '@/app/db/database';
import { sampleDataFixture } from '@/app/db/fixtures/sample-data';
// Import WatermelonDB models
import { AppliedExercise } from '@/app/db/model/AppliedExercise';
import { CustomTheme } from '@/app/db/model/CustomTheme';
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
import { WorkoutState } from '@/app/db/model/WorkoutState';
import schema from '@/app/db/schema';
import { generateId } from '@/lib/id';

/**
 * Test Database Utilities
 *
 * This module provides utilities for creating and seeding isolated WatermelonDB instances
 * for testing purposes. Uses LokiJS adapter for in-memory testing to ensure fast and
 * isolated test execution.
 *
 * Key Features:
 * - Uses LokiJS adapter for in-memory testing
 * - Uses WatermelonDB's write() API for transaction management
 * - Uses prepareCreate() and batch() for efficient bulk operations
 * - Provides complete test isolation between test suites
 *
 * Dependencies:
 * - @nozbe/watermelondb: Core WatermelonDB functionality
 * - All WatermelonDB model classes for proper database initialization
 */

/**
 * Creates a new, isolated WatermelonDB database instance for testing.
 * Uses an in-memory LokiJS adapter for complete isolation between test suites.
 * Each test database instance has a unique name to ensure test isolation.
 * @returns A new WatermelonDB Database instance configured for testing.
 */
export function createTestDatabase(): TestExtendedDatabase {
  // Create a unique database name for test isolation
  const dbName = `TestDB_${Date.now()}_${Math.random()}`;

  // Configure in-memory LokiJS adapter for testing
  const adapter = new LokiJSAdapter({
    schema,
    dbName,
    useWebWorker: false, // Required for testing environment
    useIncrementalIndexedDB: false, // Required for compatibility with testing environment
  });

  // Initialize WatermelonDB with all model classes
  const database = new Database({
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

  // Create an extended database instance that mimics the production BlueprintFitnessDB
  return new TestExtendedDatabase({
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
      AppliedExercise,
      // Training-related models
      TrainingCycle,
      TrainingPlan,
      WorkoutSession,
      ExerciseGroup,
      // Workout log models
      WorkoutLog,
      PerformedGroup,
      PerformedExerciseLog,
      PerformedSet,
      // Analytics and tracking models
      WeightRecord,
      HeightRecord,
      // Max log model
      MaxLog,
      // Workout state model
      WorkoutState,
    ],
  });
}

/**
 * Extended database class for tests that provides the same interface as production BlueprintFitnessDB
 */
export class TestExtendedDatabase extends Database {
  public profiles: any;
  public userSettings: any;
  public trainingPlans: any;
  public trainingCycles: any;
  public workoutSessions: any;
  public exerciseGroups: any;
  public appliedExercises: any;
  public workoutLogs: any;
  public performedGroups: any;
  public performedExerciseLogs: any;
  public performedExercises: any; // Alias for performedExerciseLogs for test compatibility
  public performedSets: any;
  public exercises: any;
  public exerciseTemplates: any;
  public maxLogs: any;
  public weightRecords: any;
  public heightRecords: any;
  public workoutStates: any;

  constructor(options: any) {
    super(options);

    // Create collection wrappers using the database instance
    this.profiles = createCollectionWrapper(this, 'profiles', {
      id: 'id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      name: 'name',
      lastUsed: 'last_used',
      isActive: 'is_active',
    });

    this.trainingPlans = createCollectionWrapper(this, 'training_plans', {
      id: 'id',
      profileId: 'profile_id',
      name: 'name',
      description: 'description',
      cycleId: 'cycle_id',
      sessionIds: 'session_ids',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      isArchived: 'is_archived',
      currentSessionIndex: 'current_session_index',
      notes: 'notes',
      order: 'order',
      lastUsed: 'last_used',
    });

    this.trainingCycles = createCollectionWrapper(this, 'training_cycles', {
      id: 'id',
      profileId: 'profile_id',
      name: 'name',
      description: 'description',
      phase: 'phase',
      length: 'length',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    this.workoutSessions = createCollectionWrapper(this, 'workout_sessions', {
      id: 'id',
      trainingPlanId: 'training_plan_id',
      name: 'name',
      profileId: 'profile_id',
      groupIds: 'group_ids',
      notes: 'notes',
      executionCount: 'execution_count',
      isDeload: 'is_deload',
      dayOfWeek: 'day_of_week',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    this.exerciseGroups = createCollectionWrapper(this, 'exercise_groups', {
      id: 'id',
      workoutSessionId: 'workout_session_id',
      profileId: 'profile_id',
      appliedExerciseIds: 'applied_exercise_ids',
      type: 'type',
      rounds: 'rounds',
      durationMinutes: 'duration_minutes',
      restTimeSeconds: 'rest_time_seconds',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    this.appliedExercises = createCollectionWrapper(this, 'applied_exercises', {
      id: 'id',
      exerciseGroupId: 'exercise_group_id',
      exerciseId: 'exercise_id',
      templateId: 'template_id',
      profileId: 'profile_id',
      setConfiguration: 'set_configuration',
      restTimeSeconds: 'rest_time_seconds',
      executionCount: 'execution_count',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    this.exercises = createCollectionWrapper(this, 'exercises', {
      id: 'id',
      profileId: 'profile_id',
      name: 'name',
      description: 'description',
      category: 'category',
      movementType: 'movement_type',
      movementPattern: 'movement_pattern',
      difficulty: 'difficulty',
      equipment: 'equipment',
      muscleActivation: 'muscle_activation',
      counterType: 'counter_type',
      jointType: 'joint_type',
      notes: 'notes',
      substitutions: 'substitutions',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    // Create wrappers for workout log collections with proper field mappings
    this.workoutLogs = createCollectionWrapper(this, 'workout_logs', {
      id: 'id',
      profileId: 'profile_id',
      trainingPlanId: 'training_plan_id',
      trainingPlanName: 'training_plan_name',
      sessionId: 'session_id',
      sessionName: 'session_name',
      startTime: 'start_time',
      endTime: 'end_time',
      durationSeconds: 'duration_seconds',
      totalVolume: 'total_volume',
      notes: 'notes',
      userRating: 'user_rating',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      performedGroupIds: 'performed_group_ids',
    });

    this.performedGroups = createCollectionWrapper(this, 'performed_groups', {
      id: 'id',
      profileId: 'profile_id',
      workoutLogId: 'workout_log_id',
      plannedGroupId: 'planned_group_id',
      type: 'type',
      actualRestSeconds: 'actual_rest_seconds',
      performedExerciseLogIds: 'performed_exercise_log_ids',
    });

    this.performedExerciseLogs = createCollectionWrapper(this, 'performed_exercise_logs', {
      id: 'id',
      profileId: 'profile_id',
      performedGroupId: 'performed_group_id',
      exerciseId: 'exercise_id',
      plannedExerciseId: 'planned_exercise_id',
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
      comparisonVolume: 'comparison_volume',
      comparisonAvgWeight: 'comparison_avg_weight',
      comparisonMaxWeight: 'comparison_max_weight',
      comparisonTotalReps: 'comparison_total_reps',
      rpeEffort: 'rpe_effort',
      estimated1RM: 'estimated_1rm',
      setIds: 'performed_set_ids',
    });

    // Create alias for test compatibility
    this.performedExercises = this.performedExerciseLogs;

    this.performedSets = createCollectionWrapper(this, 'performed_sets', {
      id: 'id',
      profileId: 'profile_id',
      performedExerciseLogId: 'performed_exercise_log_id',
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
    });

    this.exerciseTemplates = createCollectionWrapper(this, 'exercise_templates', {
      id: 'id',
      profileId: 'profile_id',
      exerciseId: 'exercise_id',
      name: 'name',
      description: 'description',
      defaultSetConfiguration: 'default_set_configuration',
      isArchived: 'is_archived',
      lastUsed: 'last_used',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    // Create minimal wrappers for other collections
    this.userSettings = createCollectionWrapper(this, 'user_settings', {});
    this.maxLogs = createCollectionWrapper(this, 'max_logs', {
      id: 'id',
      profileId: 'profile_id',
      exerciseId: 'exercise_id',
      weightEnteredByUser: 'weight_entered_by_user',
      date: 'date',
      reps: 'reps',
      notes: 'notes',
      estimated1RM: 'estimated_1rm',
      maxBrzycki: 'max_brzycki',
      maxBaechle: 'max_baechle',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
    this.weightRecords = createCollectionWrapper(this, 'weight_records', {
      id: 'id',
      profileId: 'profile_id',
      date: 'date',
      weight: 'weight',
      notes: 'notes',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
    this.heightRecords = createCollectionWrapper(this, 'height_records', {
      id: 'id',
      profileId: 'profile_id',
      date: 'date',
      height: 'height',
      notes: 'notes',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
    this.workoutStates = createCollectionWrapper(this, 'workout_states', {
      id: 'id',
      profileId: 'profile_id',
      state: 'state',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
  }

  // Database methods are inherited from parent class

  // Add cleanup method for tests
  cleanup = async () => {
    try {
      // For LokiJS adapter, we can clear all collections using batch operations for efficiency
      const collectionNames = [
        'profiles',
        'training_plans',
        'workout_sessions',
        'exercise_groups',
        'applied_exercises',
        'exercises',
        'workout_logs',
        'performed_groups',
        'performed_exercise_logs',
        'performed_sets',
        'weight_records',
        'height_records',
        'max_logs',
        'workout_states',
        'user_settings',
        'user_details',
        'custom_themes',
        'exercise_templates',
        'training_cycles',
      ];

      await this.write(async () => {
        const recordsToDelete = [];

        // Collect all records to delete
        for (const collectionName of collectionNames) {
          try {
            const collection = this.get(collectionName);
            const records = await collection.query().fetch();
            recordsToDelete.push(...records);
          } catch (_error) {
            // Collection might not exist, continue with others
          }
        }

        // Use batch operation for efficient deletion
        if (recordsToDelete.length > 0) {
          await this.batch(...recordsToDelete.map((record) => record.prepareMarkAsDeleted()));
        }
      });
    } catch (_error) {
      console.warn('Database cleanup failed:', _error);
    }
  };

  // Add delete method for test compatibility - this is what integration tests expect
  delete = async () => {
    // Integration tests expect testDb.delete() to completely clean the database
    // Use the same implementation as cleanup() for consistent behavior
    await this.cleanup();
  };
}

/**
 * Creates a basic collection wrapper for test compatibility
 */
function createCollectionWrapper(
  database: Database,
  tableName: string,
  fieldMapping: Record<string, string>
) {
  return {
    async put(data: any): Promise<void> {
      // Collection wrappers are transaction-context aware - let calling code handle transactions
      const collection = database.get(tableName);
      const dbData = convertToDatabaseFormat(data, fieldMapping);

      try {
        // Try to find existing record
        const existing = await collection.find(data.id);
        await existing.update((rec: any) => {
          // First, clear all fields that should be undefined
          for (const [domainField, dbField] of Object.entries(fieldMapping)) {
            if (!data.hasOwnProperty(domainField) || data[domainField] === undefined) {
              delete rec._raw[dbField];
            }
          }
          // Then assign the new data
          Object.assign(rec._raw, dbData);
        });
      } catch (_error) {
        // Record doesn't exist, create new one
        // Don't create a new transaction - assume we're already in one
        await collection.create((rec: any) => {
          rec._raw.id = data.id;
          Object.assign(rec._raw, dbData);
        });
      }
    },

    async get(id: string): Promise<any | undefined> {
      try {
        console.log(`Getting record ${id} from ${tableName}...`);
        const collection = database.get(tableName);
        console.log(`Collection obtained for ${tableName}`);

        // Add timeout protection around the potentially hanging operation
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Query timeout for ${tableName}.get(${id})`)), 5000);
        });

        const queryPromise = collection.query().fetch();
        const records = await Promise.race([queryPromise, timeoutPromise]);
        console.log(`Query completed for ${tableName}, found ${records.length} records`);

        const record = records.find((r) => r.id === id);
        console.log(`Record with id ${id} found:`, !!record);

        if (!record || record._raw._status === 'deleted') {
          return undefined;
        }

        // Return basic data with proper conversion to match toPlainObject() format
        const basicData: any = { id: record.id };
        for (const [domainField, dbField] of Object.entries(fieldMapping)) {
          if (record._raw.hasOwnProperty(dbField)) {
            const value = (record._raw as any)[dbField];
            if (value !== undefined && value !== null) {
              // Convert timestamps to Date objects for date fields
              if (
                domainField === 'createdAt' ||
                domainField === 'updatedAt' ||
                domainField === 'date' ||
                domainField === 'lastUsed' ||
                domainField === 'startTime' ||
                domainField === 'endTime'
              ) {
                basicData[domainField] = typeof value === 'number' ? new Date(value) : value;
              } else if (domainField.includes('Configuration') && typeof value === 'string') {
                // Parse JSON strings for configuration fields
                try {
                  basicData[domainField] = JSON.parse(value);
                } catch {
                  basicData[domainField] = value;
                }
              } else if (domainField.includes('Ids') && typeof value === 'string') {
                // Parse JSON strings for ID array fields like appliedExerciseIds
                try {
                  basicData[domainField] = JSON.parse(value);
                } catch {
                  basicData[domainField] = [];
                }
              } else if (
                (domainField === 'muscleActivation' || domainField === 'repCategoryDistribution') &&
                typeof value === 'string'
              ) {
                // Parse JSON strings for muscleActivation and repCategoryDistribution
                try {
                  basicData[domainField] = JSON.parse(value);
                } catch {
                  basicData[domainField] = value;
                }
              } else {
                basicData[domainField] = value;
              }
            } else {
              // Handle null values correctly - convert null to undefined for optional fields except cycleId
              if (value === null) {
                // Keep null for cycleId and templateId (foreign keys), convert others to undefined
                if (domainField === 'cycleId' || domainField === 'templateId') {
                  basicData[domainField] = null;
                } else {
                  basicData[domainField] = undefined;
                }
              } else {
                basicData[domainField] = undefined;
              }
            }
          } else {
            // Include undefined for missing fields, but null for cycleId to match toPlainObject() format
            if (domainField === 'cycleId') {
              basicData[domainField] = null;
            } else {
              basicData[domainField] = undefined;
            }
          }
        }
        console.log(`Returning data for ${id}:`, basicData);
        return basicData;
      } catch (_error) {
        console.error(`Error in get(${id}) for ${tableName}:`, _error);
        return undefined;
      }
    },

    async bulkGet(ids: string[]): Promise<(any | undefined)[]> {
      const results: (any | undefined)[] = [];
      const collection = database.get(tableName);

      // Optimize: Get all records at once instead of individual finds
      try {
        const allRecords = await collection.query().fetch();
        const recordsById = new Map(allRecords.map((record) => [record.id, record]));

        for (const id of ids) {
          const record = recordsById.get(id);
          if (record && record._raw._status !== 'deleted') {
            results.push(await convertToDomainFormat(record, fieldMapping));
          } else {
            results.push(undefined);
          }
        }
      } catch (_error) {
        // Fallback to individual finds if batch fails
        for (const id of ids) {
          try {
            const record = await collection.find(id);
            if (record._raw._status !== 'deleted') {
              results.push(await convertToDomainFormat(record, fieldMapping));
            } else {
              results.push(undefined);
            }
          } catch (_error) {
            results.push(undefined);
          }
        }
      }
      return results;
    },

    async toArray(): Promise<any[]> {
      const collection = database.get(tableName);
      const records = await collection.query().fetch();
      const filteredRecords = records.filter((record) => record._raw._status !== 'deleted');

      const results = [];
      for (const record of filteredRecords) {
        results.push(await convertToDomainFormat(record, fieldMapping));
      }
      return results;
    },

    where(field: string) {
      return new QueryBuilder(database, tableName, fieldMapping, field);
    },

    async delete(id: string): Promise<void> {
      // Collection wrappers are transaction-context aware - let calling code handle transactions
      try {
        const collection = database.get(tableName);
        const record = await collection.find(id);
        await record.markAsDeleted();
      } catch (_error) {
        // Record doesn't exist, nothing to delete
      }
    },

    async bulkPut(dataArray: any[]): Promise<void> {
      // Perform bulk operations without creating new transactions
      // Let calling code handle transaction management
      const collection = database.get(tableName);
      const operations = [];

      for (const data of dataArray) {
        const dbData = convertToDatabaseFormat(data, fieldMapping);
        try {
          // Try to find existing record
          const existing = await collection.find(data.id);
          operations.push(
            existing.prepareUpdate((rec: any) => {
              // First, clear all fields that should be undefined
              for (const [domainField, dbField] of Object.entries(fieldMapping)) {
                if (!data.hasOwnProperty(domainField) || data[domainField] === undefined) {
                  delete rec._raw[dbField];
                }
              }
              // Then assign the new data
              Object.assign(rec._raw, dbData);
            })
          );
        } catch (_error) {
          // Record doesn't exist, create new one
          operations.push(
            collection.prepareCreate((rec: any) => {
              rec._raw.id = data.id;
              Object.assign(rec._raw, dbData);
            })
          );
        }
      }

      // Use batch operation for efficiency
      // Assume we're already in a transaction context
      if (operations.length > 0) {
        await database.batch(...operations);
      }
    },

    async add(data: any): Promise<void> {
      // Collection wrappers are transaction-context aware - let calling code handle transactions
      const collection = database.get(tableName);
      const dbData = convertToDatabaseFormat(data, fieldMapping);

      // Create new record without checking for existence (pure add operation)
      await collection.create((rec: any) => {
        // Generate ID if not provided (WatermelonDB does this automatically)
        if (data.id) {
          rec._raw.id = data.id;
        }
        Object.assign(rec._raw, dbData);
      });
    },

    async update(id: string, data: any): Promise<void> {
      // Collection wrappers are transaction-context aware - let calling code handle transactions
      const collection = database.get(tableName);
      const dbData = convertToDatabaseFormat(data, fieldMapping);

      try {
        const existing = await collection.find(id);
        await existing.update((rec: any) => {
          // First, clear all fields that should be undefined
          for (const [domainField, dbField] of Object.entries(fieldMapping)) {
            if (!data.hasOwnProperty(domainField) || data[domainField] === undefined) {
              delete rec._raw[dbField];
            }
          }
          // Then assign the new data
          Object.assign(rec._raw, dbData);
        });
      } catch (_error) {
        // If find fails, look for the record by querying
        const records = await collection.query().fetch();
        const existing = records.find((r) => r.id === id);
        if (existing) {
          await existing.update((rec: any) => {
            for (const [domainField, dbField] of Object.entries(fieldMapping)) {
              if (!data.hasOwnProperty(domainField) || data[domainField] === undefined) {
                delete rec._raw[dbField];
              }
            }
            Object.assign(rec._raw, dbData);
          });
        }
      }
    },

    async count(): Promise<number> {
      const collection = database.get(tableName);
      const records = await collection.query().fetch();
      return records.filter((record) => record._raw._status !== 'deleted').length;
    },
  };
}

/**
 * Query builder for test collection wrappers
 */
class QueryBuilder {
  private whereClause: { field: string; value: any; operator: 'equals' | 'notEqual' } | null = null;

  constructor(
    private database: Database,
    private tableName: string,
    private fieldMapping: Record<string, string>,
    private field: string
  ) {}

  equals(value: any) {
    this.whereClause = { field: this.field, value, operator: 'equals' };
    return this;
  }

  notEqual(value: any) {
    this.whereClause = { field: this.field, value, operator: 'notEqual' };
    return this;
  }

  async toArray(): Promise<any[]> {
    const collection = this.database.get(this.tableName);
    let records = await collection.query().fetch();

    // Filter out deleted records
    records = records.filter((record) => record._raw._status !== 'deleted');

    // Apply where clause if present
    if (this.whereClause) {
      const dbField = this.fieldMapping[this.whereClause.field] || this.whereClause.field;
      records = records.filter((record) => {
        const fieldValue = (record._raw as any)[dbField];
        if (this.whereClause!.operator === 'equals') {
          return fieldValue === this.whereClause!.value;
        } else if (this.whereClause!.operator === 'notEqual') {
          return fieldValue !== this.whereClause!.value;
        }
        return true;
      });
    }

    const results = [];
    for (const record of records) {
      results.push(await convertToDomainFormat(record, this.fieldMapping));
    }
    return results;
  }

  async first(): Promise<any | undefined> {
    const results = await this.toArray();
    return results.length > 0 ? results[0] : undefined;
  }
}

/**
 * Converts domain format data to database format
 */
function convertToDatabaseFormat(data: any, fieldMapping: Record<string, string>): any {
  const dbData: any = {};
  for (const [domainField, dbField] of Object.entries(fieldMapping)) {
    // Only process fields that are explicitly defined (not undefined)
    if (data.hasOwnProperty(domainField) && data[domainField] !== undefined) {
      let value = data[domainField];
      // Handle null values - store them as null in the database
      if (value === null) {
        dbData[dbField] = null;
        continue;
      }
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
 * SIMPLIFIED FOR TESTING: Direct raw data mapping without complex parsing
 */
async function convertToDomainFormat(
  record: any,
  fieldMapping: Record<string, string>
): Promise<any> {
  // Fast path: Create domain data directly from raw data
  const domainData: any = { id: record.id };

  // Copy all raw fields directly, applying minimal transformations
  for (const [domainField, dbField] of Object.entries(fieldMapping)) {
    if (record._raw.hasOwnProperty(dbField)) {
      let value = (record._raw as any)[dbField];

      // Only handle essential transformations
      if (value === null && domainField !== 'cycleId' && domainField !== 'templateId') {
        continue; // Skip null values except for cycleId and templateId
      }

      if (value !== undefined) {
        // Only parse dates and JSON for critical fields
        if (
          domainField === 'createdAt' ||
          domainField === 'updatedAt' ||
          domainField === 'lastUsed' ||
          domainField === 'date' ||
          domainField === 'startTime' ||
          domainField === 'endTime'
        ) {
          value = typeof value === 'number' ? new Date(value) : value;
        } else if (
          typeof value === 'string' &&
          (domainField.includes('Ids') ||
            domainField.includes('Configuration') ||
            domainField === 'muscleActivation' ||
            domainField === 'repCategoryDistribution')
        ) {
          try {
            value = JSON.parse(value);
          } catch {
            if (domainField.includes('Ids')) value = [];
          }
        }
        domainData[domainField] = value;
      }
    }
  }

  // No virtual fields in test mode - data is pre-populated
  return domainData;
}

/**
 * Add virtual fields needed for aggregate compatibility
 * SIMPLIFIED FOR TESTING: Skip WatermelonDB relationship fetching to avoid hangs
 */
async function addVirtualFieldsToRecord(record: any, domainData: any): Promise<void> {
  // Skip virtual field population in test mode to avoid infinite loops
  // Virtual fields are already properly set in the test data setup

  // For test compatibility, ensure empty arrays exist for relationship fields
  const tableName = record.table.name;

  if (tableName === 'training_plans' && !domainData.sessionIds) {
    domainData.sessionIds = [];
  } else if (tableName === 'workout_sessions' && !domainData.groupIds) {
    domainData.groupIds = [];
  } else if (tableName === 'exercise_groups' && !domainData.appliedExerciseIds) {
    domainData.appliedExerciseIds = [];
  } else if (tableName === 'workout_logs' && !domainData.performedGroupIds) {
    domainData.performedGroupIds = [];
  } else if (tableName === 'performed_groups' && !domainData.performedExerciseLogIds) {
    domainData.performedExerciseLogIds = [];
  } else if (tableName === 'performed_exercise_logs' && !domainData.performedSetIds) {
    domainData.performedSetIds = [];
  }
}

/**
 * Cleans and seeds the test database with a standard set of data for a given profile.
 * Uses WatermelonDB's write API for batch operations and proper transaction handling.
 * @param database The WatermelonDB Database instance to seed.
 * @param profileId The profile ID to associate the seeded data with.
 */
export async function seedDatabaseWithSampleData(database: Database, profileId: string) {
  await database.write(async () => {
    // Clear all collections
    const collections = [
      database.get('exercises'),
      database.get('applied_exercises'),
      database.get('exercise_groups'),
      database.get('workout_sessions'),
      database.get('training_plans'),
    ];

    // Delete all existing records in relevant collections
    for (const collection of collections) {
      const records = await collection.query().fetch();
      for (const record of records) {
        await record.markAsDeleted();
      }
    }

    const fixtureIdToNewIdMap = new Map<string, string>();
    const now = Date.now();

    // Create exercises using WatermelonDB models
    const exercisesToCreate: any[] = [];
    for (const ex of sampleDataFixture.exercises) {
      const newId = generateId();
      fixtureIdToNewIdMap.set(ex.id!, newId);

      const exerciseData = {
        id: newId,
        profileId,
        name: ex.name,
        description: ex.description,
        category: ex.category,
        movementType: ex.movementType,
        movementPattern: ex.movementPattern,
        difficulty: ex.difficulty,
        equipment: ex.equipment,
        muscleActivation: ex.muscleActivation,
        counterType: ex.counterType,
        jointType: ex.jointType,
        notes: '',
        substitutions: [],
        createdAt: now,
        updatedAt: now,
      };
      exercisesToCreate.push(exerciseData);
    }

    // Batch create exercises
    await database.write(async () => {
      await database.batch(
        ...exercisesToCreate.map((data) =>
          database.get('exercises').prepareCreate((record: any) => {
            record._raw.id = data.id;
            record._raw.profile_id = data.profileId;
            record._raw.name = data.name;
            record._raw.description = data.description;
            record._raw.category = data.category;
            record._raw.movement_type = data.movementType;
            record._raw.movement_pattern = data.movementPattern;
            record._raw.difficulty = data.difficulty;
            record._raw.equipment = JSON.stringify(data.equipment);
            record._raw.muscle_activation = JSON.stringify(data.muscleActivation);
            record._raw.counter_type = data.counterType;
            record._raw.joint_type = data.jointType;
            record._raw.notes = data.notes;
            record._raw.substitutions = JSON.stringify(data.substitutions);
            record._raw.created_at = data.createdAt;
            record._raw.updated_at = data.updatedAt;
          })
        )
      );
    });

    // Create training plan first (parent)
    const planId = generateId();
    const planData = {
      id: planId,
      profileId,
      name: sampleDataFixture.trainingPlan.name,
      description: sampleDataFixture.trainingPlan.description || '',
      isArchived: false,
      currentSessionIndex: 0,
      notes: '',
      cycleId: '', // Optional field
      order: 0,
      lastUsed: now,
      createdAt: now,
      updatedAt: now,
    };

    await database.batch(
      database.get('training_plans').prepareCreate((record: any) => {
        record._raw.id = planData.id;
        record._raw.profile_id = planData.profileId;
        record._raw.name = planData.name;
        record._raw.description = planData.description;
        record._raw.is_archived = planData.isArchived;
        record._raw.current_session_index = planData.currentSessionIndex;
        record._raw.notes = planData.notes;
        record._raw.cycle_id = planData.cycleId;
        record._raw.order = planData.order;
        record._raw.last_used = planData.lastUsed;
        record._raw.created_at = planData.createdAt;
        record._raw.updated_at = planData.updatedAt;
      })
    );

    // Create workout sessions
    const sessionsToCreate: any[] = [];
    for (const s of sampleDataFixture.sessions) {
      const newId = generateId();
      fixtureIdToNewIdMap.set(s.id!, newId);

      const sessionData = {
        id: newId,
        profileId,
        trainingPlanId: planId,
        name: s.name,
        notes: '',
        executionCount: 0,
        isDeload: s.isDeload,
        dayOfWeek: s.dayOfWeek || '',
        createdAt: now,
        updatedAt: now,
      };
      sessionsToCreate.push(sessionData);
    }

    await database.batch(
      ...sessionsToCreate.map((data) =>
        database.get('workout_sessions').prepareCreate((record: any) => {
          record._raw.id = data.id;
          record._raw.profile_id = data.profileId;
          record._raw.training_plan_id = data.trainingPlanId;
          record._raw.name = data.name;
          record._raw.notes = data.notes;
          record._raw.execution_count = data.executionCount;
          record._raw.is_deload = data.isDeload;
          record._raw.day_of_week = data.dayOfWeek;
          record._raw.created_at = data.createdAt;
          record._raw.updated_at = data.updatedAt;
        })
      )
    );

    // Create exercise groups
    const groupsToCreate: any[] = [];
    for (const g of sampleDataFixture.groups) {
      const newId = generateId();
      fixtureIdToNewIdMap.set(g.id!, newId);

      // Find the session this group belongs to
      const sessionData = sampleDataFixture.sessions.find((s) => s.groupIds?.includes(g.id!));
      const sessionId = sessionData
        ? fixtureIdToNewIdMap.get(sessionData.id!)
        : sessionsToCreate[0]?.id;

      const groupData = {
        id: newId,
        profileId,
        workoutSessionId: sessionId!,
        type: g.type,
        rounds: g.rounds || { min: 1, direction: 'asc' },
        durationMinutes: g.durationMinutes || 0,
        restTimeSeconds: g.restTimeSeconds || 0,
        createdAt: now,
        updatedAt: now,
      };
      groupsToCreate.push(groupData);
    }

    await database.batch(
      ...groupsToCreate.map((data) =>
        database.get('exercise_groups').prepareCreate((record: any) => {
          record._raw.id = data.id;
          record._raw.profile_id = data.profileId;
          record._raw.workout_session_id = data.workoutSessionId;
          record._raw.type = data.type;
          record._raw.rounds = JSON.stringify(data.rounds);
          record._raw.duration_minutes = data.durationMinutes;
          record._raw.rest_time_seconds = data.restTimeSeconds;
          record._raw.created_at = data.createdAt;
          record._raw.updated_at = data.updatedAt;
        })
      )
    );

    // Create applied exercises
    const appliedExercisesToCreate: any[] = [];
    for (const ae of sampleDataFixture.appliedExercises) {
      const newId = generateId();
      fixtureIdToNewIdMap.set(ae.id!, newId);

      // Find the group this applied exercise belongs to
      const groupData = sampleDataFixture.groups.find((g) =>
        g.appliedExerciseIds?.includes(ae.id!)
      );
      const groupId = groupData ? fixtureIdToNewIdMap.get(groupData.id!) : groupsToCreate[0]?.id;

      const appliedExerciseData = {
        id: newId,
        profileId,
        exerciseGroupId: groupId!,
        exerciseId: fixtureIdToNewIdMap.get(ae.exerciseId!)!,
        templateId: ae.templateId || '',
        setConfiguration: ae.setConfiguration,
        restTimeSeconds: ae.restTimeSeconds || 0,
        executionCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      appliedExercisesToCreate.push(appliedExerciseData);
    }

    await database.batch(
      ...appliedExercisesToCreate.map((data) =>
        database.get('applied_exercises').prepareCreate((record: any) => {
          record._raw.id = data.id;
          record._raw.profile_id = data.profileId;
          record._raw.exercise_group_id = data.exerciseGroupId;
          record._raw.exercise_id = data.exerciseId;
          record._raw.template_id = data.templateId;
          record._raw.set_configuration = JSON.stringify(data.setConfiguration);
          record._raw.rest_time_seconds = data.restTimeSeconds;
          record._raw.execution_count = data.executionCount;
          record._raw.created_at = data.createdAt;
          record._raw.updated_at = data.updatedAt;
        })
      )
    );
  });
}
