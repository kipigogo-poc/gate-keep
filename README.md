# GateKeep — by MIAU Solutions

Zero-scalper ticketing for the Philippine market: interactive SVG seat maps,
Redis seat micro-locks, PayMongo (GCash / Maya / QR Ph) checkout, and an
offline TOTP wallet pass.

## Layout

```
packages/shared   DTOs + business-rule constants shared by API and PWA
apps/api          NestJS (Cloud Run) — locks, webhooks, ticket issuance, scan validation
apps/web          React PWA (Firebase Hosting) — types/ constants/ services/ hooks/ utils/ components/
firestore.rules   Client writes denied; tickets readable only by owner_uid
```

## Getting started

```bash
nvm use            # Node 22
npm install
cp apps/api/.env.example apps/api/.env
npm run dev:api    # http://localhost:8080/health
npm run dev:web    # http://localhost:5173
                   #   /wallet/demo  offline pass (dev only)
                   #   /gate         door-staff scanner
npm test
```

## Acceptance tests (TDD)

| ID    | Scenario                                   | Status  |
|-------|--------------------------------------------|---------|
| TC-01 | Scanned codes older than 15 s rejected     | passing |
| TC-02 | Offline TOTP generation                    | passing |
| TC-03 | 50 concurrent seat locks → 1×200, 49×409   | passing |
| TC-04 | Forged webhook HMAC → 401                  | passing |
| TC-05 | Per-verified-phone ticket limit            | pending |
| TC-06 | Google ↔ Discord account linking           | pending |

TC-01 note: a code for time-step *c* is accepted while the server clock is in
`[c·15 − 2 s, (c+1)·15 + 2 s)`. The 2 s margins absorb scan latency and small
phone-clock drift; a screenshot is dead at most 17 s after it first appeared.
Tune `SCAN_GRACE_SECONDS` / `SCAN_FUTURE_SKEW_SECONDS` in `packages/shared/src/rules.ts`.
