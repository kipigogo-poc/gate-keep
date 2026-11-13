import { Inject, Injectable } from '@nestjs/common';
import { decodeQrPayload, importTotpKey, type ScanResponseDto, type Uid } from '@gatekeep/shared';
import { CLOCK, type Clock } from '../common/clock.js';
import { AdmissionsService } from './admissions.service.js';
import { judgeCode } from './scan-verdict.js';
import { TICKET_SECRETS, type TicketSecretsRepository } from './ticket-secrets.repository.js';

@Injectable()
export class ScanService {
  constructor(
    @Inject(TICKET_SECRETS) private readonly secrets: TicketSecretsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly admissions: AdmissionsService,
  ) {}

  async scan(payload: string, gateUid: Uid): Promise<ScanResponseDto> {
    const nowMs = this.clock(); // read once, before any I/O, so lookup latency can't age the code
    const decoded = decodeQrPayload(payload);
    if (!decoded) return { verdict: 'REJECT_INVALID' };

    const seed = await this.secrets.findSeed(decoded.ticketId);
    if (!seed) return { verdict: 'REJECT_INVALID' };

    const verdict = await judgeCode(await importTotpKey(seed), decoded.code, nowMs);
    if (verdict === 'EXPIRED') return { verdict: 'REJECT_EXPIRED' };
    if (verdict === 'INVALID') return { verdict: 'REJECT_INVALID' };

    return (await this.admissions.admitOnce(decoded.ticketId, gateUid))
      ? { verdict: 'ADMIT' }
      : { verdict: 'REJECT_REUSED' };
  }
}
