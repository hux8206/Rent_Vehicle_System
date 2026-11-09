# SECURITY_HEADERS Security Report

## Status: HIGH

## Findings

1. **Missing Security Headers in Backend API (`apps/api`)**:
   `helmet` was not configured in `apps/api/src/main.ts`. API responses lacked `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and MIME-sniffing protection.

2. **Missing Security Headers in Frontend Web (`apps/web`)**:
   `apps/web/next.config.mjs` lacked a `headers()` definition. Key defensive headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy`) were not returned with HTML documents.

## What's at risk

- **Clickjacking**: Without `X-Frame-Options: DENY` or `frame-ancestors 'none'`, malicious websites can iframe the rental platform to trick users into unauthorized booking or state changes.
- **MIME-Sniffing**: Without `X-Content-Type-Options: nosniff`, browsers may treat uploaded image files as executable scripts (XSS).
- **Protocol Downgrade**: Without HSTS (`Strict-Transport-Security`), connections can be intercepted and downgraded to unencrypted HTTP.

## What's already secure

- Next.js and NestJS produce standard HTTP/1.1 and HTTP/2 compliant headers.

## Recommendations

1. Integrate `helmet` into `apps/api/src/main.ts` with Swagger documentation compatibility.
2. Define a complete security headers block in `apps/web/next.config.mjs` including CSP, HSTS, frame options, and referrer policy.

