import type { Request } from 'express';
import type { Role, Uid } from '@gatekeep/shared';

export interface AuthenticatedUser {
  readonly uid: Uid;
  readonly roles: readonly Role[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/** Abstracts Firebase so guards can be tested without live tokens. */
export interface IdTokenVerifier {
  verify(idToken: string): Promise<AuthenticatedUser>;
}

export const ID_TOKEN_VERIFIER = Symbol('ID_TOKEN_VERIFIER');
