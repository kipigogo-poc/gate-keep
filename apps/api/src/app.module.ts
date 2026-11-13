import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';

/** Feature modules (locks, webhooks, tickets, scan) are added here as they land. */
@Module({ imports: [AppConfigModule, HealthModule] })
export class AppModule {}
