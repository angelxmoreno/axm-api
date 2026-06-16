# AXM API Conventions

## Project Overview
AXM API is a reusable Hono + TypeORM template for building user-facing REST APIs with Bun. It is database-agnostic by design. The default database is MariaDB but swapping to any TypeORM-supported database requires changing one line in the data source config.

This file is the **source of truth for rules**. Do not deviate from it unless `spec.md` explicitly overrides a convention.

---

## Stack
- **Runtime:** Bun
- **Framework:** Hono
- **ORM:** TypeORM (no decorators — uses `EntitySchema`)
- **Language:** TypeScript (ESM)
- **Default DB:** MariaDB

---

## Tooling

The template ships with a strict dev tooling setup. All checks run automatically on `git commit` via `lefthook`.

| Tool | Role | Config | Run via |
|---|---|---|---|
| **Biome** | Linter + formatter (single tool, no ESLint/Prettier) | `biome.json` | `bun lint` / `bun lint:fix` |
| **TypeScript** | Type checker | `tsconfig.json` | `bun check:types` |
| **Fallow** | Dead code, dupes, health, audit | `.fallow/` | `bun check:dead-code` etc. |
| **commitlint** | Conventional commits | `.commitlintrc.json` | runs on commit-msg |
| **lefthook** | Git hooks runner | `lefthook.yml` | installs on `bun install` |

### Biome rules (enforced)
- Indent: 4 spaces
- Quotes: single
- Semicolons: always
- Trailing commas: ES5
- Line width: 120
- `noUnusedVariables: error`
- `useImportExtensions: off` (explicit override of recommended)
- Auto-organize imports on save
- No decorator parser — entities do not use decorators

### commitlint
- Extends `@commitlint/config-conventional`
- Commit format: `type(scope): subject`
- Examples: `feat(auth): add refresh token endpoint`, `fix(user): handle null email`

### Fallow commands
- `check:dead-code` — flags unused exports, unreachable code
- `check:dupes` — finds copy-pasted code blocks
- `check:health` — overall repo health score
- `check:audit` — dependency vulnerability scan
- First three run in pre-commit. `check:audit` is manual.

### lefthook
- Installs hooks on `bun install` (via `prepare` script)
- Pre-commit (parallel): `bun lint`, `bun check:types`, `bun check:dead-code`, `bun check:dupes`, `bun check:health`
- Pre-commit skips merge and rebase commits
- Commit-msg: `bunx commitlint --edit $1`

If a pre-commit check fails, the commit is blocked. Fix the issue.

---

## Folder Structure

```text
src/
  entities/        EntitySchema definitions, one per resource
  routes/          Hono route apps, one file per resource
  services/        Business logic classes, one file per resource
  middlewares/     Shared middleware (auth, error handling)
  errors/          Typed error classes, one per file
  data-source.ts   TypeORM DataSource singleton
  utils/           Pure factory functions (config, logger, container, etc.)
  index.ts         App entry point
project-docs/      Conventions, implementation, spec, downstream-facing docs
```

---

## File Naming
All files use **kebab-case** with a type suffix.

| Type | Pattern | Example |
|---|---|---|
| Entity | `{resource}.entity.ts` | `user.entity.ts` |
| Service | `{resource}.service.ts` | `user.service.ts` |
| Route | `{resource}.route.ts` | `user.route.ts` |
| Middleware | `{name}.middleware.ts` | `auth.middleware.ts` |
| Error | `{name}.error.ts` | `not-found.error.ts` |

---

## Entities

- One `EntitySchema` per file
- **No decorators.** Entities are plain TypeScript types defined alongside an `EntitySchema`.
- The schema object provides `id`, `createdAt`, `updatedAt` via composition with a shared `baseEntityFields` constant.
- Entity type names are PascalCase and singular (`User`, `Post`, `BlogPost`)
- Table names are snake_case and plural (`users`, `posts`, `blog_posts`)

```ts
// src/entities/user.entity.ts
import { EntitySchema } from 'typeorm'
import { baseEntityFields, type BaseEntity } from './base.entity'

export interface User extends BaseEntity {
  email: string
  passwordHash: string
}

export const UserEntity = new EntitySchema<User>({
  name: 'User',
  tableName: 'users',
  columns: {
    ...baseEntityFields,
    email: { type: 'varchar', unique: true },
    passwordHash: { type: 'varchar' },
  },
})
```

```ts
// src/entities/base.entity.ts
import type { EntitySchemaColumnOptions } from 'typeorm'

export interface BaseEntity {
  id: number
  createdAt: Date
  updatedAt: Date
}

export const baseEntityFields: Record<keyof BaseEntity, EntitySchemaColumnOptions> = {
  id: { type: 'int', primary: true, generated: true },
  createdAt: { type: 'timestamp', createDate: true },
  updatedAt: { type: 'timestamp', updateDate: true },
}
```

