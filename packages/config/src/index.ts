import { z } from 'zod';

export const AppEnvironmentSchema = z.enum(['development', 'test', 'staging', 'production']);
export type AppEnvironment = z.infer<typeof AppEnvironmentSchema>;

export const ApiEnvSchema = z.object({
  NODE_ENV: AppEnvironmentSchema.default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  OWNER_BOOTSTRAP_EMAIL: z.string().email().optional(),
  OWNER_BOOTSTRAP_TOKEN: z.string().optional(),
});
export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return ApiEnvSchema.parse(env);
}

export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
