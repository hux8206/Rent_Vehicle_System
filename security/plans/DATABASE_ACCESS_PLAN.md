# DATABASE_ACCESS Fix Plan

## Changes

- `docker-compose.yml` — Bind MySQL port strictly to `127.0.0.1:3306:3306` so the database is inaccessible from external network interfaces.

## New files

- None.

## Verification goals

- [x] MySQL port binding is restricted to `127.0.0.1:3306:3306`.
- [x] External internet traffic cannot reach MySQL directly without SSH tunnel or host access.
- [x] Internal docker network allows API container to reach `mysql:3306`.

## Manual verification (for the human)

- When deploying to production cloud VPS, use security groups / UFW to block external access to port 3306.

