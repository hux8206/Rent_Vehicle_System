# CORS Fix Plan

## Changes

- `apps/api/src/main.ts` — Parse `process.env.FRONTEND_URL` into the allowed origins list alongside `localhost:3000` and `127.0.0.1:3000`.

## New files

- None.

## Verification goals

- [x] CORS origin remains an explicit allowlist.
- [x] Wildcard origin is never used.

## Manual verification (for the human)

- Test requesting `/api/health` with `Origin: http://evil.com`: verify `Access-Control-Allow-Origin` is omitted.

