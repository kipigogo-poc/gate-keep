import { ForbiddenException, Injectable, SetMetadata, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@gatekeep/shared';
import type { AuthenticatedRequest } from './auth.types.js';

const ROLES_KEY = 'gk:roles';

/** Use after FirebaseAuthGuard: `@UseGuards(FirebaseAuthGuard, RolesGuard) @RequireRole('door_staff')`. */
export const RequireRole = (...roles: Role[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user?.roles.some((r) => required.includes(r))) throw new ForbiddenException();
    return true;
  }
}
