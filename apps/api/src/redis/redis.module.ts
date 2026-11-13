import { Global, Module } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { AppConfigService } from '../config/app-config.service.js';
import { REDIS } from './redis.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Redis => {
        const { url, token } = config.redis;
        if (!url || !token) {
          throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
        }
        // Raw values only: lock holders are plain uid strings, never JSON.
        return new Redis({ url, token, automaticDeserialization: false });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
