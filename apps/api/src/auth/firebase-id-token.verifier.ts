import { Injectable } from '@nestjs/common';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AppConfigService } from '../config/app-config.service.js';
import type { AuthenticatedUser, IdTokenVerifier } from './auth.types.js';

@Injectable()
export class FirebaseIdTokenVerifier implements IdTokenVerifier {
  private app: App | undefined;

  constructor(private readonly config: AppConfigService) {}

  async verify(idToken: string): Promise<AuthenticatedUser> {
    const decoded = await getAuth(this.firebaseApp()).verifyIdToken(idToken);
    return { uid: decoded.uid };
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
