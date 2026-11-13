import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { LocksModule } from './locks/locks.module.js';
import { RedisModule } from './redis/redis.module.js';
import { ScanModule } from './scan/scan.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';

/** Feature modules (tickets) are added here as they land. */
@Module({ imports: [AppConfigModule, RedisModule, AuthModule, HealthModule, LocksModule, WebhooksModule, ScanModule] })
export class AppModule {}
