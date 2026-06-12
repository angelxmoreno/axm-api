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
cp .env.example .env   # fill in DB + JWT_SECRET
bun dev
```

After the build is complete (see `project-docs/implementation.md` step 12), the server starts on `PORT` (default 3000) and exposes `GET /health` returning `{ status: 'ok' }`. Until then, `src/index.ts` is a stub.

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
| `bun check:types` | TypeScript type check |
| `bun check:dead-code` | Fallow dead code scan |
| `bun check:dupes` | Fallow duplicate code scan |
| `bun check:health` | Fallow health report |
| `bun check:audit` | Fallow audit report |

Pre-commit hook runs `lint`, `check:types`, `check:dead-code`, `check:dupes`, `check:health` in parallel.
Commit-msg hook runs `commitlint` against conventional commit rules.

---

## Environment Variables

| Var | Required | Default | Notes |
|---|---|---|---|
| `DB_HOST` | yes | — | MariaDB host |
| `DB_PORT` | yes | — | MariaDB port |
| `DB_USER` | yes | — | DB user |
| `DB_PASS` | yes | — | DB password |
| `DB_NAME` | yes | — | DB name |
| `JWT_SECRET` | yes | — | Sign/verify tokens |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `PORT` | no | `3000` | HTTP port |

---

## Adding a Resource

1. Fill in `project-docs/spec.md` (use `spec-builder-prompt.md` to interview)
2. Claude Code generates the three files per `project-docs/conventions.md` and `project-docs/PROJECT_INSTRUCTIONS.md`
3. Register the new route in `src/index.ts` under `/v1/{resource}`

See `project-docs/` for full rules.
