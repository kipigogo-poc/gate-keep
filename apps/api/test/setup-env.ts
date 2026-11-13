import { existsSync } from 'node:fs';

// Integration tests talk to real Upstash; load local creds if present.
if (existsSync('.env')) process.loadEnvFile('.env');