### Why no decorators
- Avoids `experimentalDecorators` / `emitDecoratorMetadata` TS config
- Avoids `reflect-metadata` runtime dep
- Works cleanly with current TS versions without decorator flavor mismatches
- Schema and type in one file, easy to grep

---

## Services

- One class per resource, named `{Resource}Service` in PascalCase
- TypeORM repositories are **injected via constructor** — services never import the data source directly
- All business logic lives here — routes never contain logic beyond calling a service method and returning a response
- Service methods are `async` and throw typed errors — they never return raw TypeORM errors to the caller
- Services are the only layer that talks to the database

```ts
// src/services/user.service.ts
export class UserService {
  constructor(private readonly userRepo: Repository<User>) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOneBy({ id })
    if (!user) throw new NotFoundError('User not found')
    return user
  }
}
```

---

## Factory Pattern

The template uses pure factory functions for cross-cutting infrastructure (config, logger, DI container). The pattern applies to anything in `src/utils/`.

### Shape

- **One factory per file**, exported with `export const create{Name}` or `export function create{Name}`.
- **Filename matches the export**: `create-config.ts` → `createConfig`, `create-logger.ts` → `createLogger`. No `index.ts` barrel re-exports.
- **Pure functions, no classes.** Factories take config, return a value or builder.
- **No `any` in the signature.** Inputs are typed (`AppConfig`, `CreateLoggerOptions`); outputs are typed (`Logger`, `Builder`).
- **Factories return the most abstract thing they can.** Return a `Builder` when callers need to add more registrations; return the constructed thing (`Logger`, `AppConfig`) otherwise.

### Zod is the source of truth

- Each factory owns a `z.object(...)` schema named `{Name}Schema`.
- Public types are derived: `export type {Name}Options = z.infer<typeof {Name}Schema>`.
- **Schema-first** — write the schema, then `z.infer` gives you the type. Do not hand-write `interface { ... }` for shapes that are also validated.
- Defaults live in the schema (`z.boolean().default(true)`), not in the factory body.

### Boundary transforms

Factories are the place where messy external input meets clean internal shape. Use Zod's `.transform()` to reshape:

- **Env vars** are flat strings keyed by `LOGGER_*` — the config factory transforms them to a nested `{ logger: { ... } }` so internal code never sees env-var spelling.
- The transformed shape is the public type. The pre-transform shape stays private to the factory.

### Error wrapping at untyped boundaries

`process.env` is `Record<string, string | undefined>` — untyped. Anything that comes from there must be parsed safely. The template ships a shared helper for this:

```ts
// src/utils/safe-zod-parser.ts
import type { ZodType } from 'zod';

export const safeZodParser = <T>(values: unknown, schema: ZodType<T>, action: string): T => {
    try {
        return schema.parse(values);
    } catch (error) {
        throw new Error(`${action}: Unable to parse schema`, { cause: error });
    }
};
```

**Use it at every untyped boundary** — env vars, third-party payloads, raw `request.json()` bodies. Do not call `.parse()` directly on unknown input; let `safeZodParser` wrap the `ZodError` in an `Error` with `cause`.

**At typed boundaries**, call `.parse()` directly. The input is already `z.infer<typeof Schema>`, so the schema is a defense-in-depth check, not the only check. (Some factories skip the redundant parse entirely — both are acceptable.)

The error message format is always **`{ActionLabel}: Unable to parse schema`**, where `{ActionLabel}` is a short noun phrase describing what was being created or validated (e.g. `'AppConfig'`, `'Creating Logger'`). Tests assert on this string and on `cause instanceof z.ZodError`.

### DI composition

Two layers, two responsibilities:

- **`createContainerBuilder`** (`src/utils/`) — project-agnostic builder. Registers the cross-cutting infrastructure (logger, future rate limiters, future health-check clients) that every project needs. Owned by the template; downstream users don't edit it.
- **`app.container.ts`** (`src/config/`) — project-specific wiring. Calls `createContainerBuilder`, adds the project's services (repos, third-party clients, custom services), calls `.build()`, exports the container. This is the file that grows as the project grows.

Registration pattern with `@novadi/core`:

```ts
builder.registerInstance(value).as<InterfaceName>('InterfaceName').singleInstance();
```

- The string `'InterfaceName'` must match between `as()` and the caller's `resolveType<InterfaceName>('InterfaceName')`. The string is the interface key — without it, registration uses a random internal key and resolution fails.
- Use `singleInstance()` for stateless infra (loggers, configs, clients). Use `instancePerRequest()` for request-scoped services.

### Tests

Every public factory has at least one test. Tests cover:

