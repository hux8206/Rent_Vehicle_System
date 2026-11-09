# ACCESS_CONTROL Fix Plan

## Changes

- `apps/api/src/modules/payments/payments.service.ts` — Import `ForbiddenException` and throw 403 instead of 400 when a user tries to access a payment link for a booking they do not own.

## New files

- None.

## Verification goals

- [x] Every route with a resource ID parameter checks `current_user.id == resource.owner_id`.
- [x] Failing the ownership check consistently returns HTTP 403 Forbidden.

## Manual verification (for the human)

- Attempt to fetch `/api/customer/payments/booking/:id/qr` using Customer B's token for Customer A's booking: verify response is 403 Forbidden.

