# RATE_LIMITING Fix Plan

## Changes

- `apps/api/src/app.module.ts` — Import `ThrottlerModule` and provide global `ThrottlerGuard` with baseline limits (60 reqs / min).
- `apps/api/src/auth/auth.controller.ts` — Decorate `login` with strict throttle limits (10 attempts / min).
- `apps/api/src/stores/stores.controller.ts` — Decorate `verifyOwnerPassword` with strict throttle limits (10 attempts / min).

## New files

- None.

## Verification goals

- [x] Global throttler active via `APP_GUARD`.
- [x] Exceeding rate limit triggers HTTP 429 Too Many Requests.
- [x] `POST /api/auth/login` throttles after 10 requests within 60 seconds.

## Manual verification (for the human)

- Fire 15 consecutive requests to `POST /api/auth/login` and verify that the 11th request returns 429 Too Many Requests.

