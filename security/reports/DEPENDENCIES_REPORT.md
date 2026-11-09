# DEPENDENCIES Security Report

## Status: MEDIUM

## Findings

1. **Dependency Integrity & Lockfiles**:
   - `package-lock.json` files are present and committed.
   - All third-party packages are sourced from the official npm registry (`registry.npmjs.org`) with proven reputations.
2. **Audit Advisories (`npm audit`)**:
   - `xlsx` (`^0.18.5`): SheetJS has known Prototype Pollution / ReDoS advisories.
   - Various transitive devDependencies in `@nestjs/cli` and `postcss` reported moderate advisories.
3. **Version Pinning**:
   Dependencies currently use caret (`^`) prefixes rather than strict version pinning.

## What's at risk

Unpinned dependencies or unmaintained packages with known CVEs (like legacy `xlsx`) can introduce supply chain risks or denial of service vectors if malicious input is parsed.

## What's already secure

- Lockfile integrity guarantees deterministic installs across developer workstations and Docker containers.
- Core packages are actively maintained LTS releases (Node 20, Next.js 14, NestJS 10).

## Recommendations

1. Sanitize or validate imported Excel files before parsing with `xlsx`, or evaluate migrating to a modern, actively maintained library such as `exceljs`.
2. Regularly execute `npm audit` and keep lockfiles updated.

