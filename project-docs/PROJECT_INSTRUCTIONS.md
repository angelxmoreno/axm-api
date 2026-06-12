# PROJECT_INSTRUCTIONS.md

## What is AXM API
AXM API is a Hono + TypeORM template for building user-facing REST APIs with Bun.
It is database-agnostic. The default database is MariaDB.

This file tells you what already exists in the template so you never regenerate it,
and where to find the rules you must follow.

---

## Before You Write Any Code
1. Read `conventions.md` completely before generating anything
2. Read `spec.md` to understand what this project needs
3. Never deviate from `conventions.md` unless `spec.md` explicitly overrides a convention

---

## What Already Exists in This Template
Do not regenerate or modify these unless explicitly asked:

### Entities
- `src/entities/base.entity.ts` — provides `id`, `createdAt`, `updatedAt` for all entities
- `src/entities/user.entity.ts` — email, passwordHash, timestamps

### Services
- `src/services/auth.service.ts` — register, login, JWT issue/verify, password hashing

### Routes
- `src/routes/auth.route.ts` — `POST /v1/auth/register`, `POST /v1/auth/login`

### Middlewares
- `src/middlewares/auth.middleware.ts` — JWT verification, attaches user to context
- `src/middlewares/error.middleware.ts` — global error handler, maps error classes to HTTP status codes

### Entry Point
- `index.ts` — Hono app instance, global middleware registered, auth routes mounted

---

## Your Job
From `spec.md`, generate the following for each resource:

1. `src/entities/{resource}.entity.ts`
2. `src/services/{resource}.service.ts`
3. `src/routes/{resource}.route.ts`
4. Register the new route in `index.ts` under `/v1/{resource}`

---

## Rules
- Follow `conventions.md` exactly
- Routes must be thin — one service call, one response
- Services must be fat — all logic lives here
- Never use `any` as a type
- Never put business logic in route handlers
- Never import the data source directly inside a service
- Never create files outside the defined folder structure
- Never skip error handling in service methods
