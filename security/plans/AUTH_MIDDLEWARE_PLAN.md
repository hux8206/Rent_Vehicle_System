# AUTH_MIDDLEWARE Fix Plan

## Changes

- `apps/api/src/auth/roles.guard.ts` — Import `UnauthorizedException` and throw 401 when `user` is missing or undefined before reading `user.role`.

## New files

- None.

## Verification goals

- [x] Every route requiring authentication returns 401 when unauthenticated.
- [x] Non-admin requests to admin routes return 403.
- [x] `RolesGuard` never throws 500 TypeError when `user` is missing.

## Manual verification (for the human)

- Test requesting `/api/admin/users` without Authorization header: must return 401.
- Test requesting `/api/admin/users` with Customer token: must return 403.

