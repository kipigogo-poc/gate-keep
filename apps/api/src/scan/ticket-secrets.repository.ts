import { Injectable, Logger } from '@nestjs/common';

/** Where per-ticket TOTP seeds live. Backed by Firestore once ticket issuance exists. */
export interface TicketSecretsRepository {
  findSeed(ticketId: string): Promise<Uint8Array<ArrayBuffer> | null>;
}

export const TICKET_SECRETS = Symbol('TICKET_SECRETS');

/** Placeholder until tickets are issued: every ticket is unknown, so every scan is rejected. */
@Injectable()
export class UnconfiguredTicketSecrets implements TicketSecretsRepository {
  private readonly logger = new Logger(UnconfiguredTicketSecrets.name);

  async findSeed(): Promise<null> {
    this.logger.warn('Ticket secrets store not configured; rejecting scan');
    return null;
  }
}
