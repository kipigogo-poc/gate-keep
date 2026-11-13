import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ID_TOKEN_VERIFIER, type AuthenticatedRequest, type IdTokenVerifier } from './auth.types.js';

const BEARER = /^Bearer ([A-Za-z0-9._-]+)$/;

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject(ID_TOKEN_VERIFIER) private readonly verifier: IdTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = BEARER.exec(req.headers.authorization ?? '');
    if (!match?.[1]) throw new UnauthorizedException('Missing bearer token');
    try {
      req.user = await this.verifier.verify(match[1]);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}
