import { Injectable, Logger } from '@nestjs/common';
import type { PaymongoEvent } from './paymongo-event.schema.js';

export interface PaymentEventHandler {
  handle(event: PaymongoEvent): Promise<void>;
}

export const PAYMENT_EVENT_HANDLER = Symbol('PAYMENT_EVENT_HANDLER');

/**
 * Receives verified, de-duplicated events. Ticket issuance (Firestore write,
 * per-phone limit, lock release) lands here once a Firebase project exists.
 */
@Injectable()
export class PaymentEventsService implements PaymentEventHandler {
  private readonly logger = new Logger(PaymentEventsService.name);

  async handle(event: PaymongoEvent): Promise<void> {
    this.logger.log(`Verified PayMongo event ${event.data.id} (${event.data.attributes.type})`);
  }
}
