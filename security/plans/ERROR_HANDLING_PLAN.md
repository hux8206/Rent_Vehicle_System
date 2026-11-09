# ERROR_HANDLING Fix Plan

## Changes

- `apps/api/src/common/filters/all-exceptions.filter.ts` — Create a global exception filter that intercepts all HTTP and system exceptions, masks internal error messages in production, and logs full traces via NestJS `Logger`.
- `apps/api/src/main.ts` —
  1. Register `app.useGlobalFilters(new AllExceptionsFilter());`.
  2. Conditionally initialize Swagger documentation when `process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true'`.

## New files

- `apps/api/src/common/filters/all-exceptions.filter.ts`

## Verification goals

- [x] Unhandled 500 errors never leak stack traces or internal SQL queries to the client.
- [x] Full error details are captured in server-side logs.
- [x] Swagger docs can be disabled in production.

## Manual verification (for the human)

- Simulate an unexpected internal error: verify response returns `{ statusCode: 500, message: "Lỗi hệ thống nội bộ..." }` with no stack traces.

