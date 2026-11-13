import { Module } from '@nestjs/common';
import { CLOCK, type Clock } from '../common/clock.js';
import { AdmissionsService } from './admissions.service.js';
import { ScanController } from './scan.controller.js';
import { ScanService } from './scan.service.js';
import { TICKET_SECRETS, UnconfiguredTicketSecrets } from './ticket-secrets.repository.js';

@Module({
  controllers: [ScanController],
  providers: [
    ScanService,
    AdmissionsService,
    { provide: TICKET_SECRETS, useClass: UnconfiguredTicketSecrets },
    { provide: CLOCK, useValue: (() => Date.now()) satisfies Clock },
  ],
})
export class ScanModule {}
