# PASSWORD_HASHING Security Report

## Status: PASS

## Findings

1. **Hashing Algorithm**:
   Passwords across all user roles (Admin, Partner, Customer) and the Partner Level-2 Owner Password use `bcrypt` (`bcryptjs`) with a salt work factor of `10`.
2. **Comparison Safety**:
   Verification exclusively uses `bcrypt.compare()` which mitigates timing attack vulnerabilities.
3. **Audit for Weak Hashing**:
   No usages of MD5, SHA-1, plain SHA-256, or unsalted hashing algorithms exist in the codebase.

## What's at risk

Weak hashing algorithms (e.g. unsalted SHA-256 or MD5) can be cracked in minutes using rainbow tables or commodity GPU rigs if a database breach occurs. `bcrypt` with cost 10 provides robust brute-force protection.

## What's already secure

- Strong `bcrypt` hashing is applied uniformly across user registration and password updates.
- Passwords are never stored or logged in plain text.

## Recommendations

- Continue enforcing `bcrypt` with cost >= 10. Consider Argon2id if higher memory-hardness is desired in future major architectural updates.

