# SECURITY_HEADERS Fix Plan

## Changes

- `apps/api/src/main.ts` — Import and apply `helmet()` middleware with Swagger UI resource exceptions.
- `apps/web/next.config.mjs` — Add `async headers()` returning:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - Baseline `Content-Security-Policy`

## New files

- None.

## Verification goals

- [x] Helmet middleware active in NestJS API.
- [x] Security headers returned on all Next.js web responses.
- [x] Swagger docs at `/api/docs` remain functional without CSP script blocking.

## Manual verification (for the human)

- Run `curl -sI http://localhost:4000/api/health` and verify presence of `x-content-type-options: nosniff` and `x-frame-options`.
- Run `curl -sI http://localhost:3000` and verify presence of `x-frame-options: DENY`.

