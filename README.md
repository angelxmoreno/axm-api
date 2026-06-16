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
| `bun review` | AI code review of unstaged working-tree changes (via `diffscope`) |
| `bun review:staged` | AI review of staged changes |
| `bun review:last-commit` | AI review of the last commit (`HEAD~1..HEAD`) |
| `bun review:branch` | AI review of the branch diff (`main...HEAD`, or `BASE=develop bun review:branch`) |

Pre-commit hook runs `lint`, `check:types`, `check:dead-code`, `check:dupes`, `check:health` in parallel.
Commit-msg hook runs `commitlint` against conventional commit rules.

### Review scripts

The `review*` scripts shell out to [diffscopeplus](https://github.com/angelxmoreno/diffscopeplus),
a global CLI installed on the developer's machine. `diffscopeplus` reads
`.diffscope.yml` (model, base URL, tuning) and pipes the requested git diff
into `diffscope review`.

**One-time install per developer:**

```bash
git clone https://github.com/angelxmoreno/diffscopeplus.git
cd diffscopeplus
bun install
bun run build
cp dist/diffscopeplus /usr/local/bin/   # or anywhere on PATH
```

Or follow the install instructions in the [diffscopeplus README](https://github.com/angelxmoreno/diffscopeplus).

**Usage:**

- `BASE=develop bun review:branch` — review against a non-default base.
- `bun review -- --strictness 3` — pass extra flags through to diffscope.

**Requires `.diffscope.yml` in the repo root** (or a parent directory).
`diffscopeplus` fails fast with a clear error if the file is missing or
the `model:` field is absent.

**Why the wrapper exists:** diffscope 0.5.28 has a bug where the top-level
`model:` field in `.diffscope.yml` is silently ignored — diffscope hard-codes
the primary review model to `claude-*` and only honors `model_weak`,
`model_fast`, `model_reasoning`, `model_embedding`. `diffscopeplus` works
around this by reading `model:` and forwarding it as `--model` on the CLI,
which diffscope does honor. See the [diffscopeplus repo](https://github.com/angelxmoreno/diffscopeplus)
for full details.

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
