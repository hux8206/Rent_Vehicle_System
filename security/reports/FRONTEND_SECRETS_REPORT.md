# FRONTEND_SECRETS Security Report

## Status: PASS

## Findings

1. **Client-side Environment Variables**:
   Only `NEXT_PUBLIC_API_URL` is exposed via `NEXT_PUBLIC_` prefix, containing only the API endpoint URL (`http://localhost:4000/api`).

2. **Third-party Credentials**:
   Cloudinary and Cloudflare R2 secrets (`CLOUDINARY_API_SECRET`, `R2_SECRET_ACCESS_KEY`) are accessed strictly inside server-side route handlers (`apps/web/src/app/api/upload/route.ts`). None of them are prefixed with `NEXT_PUBLIC_` or bundled into client javascript files.

3. **Source Maps**:
   `productionBrowserSourceMaps` is disabled by default in Next.js.

## What's at risk

Leaking server secrets to frontend bundles would allow any user inspecting browser network traffic or source bundles to extract administrative credentials.

## What's already secure

- No secret tokens, database credentials, or private keys exist in any client component.
- All payment operations are handled by server-generated VietQR payment links.

## Recommendations

1. Explicitly set `productionBrowserSourceMaps: false` in `apps/web/next.config.mjs` to formally ensure production builds never emit public `.js.map` files.

