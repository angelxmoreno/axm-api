# PROJECT_INSTRUCTIONS.md

Instructions shipped to downstream users of the template. Tells them what exists, what rules to follow, and what tooling enforces the rules.

---

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

## Tooling

The template ships with a strict dev tooling setup. All checks run automatically on `git commit`.

| Tool | Role | Config | When it runs |
|---|---|---|---|
| **Biome** | Linter + formatter | `biome.json` | pre-commit (`bun lint`) |
| **TypeScript** | Type checker | `tsconfig.json` | pre-commit (`bun check:types`) |
| **Fallow** | Dead code, dupes, health, audit | `.fallow/` | pre-commit (3 of 4 checks) |
| **commitlint** | Conventional commits | `.commitlintrc.json` | commit-msg |
| **lefthook** | Git hooks runner | `lefthook.yml` | orchestrator |

### Biome
- Indent: 4 spaces
- Quotes: single
- Semicolons: always
- Trailing commas: ES5
- Line width: 120
- Auto-organizes imports on save
- Run `bun lint:fix` to autofix

### commitlint
- Extends `@commitlint/config-conventional`
- Commit messages must follow conventional format: `type(scope): subject`
- Examples: `feat(auth): add refresh token endpoint`, `fix(user): handle null email`

### Fallow
- `check:dead-code` — flags unused exports, unreachable code
- `check:dupes` — finds copy-pasted code blocks
- `check:health` — overall repo health score
- `check:audit` — dependency vulnerability scan
- Not run in CI by default; available via `bun check:audit` etc.

### lefthook
- Installs hooks on `bun install` (via `prepare` script)
- Pre-commit: lint, types, dead-code, dupes, health (parallel)
- Commit-msg: commitlint
- Skips merge and rebase commits

If a pre-commit check fails, the commit is blocked. Fix the issue or run `git commit --no-verify` to bypass (not recommended).

---

## What Already Exists in This Template
Do not regenerate or modify these unless explicitly asked:

### Entities
- `src/entities/base.entity.ts` — provides `id`, `createdAt`, `updatedAt` as a shared schema fields constant
- `src/entities/user.entity.ts` — `User` type + `UserEntity` `EntitySchema`

### Services
- `src/services/auth.service.ts` — register, login, JWT issue/verify, password hashing

### Routes
- `src/routes/auth.route.ts` — `POST /v1/auth/register`, `POST /v1/auth/login`

### Middlewares
- `src/middlewares/auth.middleware.ts` — JWT verification, attaches user to context
- `src/middlewares/error.middleware.ts` — global error handler, maps error classes to HTTP status codes

### Errors
- `src/errors/http.error.ts` — base class
- `src/errors/not-found.error.ts` → 404
- `src/errors/unauthorized.error.ts` → 401
- `src/errors/validation.error.ts` → 400
- `src/errors/conflict.error.ts` → 409

### Entry Point
- `src/index.ts` — Hono app instance, global middleware registered, auth routes mounted

---

## Your Job
From `spec.md`, generate the following for each resource:

1. `src/entities/{resource}.entity.ts` — type + `EntitySchema`
2. `src/services/{resource}.service.ts`
3. `src/routes/{resource}.route.ts`
4. Register the new route in `src/index.ts` under `/v1/{resource}`

---

## Rules
- Follow `conventions.md` exactly
- **No decorators on entities** — use TypeORM `EntitySchema` (see `conventions.md` Entities section)
- Routes must be thin — one service call, one response
- Services must be fat — all logic lives here
- Never use `any` as a type
- Never put business logic in route handlers
- Never import the data source directly inside a service
- Never create files outside the defined folder structure
- Never skip error handling in service methods
