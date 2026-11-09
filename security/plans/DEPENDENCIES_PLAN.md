# DEPENDENCIES Fix Plan

## Changes

- Review and document migration path from `xlsx` to `exceljs` for safe bulk vehicle imports.
- Maintain committed `package-lock.json` lockfiles for reproducible builds.

## New files

- None.

## Verification goals

- [x] Lockfiles committed and consistent across monorepo.
- [x] No suspicious packages from unverified registries.

## Manual verification (for the human)

- Periodically run `npm audit` and update security patches.

