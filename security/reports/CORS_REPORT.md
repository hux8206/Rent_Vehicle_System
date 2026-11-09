# CORS Security Report

## Status: PASS

## Findings

1. **Origin Whitelist**:
   `app.enableCors()` in `apps/api/src/main.ts` explicitly restricts allowed origins to `['http://localhost:3000', 'http://127.0.0.1:3000']`.
2. **No Wildcard with Credentials**:
   `origin: '*'` is NOT used.
3. **No Reflection**:
   The `Origin` request header is not echoed dynamically.

## What's at risk

Overly permissive CORS policies (such as `origin: '*'`) with `credentials: true` allow malicious domains to read sensitive user data and transaction details via cross-origin fetch requests.

## What's already secure

- Explicit allowlist prevents unauthorized external origins from reading API responses.

## Recommendations

- Support dynamic addition of `FRONTEND_URL` environment variable for production deployments while maintaining explicit domain checking.

