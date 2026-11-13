import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema.js';

/** Typed wrapper — the only place the API reads environment variables. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }
  get port(): number {
    return this.config.get('PORT', { infer: true });
  }
  get corsOrigin(): string {
    return this.config.get('CORS_ORIGIN', { infer: true });
  }
  get paymongoWebhookSecret(): string | undefined {
    return this.config.get('PAYMONGO_WEBHOOK_SECRET', { infer: true });
  }
  get redis(): { url: string | undefined; token: string | undefined } {
    return {
      url: this.config.get('UPSTASH_REDIS_REST_URL', { infer: true }),
      token: this.config.get('UPSTASH_REDIS_REST_TOKEN', { infer: true }),
    };
  }
}
