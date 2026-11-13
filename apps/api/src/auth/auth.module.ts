import { Global, Module } from '@nestjs/common';
import { ID_TOKEN_VERIFIER } from './auth.types.js';
import { FirebaseAuthGuard } from './firebase-auth.guard.js';
import { FirebaseIdTokenVerifier } from './firebase-id-token.verifier.js';

@Global()
@Module({
  providers: [{ provide: ID_TOKEN_VERIFIER, useClass: FirebaseIdTokenVerifier }, FirebaseAuthGuard],
  exports: [ID_TOKEN_VERIFIER, FirebaseAuthGuard],
})
export class AuthModule {}
