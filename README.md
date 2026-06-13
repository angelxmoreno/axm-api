# axm-api

Hono + TypeORM template for building user-facing REST APIs with Bun. Database-agnostic. MariaDB default.

---

## Stack

- **Runtime:** Bun
- **Framework:** Hono
- **ORM:** TypeORM
- **Language:** TypeScript
- **Default DB:** MariaDB (swap via data source config)

---

## Tooling

| Tool | Purpose |
|---|---|
| **Biome** | Linter + formatter (replaces ESLint + Prettier) |
| **commitlint** | Enforce conventional commit messages |
| **lefthook** | Git hooks runner (pre-commit, commit-msg) |
| **fallow** | Code health checks (dead code, dupes, health, audit) |

All run on `bun install` (via `prepare` script) and `git commit` (via lefthook).

---

## Folder Structure

```text
src/
  entities/        TypeORM EntitySchema definitions (no-decorator)
  routes/          Hono route apps, one file per resource
  services/        Business logic classes, one file per resource
  middlewares/     Shared middleware (auth, error handling)
  errors/          Typed error classes, one per file
  data-source.ts   TypeORM DataSource singleton
  index.ts         App entry point
```

---

## Quick Start

```bash
bun install
cp .env.example .env
bun dev
```

The server reads its config from environment variables (see below). `src/index.ts` wires the config and starts the HTTP server. `bun dev` runs with hot reload.

---

## Scripts

| Script | What it does |
|---|---|
| `bun dev` | Run with hot reload |
| `bun build` | Bundle to `dist/` |
| `bun start` | Run the bundle |
| `bun test` | Run tests |
| `bun lint` | Biome check |
| `bun lint:fix` | Biome check + autofix |
| `bun check` | Run all pre-commit checks (lint, types, dead-code, dupes, health) |
| `bun check:types` | TypeScript type check |
| `bun check:dead-code` | Fallow dead code scan |
| `bun check:dupes` | Fallow duplicate code scan |
| `bun check:health` | Fallow health report |
| `bun check:audit` | Fallow audit report |

Pre-commit hook runs `lint`, `check:types`, `check:dead-code`, `check:dupes`, `check:health` in parallel.
Commit-msg hook runs `commitlint` against conventional commit rules.

---

## Environment Variables

All variables are read by `createConfig(Bun.env)` in `src/utils/create-config.ts`. The schema lives there; the table below reflects the current contract.

| Var | Required | Default | Type | Notes |
|---|---|---|---|---|
| `APP_NAME` | yes | — | string | Service name. Used in logs, Sentry tags, Loki labels. |
| `NODE_ENV` | yes | — | enum | `development` \| `production` \| `test`. Gates Sentry init. |
| `SENTRY_DSN` | no | — | URL or empty | Sentry DSN. Empty disables Sentry. |
| `HTTP_HOSTNAME` | no | `localhost` | string | Server bind hostname. |
| `HTTP_PORT` | no | `3001` | number | Server bind port. Env-string coerced. |
| `LOGGER_USE_PRETTY` | yes | — | bool-string | `true`/`false`/`1`/`0`/`yes`/`no`/... See [z.stringbool()](https://zod.dev/v4). |
| `LOGGER_LEVEL` | yes | — | enum | `silent` \| `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace`. |
| `LOGGER_LOKI_URL` | no | — | URL or empty | Loki push endpoint. Empty disables Loki transport. |

**Env-string booleans:** `LOGGER_USE_PRETTY` accepts the truthy set `true | 1 | yes | on | y | enabled` (case-insensitive) and the falsy set `false | 0 | no | off | n | disabled`. Anything else throws at startup.

**Empty URLs:** `SENTRY_DSN` and `LOGGER_LOKI_URL` treat an empty string the same as unset. Don't use `unset` as a value — just leave the line empty in `.env`.

---

## Adding a Resource

1. Fill in `project-docs/spec.md` (use `spec-builder-prompt.md` to interview)
2. Claude Code generates the three files per `project-docs/conventions.md` and `project-docs/PROJECT_INSTRUCTIONS.md`
3. Register the new route in `src/index.ts` under `/v1/{resource}`

See `project-docs/` for full rules.
