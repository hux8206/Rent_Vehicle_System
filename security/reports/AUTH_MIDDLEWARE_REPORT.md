# AUTH_MIDDLEWARE Security Report

## Status: MEDIUM

## Findings

1. **Unchecked `user` reference in `RolesGuard`**:
   In `apps/api/src/auth/roles.guard.ts` (lines 16-17):
   ```ts
   const { user } = context.switchToHttp().getRequest();
   if (!requiredRoles.includes(user.role)) {
   ```
   If a handler applies `RolesGuard` without `JwtAuthGuard` or if `user` is not populated on `request`, referencing `user.role` throws `TypeError: Cannot read properties of undefined (reading 'role')`. This results in a `500 Internal Server Error` instead of a standardized `401 Unauthorized` response.

2. **Route Authorization Coverage**:
   - All state-changing Admin routes (`/api/admin/*`) require `JwtAuthGuard` and role 0.
   - All Partner routes (`/api/partner/*`) require `JwtAuthGuard` and role 1.
   - All Customer booking routes (`/api/customer/bookings/*`, `/api/customer/payments/*`) require `JwtAuthGuard` and role 2.
   - Public routes (`/api/auth/*`, `/api/customer/stores`, `/api/customer/vehicles/*`, `/api/webhooks/payment`) are appropriately unauthenticated.

## What's at risk

An unauthenticated request to an endpoint with missing/misordered guards could trigger a 500 uncaught exception, leaking stack traces and server internals.

## What's already secure

- All controllers have explicit `@UseGuards(JwtAuthGuard, RolesGuard)` and role decorators at the class level.
- JWT strategy verifies user existence and active status in the database on every authenticated request.

## Recommendations

1. Add explicit null check for `user` in `RolesGuard` to throw `UnauthorizedException` (401) before checking `user.role`.

