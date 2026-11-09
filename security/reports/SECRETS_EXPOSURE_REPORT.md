# SECRETS_EXPOSURE Security Report

## Status: HIGH

## Findings

1. **Hardcoded Fallback Credentials in `docker-compose.yml`**:
   In `docker-compose.yml` (lines 39-44 and 58-60), live test credentials for PayOS and Cloudinary were embedded as parameter fallbacks:
   ```yaml
   PAYOS_CLIENT_ID: ${PAYOS_CLIENT_ID:-[REDACTED_CLIENT_ID]}
   PAYOS_API_KEY: ${PAYOS_API_KEY:-[REDACTED_API_KEY]}
   PAYOS_CHECKSUM_KEY: ${PAYOS_CHECKSUM_KEY:-[REDACTED_CHECKSUM_KEY]}
   CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME:-[REDACTED_CLOUD_NAME]}
   CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY:-[REDACTED_API_KEY]}
   CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET:-[REDACTED_API_SECRET]}
   ```
   If `docker-compose.yml` is pushed to a public or team repository, anyone can extract and use these PayOS and Cloudinary credentials.

2. **Source Code Check**:
   No hardcoded credentials found in NestJS or Next.js source code files (`apps/api/src`, `apps/web/src`).

3. **Git Tracking Check**:
   - `git ls-files .env` returns empty.
   - `.env` and `.env.local` are correctly ignored by `.gitignore`.
   - `.env.example` templates exist in root, `apps/api/`, and `apps/web/`.

## What's at risk

An attacker or collaborator with repository read access could hijack the PayOS payment gateway channel or abuse the Cloudinary bucket quota to upload malicious payloads.

## What's already secure

- `.gitignore` properly excludes `.env*` files (except `.env.example`).
- No database passwords or private API keys are embedded in application source code.
- JWT secret is loaded dynamically via `ConfigService`.

## Recommendations

1. Remove hardcoded fallback secrets from `docker-compose.yml` and let them read strictly from environment or `.env`.
2. Rotate the exposed PayOS and Cloudinary keys on their respective developer consoles.