1. **Schema contract** — parse tests for valid inputs, reject tests for invalid ones, default values, transforms.
2. **Factory smoke** — call the factory with valid input, assert on the output shape (level of a logger, level of config, presence of a registration).
3. **Wiring factories** (`createContainerBuilder`) — assert the returned builder can be `.build()`-ed and resolves the registered services with the right shape and lifetime.

Do not mock pino, do not start the dev server. Unit-test the wiring; integration-test the runtime.

### Template vs Project layers

The template distinguishes two layers of config and DI wiring. This separation is what makes the template reusable across downstream projects.

**Template layer** — `src/utils/`

- Project-agnostic. Lives in the template, never edited by downstream users.
- Owns the **shape** of the world: which env vars exist, which logger transports are wired, which DI lifetime policies are applied.
- Each file is a pure factory: `createConfig`, `createLogger`, `createContainerBuilder`, `safeZodParser`.
- A downstream project consumes these factories; it does not modify them.
- New utilities (rate limiters, email senders, payment clients) added to the template belong here only if they are useful to every project. Otherwise they belong in the project layer.

**Project layer** — `src/config/`

- Project-specific. Edited freely by downstream users.
- Owns the **values** and **project-specific services**: which Stripe key, which OAuth providers, which feature flags, which repos the project actually uses.
- The convention is one file per concern:
  - `app.config.ts` — calls `createConfig(Bun.env)` once, exports a typed singleton. Add project-specific helpers next to it (e.g. `getStripeConfig(appConfig)`) when the config gets complex enough to need them.
  - `app.container.ts` — calls `createContainerBuilder(appConfig)`, registers every project-specific service (repos, third-party clients, custom services), then `.build()`s and exports the container.
- New project-specific config slots → extend `app.config.ts` (or add a sibling `{name}.config.ts`).
- New project-specific services → register them in `app.container.ts`.

**Why split:** the template's factories stay small and pure; the project's `app.config.ts` and `app.container.ts` grow as the project grows. Downstream users edit only the project layer. Template upgrades never conflict with project-specific code.

**Anti-pattern to avoid:** stuffing project-specific logic into `src/utils/`. The moment a util references a Stripe key, a project feature flag, or a project-specific env var, it has stopped being reusable. Move it to `src/config/`.

---

## Routes

- One Hono app instance per resource, exported as default
- Named `{resource}Routes` (camelCase)
- Mounted in `src/index.ts` under a versioned prefix (e.g. `/v1/users`)
- Route handlers are thin — one service call, one response
- Instantiate the service inside the route file, passing the TypeORM repository

```ts
// src/routes/user.route.ts
const userRoutes = new Hono()
const userService = new UserService(AppDataSource.getRepository(UserEntity))

userRoutes.get('/:id', async (c) => {
  const user = await userService.findById(Number(c.req.param('id')))
  return c.json(user)
})

export default userRoutes
```

```ts
// src/index.ts
app.route('/v1/users', userRoutes)
app.route('/v1/auth', authRoutes)
```

---

## Error Handling

- Error classes live in `src/errors/`, one per file, kebab-case + `.error.ts` suffix
- All errors extend a base `HttpError` class
- A global error handler middleware is registered in `src/index.ts`
- Services throw typed error classes (`NotFoundError`, `UnauthorizedError`, `ValidationError`, `ConflictError`)
- The error middleware maps error types to HTTP status codes
- Routes never contain try/catch — errors bubble up to the global handler

| File | Status |
|---|---|
| `http.error.ts` | base class |
| `not-found.error.ts` | 404 |
| `unauthorized.error.ts` | 401 |
| `validation.error.ts` | 400 |
| `conflict.error.ts` | 409 |

---

## Auth

- JWT-based, issued on login
- `auth.middleware.ts` verifies the token and attaches the user to context
- Protected routes use the auth middleware directly on the route or router — **not** globally on `/v1/*`
- Auth is designed to extend to OAuth providers without modifying the email/password flow
- Passwords are hashed with `bcrypt` — plain text passwords never touch the database

---

## What Claude Code Should Generate Per Resource

When given a `spec.md`, Claude Code generates the following per resource:

1. `src/entities/{resource}.entity.ts` (type + `EntitySchema`)
2. `src/services/{resource}.service.ts`
3. `src/routes/{resource}.route.ts`
4. Registers the route in `src/index.ts` under `/v1/{resource}`

Claude Code must follow all conventions in this file exactly. If a convention is ambiguous for a specific case, prefer the pattern that keeps routes thin and services fat.

---

## What Claude Code Must Never Do

- Use decorators on entities (`@Entity`, `@Column`, etc.)
- Put business logic in route handlers
- Import the data source directly inside a service
- Use `any` as a type
- Skip error handling in service methods
- Create files outside the defined folder structure
- Deviate from kebab-case file naming
- Bypass pre-commit hooks
- Call `z.parse()` directly on untyped input — use `safeZodParser` so the `ZodError` is wrapped with a clear action label
