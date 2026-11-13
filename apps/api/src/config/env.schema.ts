import { z } from 'zod';

/**
 * Single source of truth for environment variables. The app refuses to boot
 * if anything is missing or malformed. Secrets are optional in dev/test only.
 */
const secret = z.string().min(1);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: secret.optional(),
    PAYMONGO_SECRET_KEY: secret.optional(),
    PAYMONGO_WEBHOOK_SECRET: secret.optional(),
    FIREBASE_PROJECT_ID: secret.optional(),
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
