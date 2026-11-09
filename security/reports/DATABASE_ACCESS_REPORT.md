# DATABASE_ACCESS Security Report

## Status: HIGH

## Findings

1. **MySQL Port 3306 Exposed Globally with Empty Password in `docker-compose.yml`**:
   In `docker-compose.yml`:
   ```yaml
   mysql:
     environment:
       MYSQL_ROOT_PASSWORD: ''
       MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
     ports:
       - '3306:3306'
   ```
   Binding `3306:3306` binds to `0.0.0.0:3306` by default in Docker. If run on a server with a public IP, the database is exposed to the internet with no authentication required.

2. **Backend Database Architecture**:
   - The database is MySQL 8, managed exclusively by Prisma ORM inside the NestJS API.
   - The frontend (`apps/web`) has zero direct database client connections.
   - All client queries go through REST endpoints protected by NestJS guards.

## What's at risk

If a user or team member deploys this docker configuration to an unfirewalled VPS, automated port scanners could connect directly to MySQL on port 3306 as `root` without a password, dumping or dropping all customer and booking records.

## What's already secure

- Prisma Client is used exclusively server-side in `apps/api`. No database connection strings or credentials are ever provided to client bundles.
- No direct database access or client-side queries exist.

## Recommendations

1. Change MySQL port binding in `docker-compose.yml` to loopback only: `127.0.0.1:3306:3306`, preventing external network access.
2. Allow configuring a secure `MYSQL_ROOT_PASSWORD` via environment variable rather than hardcoding empty passwords.

