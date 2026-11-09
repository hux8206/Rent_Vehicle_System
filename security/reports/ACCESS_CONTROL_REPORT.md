# ACCESS_CONTROL Security Report

## Status: PASS

## Findings

1. **Ownership checks across resources**:
   - `Booking`: `findOne` and `cancelBooking` check `booking.customerId === customerId` and throw `ForbiddenException(403)`.
   - `Store`: `assertOwnership` checks `store.partnerId === partnerId` and throws `ForbiddenException(403)`.
   - `VehicleModel` and `VehicleItem`: `assertStoreOwnership` checks that the associated store belongs to the authenticated partner.
   - `Payment Link`: `getBookingPaymentLink` checks `payment.booking.customerId === customerId`. (Previously returned 400 instead of 403 HTTP status code).

2. **Cross-Tenant Isolation**:
   - Partners can only query and manipulate bookings and vehicles belonging to their own registered stores (`partnerId`).
   - Customers cannot view or cancel bookings created by other customers.

## What's at risk

Without strict ownership checks, an attacker could manipulate sequential integer IDs (`/bookings/1`, `/bookings/2`) to view other customers' booking contracts or partner store settings (IDOR).

## What's already secure

- Ownership assertions are implemented at the service layer on every read, update, and delete operation.
- Multi-tenancy boundaries between Admin, Partner, and Customer are strictly enforced.

## Recommendations

1. Standardize the HTTP response to `ForbiddenException` (403) across all ownership check failures (such as in `getBookingPaymentLink`).

