import { appSchema, tableSchema } from '@nozbe/watermelondb';

// WatermelonDB schema definition for Blueprint Fitness application
const schema = appSchema({
  version: 4,
  tables: [
    // Profile and user-related tables
    tableSchema({
      name: 'profiles',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'user_settings',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'theme_mode', type: 'string' },
        { name: 'primary_color', type: 'string' },
        { name: 'secondary_color', type: 'string' },
        { name: 'unit_system', type: 'string' },
        { name: 'bmi_formula', type: 'string' },
        { name: 'active_training_plan_id', type: 'string', isOptional: true },
        { name: 'auto_start_rest_timer', type: 'boolean' },
        { name: 'auto_start_short_rest_timer', type: 'boolean' },
        { name: 'lift_mappings', type: 'string' }, // JSON
        { name: 'dashboard_layout', type: 'string' }, // JSON array
        { name: 'dashboard_visibility', type: 'string' }, // JSON object
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'user_details',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'full_name', type: 'string', isOptional: true },
        { name: 'biological_sex', type: 'string', isOptional: true },
        { name: 'date_of_birth', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'custom_themes',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'mode', type: 'string' },
        { name: 'primary_color', type: 'string' },
        { name: 'secondary_color', type: 'string' },
      ],
    }),

    // Exercise-related tables
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'movement_type', type: 'string' },
        { name: 'movement_pattern', type: 'string', isOptional: true },
        { name: 'difficulty', type: 'string' },
        { name: 'equipment', type: 'string' }, // JSON array
        { name: 'muscle_activation', type: 'string' }, // JSON object
        { name: 'counter_type', type: 'string' },
        { name: 'joint_type', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'substitutions', type: 'string' }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'exercise_templates',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'set_configuration', type: 'string' }, // JSON object
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Training plan related tables
    tableSchema({
      name: 'training_cycles',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'start_date', type: 'number' },
        { name: 'end_date', type: 'number' },
        { name: 'goal', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'training_plans',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_archived', type: 'boolean' },
        { name: 'current_session_index', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'cycle_id', type: 'string', isOptional: true },
        { name: 'order', type: 'number', isOptional: true },
        { name: 'last_used', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'training_plan_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'execution_count', type: 'number' },
        { name: 'is_deload', type: 'boolean' },
        { name: 'day_of_week', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'exercise_groups',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'workout_session_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'rounds', type: 'string', isOptional: true }, // JSON object for min/max
        { name: 'duration_minutes', type: 'number', isOptional: true },
        { name: 'rest_time_seconds', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'applied_exercises',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'exercise_group_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'template_id', type: 'string', isOptional: true },
        { name: 'set_configuration', type: 'string' }, // JSON object
        { name: 'rest_time_seconds', type: 'number', isOptional: true },
        { name: 'execution_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Workout log related tables
    tableSchema({
      name: 'workout_logs',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'training_plan_id', type: 'string', isOptional: true },
        { name: 'training_plan_name', type: 'string' },
        { name: 'session_id', type: 'string', isOptional: true },
        { name: 'session_name', type: 'string' },
        { name: 'start_time', type: 'number', isIndexed: true },
        { name: 'end_time', type: 'number', isOptional: true, isIndexed: true },
        { name: 'duration_seconds', type: 'number', isOptional: true },
        { name: 'total_volume', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'user_rating', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'performed_groups',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'workout_log_id', type: 'string', isIndexed: true },
        { name: 'planned_group_id', type: 'string', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'actual_rest_seconds', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'performed_exercise_logs',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'performed_group_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'planned_exercise_id', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_skipped', type: 'boolean' },
        { name: 'exercise_name', type: 'string' },
        { name: 'exercise_category', type: 'string' },
        { name: 'muscle_activation', type: 'string' }, // JSON object
        { name: 'total_sets', type: 'number', isOptional: true },
        { name: 'total_counts', type: 'number', isOptional: true },
        { name: 'total_volume', type: 'number', isOptional: true },
        { name: 'rep_category_distribution', type: 'string', isOptional: true }, // JSON object
        { name: 'comparison_trend', type: 'string', isOptional: true },
        { name: 'comparison_sets_change', type: 'number', isOptional: true },
        { name: 'comparison_counts_change', type: 'number', isOptional: true },
        { name: 'comparison_volume_change', type: 'number', isOptional: true },
        { name: 'comparison_volume', type: 'number', isOptional: true },
        { name: 'comparison_avg_weight', type: 'number', isOptional: true },
        { name: 'comparison_max_weight', type: 'number', isOptional: true },
        { name: 'comparison_total_reps', type: 'number', isOptional: true },
        { name: 'rpe_effort', type: 'string', isOptional: true },
        { name: 'estimated_1rm', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'performed_sets',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'performed_exercise_log_id', type: 'string', isIndexed: true },
        { name: 'counter_type', type: 'string' },
        { name: 'counts', type: 'number' },
        { name: 'weight', type: 'number', isOptional: true },
        { name: 'completed', type: 'boolean' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'percentage', type: 'number', isOptional: true },
        { name: 'planned_load', type: 'string', isOptional: true }, // JSON object
        { name: 'planned_rpe', type: 'string', isOptional: true }, // JSON object
        { name: 'planned_counts', type: 'string', isOptional: true }, // JSON object
        // Sub-set tracking fields (v3 schema additions)
        { name: 'sub_sets', type: 'string', isOptional: true }, // JSON array of sub-sets
        { name: 'execution_type', type: 'string', isOptional: true }, // execution type enum
        { name: 'is_sub_set_completed', type: 'string', isOptional: true }, // JSON array of booleans
      ],
    }),

    // Body metrics tables
    tableSchema({
      name: 'weight_records',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number' },
        { name: 'weight', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'height_records',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Max log table
    tableSchema({
      name: 'max_logs',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'weight_entered_by_user', type: 'number' },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'reps', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'estimated_1rm', type: 'number' },
        { name: 'max_brzycki', type: 'number', isOptional: true },
        { name: 'max_baechle', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Workout state table
    tableSchema({
      name: 'workout_states',
      columns: [
        { name: 'profile_id', type: 'string', isIndexed: true },
        { name: 'state', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;
