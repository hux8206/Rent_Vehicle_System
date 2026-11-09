# FRONTEND_SECRETS Fix Plan

## Changes

- `apps/web/next.config.mjs` — Add `productionBrowserSourceMaps: false` to guarantee source maps are omitted in production builds.

## New files

- None.

## Verification goals

- [x] No secret keys present in any frontend component.
- [x] `productionBrowserSourceMaps: false` explicitly declared in `next.config.mjs`.

## Manual verification (for the human)

- In production build, navigate to `/static/chunks/...js.map` to confirm 404 response.

