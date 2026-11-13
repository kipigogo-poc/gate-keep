import { z } from 'zod';

/**
 * Single source of truth for environment variables. The app refuses to boot
 * if anything is missing or malformed. Secrets are optional in dev/test only.
 */
const secret = z.string().min(1);
/** Blank lines in .env (`KEY=`) mean "not set", not "invalid". */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
    UPSTASH_REDIS_REST_URL: optional(z.string().url()),
    UPSTASH_REDIS_REST_TOKEN: optional(secret),
    PAYMONGO_SECRET_KEY: optional(secret),
    PAYMONGO_WEBHOOK_SECRET: optional(secret),
    FIREBASE_PROJECT_ID: optional(secret),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    const required = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'PAYMONGO_SECRET_KEY',
      'PAYMONGO_WEBHOOK_SECRET',
      'FIREBASE_PROJECT_ID',
    ] as const;
    for (const key of required) {
      if (!env[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'required in production' });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${detail}`);
  }
  return parsed.data;
}
