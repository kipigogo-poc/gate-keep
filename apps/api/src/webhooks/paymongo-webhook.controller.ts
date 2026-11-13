import { BadRequestException, Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { paymongoEventSchema } from './paymongo-event.schema.js';
import { PAYMENT_EVENT_HANDLER, type PaymentEventHandler } from './payment-events.handler.js';
import { PaymongoSignatureGuard } from './paymongo-signature.guard.js';
import { WebhookIdempotencyService } from './webhook-idempotency.service.js';

export interface WebhookAckDto {
  readonly received: true;
  readonly duplicate: boolean;
}

@Controller('webhooks/paymongo')
export class PaymongoWebhookController {
  constructor(
    private readonly idempotency: WebhookIdempotencyService,
    @Inject(PAYMENT_EVENT_HANDLER) private readonly handler: PaymentEventHandler,
  ) {}

  @Post()
  @HttpCode(200)
  @UseGuards(PaymongoSignatureGuard)
  async receive(@Body() body: unknown): Promise<WebhookAckDto> {
    const parsed = paymongoEventSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Unrecognised event payload');
    const event = parsed.data;

    if (!(await this.idempotency.claim(event.data.id))) {
      return { received: true, duplicate: true };
    }
    try {
      await this.handler.handle(event);
    } catch (err) {
      await this.idempotency.release(event.data.id);
      throw err;
    }
    return { received: true, duplicate: false };
  }
}
