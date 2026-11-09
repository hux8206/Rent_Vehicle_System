# PAYMENT_WEBHOOKS Fix Plan

## Changes

- `apps/api/src/modules/payments/payments.service.ts` — Throw `BadRequestException('Chữ ký không hợp lệ')` when webhook signature verification fails so HTTP 400 is returned.

## New files

- None.

## Verification goals

- [x] Webhook signature verification mandatory on every callback.
- [x] Invalid or tampered signature payloads rejected with HTTP 400.
- [x] Processed transactions are idempotent and never double-credited.

## Manual verification (for the human)

- Send a fake `POST /api/webhooks/payment` request with an arbitrary signature: verify response is 400 Bad Request.

