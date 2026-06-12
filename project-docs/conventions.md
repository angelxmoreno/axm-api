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
