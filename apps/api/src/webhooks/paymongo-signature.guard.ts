import { Injectable, Logger, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WEBHOOK_TOLERANCE_SECONDS } from '@gatekeep/shared';
import { AppConfigService } from '../config/app-config.service.js';
import { verifyPaymongoSignature } from './paymongo-signature.js';

/** Drops any webhook whose HMAC over the exact received bytes does not match. Fails closed. */
@Injectable()
export class PaymongoSignatureGuard implements CanActivate {
  private readonly logger = new Logger(PaymongoSignatureGuard.name);

  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const secret = this.config.paymongoWebhookSecret;
    if (!secret) {
      this.logger.error('PAYMONGO_WEBHOOK_SECRET is not set; rejecting webhook');
      throw new UnauthorizedException();
    }
    if (!req.rawBody) {
      this.logger.error('rawBody unavailable; is the app created with { rawBody: true }?');
      throw new UnauthorizedException();
    }

    const verdict = verifyPaymongoSignature({
      header: req.header('paymongo-signature'),
      rawBody: req.rawBody,
      secret,
      livemode: this.config.paymongoLivemode,
      nowSeconds: Math.floor(Date.now() / 1000),
      toleranceSeconds: WEBHOOK_TOLERANCE_SECONDS,
    });
    if (verdict !== 'valid') {
      this.logger.warn(`Rejected PayMongo webhook: ${verdict}`);
      throw new UnauthorizedException();
    }
    return true;
  }
}
