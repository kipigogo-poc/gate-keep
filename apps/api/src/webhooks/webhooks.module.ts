import { Module } from '@nestjs/common';
import { PAYMENT_EVENT_HANDLER, PaymentEventsService } from './payment-events.handler.js';
import { PaymongoSignatureGuard } from './paymongo-signature.guard.js';
import { PaymongoWebhookController } from './paymongo-webhook.controller.js';
import { WebhookIdempotencyService } from './webhook-idempotency.service.js';

@Module({
  controllers: [PaymongoWebhookController],
  providers: [
    PaymongoSignatureGuard,
    WebhookIdempotencyService,
    { provide: PAYMENT_EVENT_HANDLER, useClass: PaymentEventsService },
  ],
})
export class WebhooksModule {}
