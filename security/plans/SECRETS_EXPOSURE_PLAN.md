# SECRETS_EXPOSURE Fix Plan

## Changes

- `docker-compose.yml` — Remove hardcoded PayOS and Cloudinary default values, using clean environment variable references `${VAR:-}` without sensitive defaults.

## New files

- None.

## Verification goals

- [x] No sensitive API keys or credentials remain as fallback strings in `docker-compose.yml`.
- [x] `git ls-files .env` returns nothing.
- [x] `grep -rnE "(sk_live|sk_test|AKIA)"` across all source files returns nothing.
- [x] `.env.example` contains placeholder values only.

## Manual verification (for the human)

- Rotate PayOS API keys at https://my.payos.vn and Cloudinary API secret at https://console.cloudinary.com.

