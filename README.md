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
npm test
```

## Acceptance tests (TDD)

| ID    | Scenario                                   | Status  |
|-------|--------------------------------------------|---------|
| TC-01 | Scanned codes older than 15 s rejected     | pending |
| TC-02 | Offline TOTP generation                    | pending |
| TC-03 | 50 concurrent seat locks → 1×200, 49×409   | passing |
| TC-04 | Forged webhook HMAC → 401                  | passing |
| TC-05 | Per-verified-phone ticket limit            | pending |
| TC-06 | Google ↔ Discord account linking           | pending |
