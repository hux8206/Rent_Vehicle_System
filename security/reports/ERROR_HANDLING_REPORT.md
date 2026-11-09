# ERROR_HANDLING Security Report

## Status: MEDIUM

## Findings

1. **Missing Global Exception Filter**:
   NestJS lacked a custom global exception filter. Unexpected database exceptions (such as Prisma constraint violations or connection drops) could leak table names, database column definitions, or internal query parameters to API clients.
2. **Swagger Documentation Exposure in Production**:
   Swagger UI was mounted at `/api/docs` unconditionally without checking `NODE_ENV` or an explicit toggle flag (`ENABLE_SWAGGER`).

## What's at risk

Information leakage gives attackers insights into database table structures, technology stack versions, and internal file paths, which can be leveraged in subsequent attacks.

## What's already secure

- NestJS `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`) rejects unknown fields with standardized 400 Bad Request responses.

## Recommendations

1. Implement `AllExceptionsFilter` to catch all unhandled exceptions, sanitizing client responses to generic error messages while logging full stack traces server-side.
2. Conditionally mount Swagger UI only in non-production environments or when `ENABLE_SWAGGER=true`.

