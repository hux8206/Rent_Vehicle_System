# RATE_LIMITING Security Report

## Status: HIGH

## Findings

1. **No Rate Limiting on Authentication Endpoints**:
   `POST /api/auth/login`, `POST /api/auth/register/customer`, and `POST /api/auth/register/partner` had no rate limiting. An attacker could automate thousands of login attempts per second to brute force passwords.
2. **No Rate Limiting on Level-2 Security Password**:
   `POST /api/partner/stores/security/verify-owner-password` (Owner Portal unlock) had no brute-force throttling.

## What's at risk

- **Credential Stuffing & Brute Force**: Attackers can spray common password dictionaries against user accounts without triggering account locks or 429 Too Many Requests responses.
- **Resource Exhaustion (DoS)**: High-frequency unauthenticated registration requests could flood the database with spam users and partner wallets.

## What's already secure

- Passwords use bcrypt hashing with salt rounds = 10, which provides CPU-intensive cryptographic work factor.

## Recommendations

1. Install and register `@nestjs/throttler` globally in `AppModule`.
2. Apply `@Throttle({ default: { limit: 10, ttl: 60000 } })` to `POST /api/auth/login` and sensitive password verification endpoints.

