# CSRF Fix Plan

## Changes

- None required.

## New files

- None.

## Verification goals

- [x] All authentication endpoints and strategies rely strictly on `Authorization: Bearer` headers.
- [x] No state mutations occur on `GET` routes.

## Manual verification (for the human)

- None required.

