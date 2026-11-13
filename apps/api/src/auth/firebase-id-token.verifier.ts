import { Injectable } from '@nestjs/common';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AppConfigService } from '../config/app-config.service.js';
import type { Role } from '@gatekeep/shared';
import type { AuthenticatedUser, IdTokenVerifier } from './auth.types.js';

const KNOWN_ROLES: ReadonlySet<string> = new Set<Role>(['door_staff', 'organizer']);

function rolesFromClaim(claim: unknown): Role[] {
  return Array.isArray(claim) ? claim.filter((r): r is Role => typeof r === 'string' && KNOWN_ROLES.has(r)) : [];
}

@Injectable()
export class FirebaseIdTokenVerifier implements IdTokenVerifier {
  private app: App | undefined;

  constructor(private readonly config: AppConfigService) {}

  async verify(idToken: string): Promise<AuthenticatedUser> {
    const decoded = await getAuth(this.firebaseApp()).verifyIdToken(idToken);
    // Roles are Firebase custom claims, set only by the Admin SDK.
    return { uid: decoded.uid, roles: rolesFromClaim(decoded['gk_roles']) };
  }

  private firebaseApp(): App {
    if (this.app) return this.app;
    const projectId = this.config.firebaseProjectId;
    if (!projectId) throw new Error('FIREBASE_PROJECT_ID must be set to verify ID tokens');
    // On Cloud Run, credentials come from the service account (ADC).
    this.app = getApps()[0] ?? initializeApp({ projectId });
    return this.app;
  }
}
