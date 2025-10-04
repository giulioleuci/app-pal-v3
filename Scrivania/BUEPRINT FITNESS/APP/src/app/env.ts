import { z } from 'zod';

/**
 * Defines the schema for environment variables.
 * This is the single source of truth for all environment-based configuration.
 */
const envSchema = z.object({
  VITE_APP_TITLE: z.string().min(1, 'VITE_APP_TITLE is required.'),
  VITE_DATA_VERSION: z.coerce.number().int().positive(),
  VITE_PAGINATION_LIMIT: z.coerce.number().int().positive(),
  VITE_DEFAULT_THEME_MODE: z.enum(['light', 'dark']),
  VITE_DEFAULT_PRIMARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  VITE_DEFAULT_SECONDARY_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  VITE_DEFAULT_UNIT_SYSTEM: z.enum(['metric']),
  VITE_DEFAULT_REST_SECONDS: z.coerce.number().int().positive(),
  VITE_FEATURE_TRAINING_CYCLES_ENABLED: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true'),
});

/**
 * Parses and validates the environment variables from `import.meta.env`.
 */
const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables.');
}

/**
 * A type-safe object containing the validated and transformed environment variables.
 * Use this object throughout the application instead of `import.meta.env`.
 */
export const env = parsedEnv.data;
