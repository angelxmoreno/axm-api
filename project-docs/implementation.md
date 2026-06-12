# Implementation

Internal build steps for AXM API template. Follow in order. Terse on purpose.

---

## Goal
Scaffold the template so a downstream dev can `bun install`, set `.env`, run `bun dev`, and get a working auth-protected REST API skeleton.

---

## Key Architecture Decision: No Decorators

TypeORM entities use **`EntitySchema`** instead of class decorators. This means:
- No `@Entity`, `@Column`, `@PrimaryGeneratedColumn` etc.
- No `reflect-metadata` runtime dep
- No `experimentalDecorators` / `emitDecoratorMetadata` in `tsconfig.json`
- No `unsafeParameterDecoratorsEnabled` in `biome.json`
- Type and schema defined together in each entity file

See `conventions.md` Entities section for the pattern.

---

## Tooling Setup (do this first)

The template ships with strict dev tooling. Configure all of it before writing any code.

### Biome
- [ ] `biome.json` at root
- [ ] Indent 4 spaces, single quotes, semicolons, trailing commas ES5, line width 120
- [ ] `useIgnoreFile: true` (respects .gitignore)
- [ ] `noUnusedVariables: error`
- [ ] `useImportExtensions: off` (override of recommended)
- [ ] `assist.actions.source.organizeImports: on`
- [ ] **No decorator parser** — entities use `EntitySchema`, not decorators

### commitlint
- [ ] `.commitlintrc.json` at root
- [ ] Extends `@commitlint/config-conventional`

### lefthook
- [ ] `lefthook.yml` at root
- [ ] Pre-commit (parallel): `bun lint`, `bun check:types`, `bun check:dead-code`, `bun check:dupes`, `bun check:health`
- [ ] Pre-commit skips merge + rebase commits
- [ ] Commit-msg: `bunx commitlint --edit $1`

### Fallow
- [ ] `.fallow/` cache dir gitignored
- [ ] Scripts wired: `check:dead-code`, `check:dupes`, `check:health`, `check:audit`

### package.json
- [ ] `prepare: lefthook install` (auto-installs hooks on `bun install`)
- [ ] Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `test`, `test:watch`, `test:coverage`, `check:types`, `check:dead-code`, `check:dupes`, `check:health`, `check:audit`
- [ ] `module: src/index.ts`
- [ ] `type: module` (ESM)

### .gitignore
- [ ] `node_modules/`, `.env`, `.env.local`, `.env.*.local`
- [ ] `dist/`, `build/`, `.next/`
- [ ] `.idea/`, `.vscode/`, `*.swp`, `*.swo`, `.DS_Store`
- [ ] `coverage/`, `.turbo/`
- [ ] `.fallow/`
- [ ] Lockfile (`bun.lock`) is **committed** — text format, reproducible builds

---

## Order of Operations

### 1. Project init
- [ ] `bun init` (accept defaults, TS)
- [ ] Confirm `package.json` exists, `bun.lock` (text) appears after first install
- [ ] Create folder structure per `conventions.md`:
  - `src/entities/`
  - `src/services/`
  - `src/routes/`
  - `src/middlewares/`
  - `src/errors/`

### 2. Install deps
- [ ] Runtime: `hono`, `typeorm`, `jsonwebtoken`, `bcrypt`, `dotenv`
- [ ] **No `reflect-metadata`** — entities use `EntitySchema`, no decorator metadata needed
- [ ] Dev: `typescript`, `@types/jsonwebtoken`, `@types/bcrypt`, `bun-types`
- [ ] DB driver: `mysql2` (MariaDB default; swap later if needed)
- [ ] Verify `package.json` scripts: `dev`, `build`, `start`

### 3. Config files
- [ ] `tsconfig.json` — `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `types: ["bun"]`. **No decorator flags.**
- [ ] `.env.example` — DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, JWT_EXPIRES_IN, PORT
- [ ] `.env` — copy from `.env.example`, fill real values (gitignored)
- [ ] `.gitignore` — node_modules, .env, dist, src/**/*.js

### 4. Data source
- [ ] `src/data-source.ts` — TypeORM `DataSource` instance, env-driven config, `entities: [UserEntity, ...]` (explicit array, not glob — EntitySchema is named exports)
- [ ] Export `AppDataSource` as singleton
- [ ] Initialize connection before Hono starts in `src/index.ts`

### 5. Base entity
- [ ] `src/entities/base.entity.ts`
  - Export `BaseEntity` interface: `id: number`, `createdAt: Date`, `updatedAt: Date`
  - Export `baseEntityFields` constant: `Record<keyof BaseEntity, EntitySchemaColumnOptions>` with column defs
  - Used by other entities via spread: `columns: { ...baseEntityFields, ... }`
  - No decorators, no class

### 6. Error classes
- [ ] `src/errors/` folder, one class per file
  - `http.error.ts` — base class, `statusCode`, `message`, extends `Error`
  - `not-found.error.ts` → 404
  - `unauthorized.error.ts` → 401
  - `validation.error.ts` → 400
  - `conflict.error.ts` → 409
- [ ] File naming: kebab-case + `.error.ts` suffix
- [ ] Each class exports named export, extends `HttpError`

### 7. User entity
- [ ] `src/entities/user.entity.ts`
  - Export `User` interface extending `BaseEntity`
  - Export `UserEntity = new EntitySchema<User>({...})`
  - `name: 'User'`, `tableName: 'users'`
  - `columns: { ...baseEntityFields, email: { type: 'varchar', unique: true }, passwordHash: { type: 'varchar' } }`

### 8. Auth service
- [ ] `src/services/auth.service.ts`
  - `class AuthService`
  - Constructor: `private readonly userRepo: Repository<User>`
  - `register(email, password)` — hash, save, return user (no hash in response)
  - `login(email, password)` — find by email, compare bcrypt, throw `UnauthorizedError` on miss
  - `issueToken(user)` — JWT sign with `id` and `email`, expiry from `JWT_EXPIRES_IN` env (default `7d`)
  - `verifyToken(token)` — JWT verify, return payload or throw `UnauthorizedError`
  - All methods `async`, all throw typed errors

### 9. Auth route
- [ ] `src/routes/auth.route.ts`
  - `const authRoutes = new Hono()`
  - `const authService = new AuthService(AppDataSource.getRepository(UserEntity))`
  - `POST /register` — parse body, call `authService.register`, return `{ user, token }`
  - `POST /login` — parse body, call `authService.login`, return `{ user, token }`
  - No try/catch
  - Export default

### 10. Auth middleware
- [ ] `src/middlewares/auth.middleware.ts`
  - Read `Authorization: Bearer <token>` header
  - Verify via `authService.verifyToken`
  - Attach `user` to `c.set('user', { id, email })`
  - Throw `UnauthorizedError` on missing/invalid token
  - Export as Hono middleware

### 11. Error middleware
- [ ] `src/middlewares/error.middleware.ts`
  - Hono `app.onError` handler
  - If `err instanceof HttpError` → return `c.json({ error: err.message }, err.statusCode)`
  - Else → log full error, return 500 with generic message
  - Never leak stack traces in prod

### 12. Entry point
- [ ] `src/index.ts`
  - `import { Hono } from 'hono'`
  - `import { AppDataSource } from './data-source'`
  - `import { errorMiddleware } from './middlewares/error.middleware'`
  - `import authRoutes from './routes/auth.route'`
  - **No `import 'reflect-metadata'`** — not needed with `EntitySchema`
  - Initialize `AppDataSource` (await)
  - `const app = new Hono()`
  - Register `errorMiddleware`
  - `app.route('/v1/auth', authRoutes)`
  - Health check `GET /health` → `{ status: 'ok' }`
  - Auth is per-route, not global. Do not apply `authMiddleware` to `/v1/*`.
  - Start Bun server: `Bun.serve({ port, fetch: app.fetch })`

### 13. Smoke test
- [ ] `bun dev` starts without errors
- [ ] `curl localhost:PORT/health` → `{ status: 'ok' }`
- [ ] `curl -X POST localhost:PORT/v1/auth/register -d '{"email":"a@b.c","password":"pw"}' -H 'content-type: application/json'` → 200 with user + token
- [ ] `curl -X POST localhost:PORT/v1/auth/login ...` → 200 with token
- [ ] Bad creds → 401
- [ ] Duplicate email → 409
- [ ] Stage a junk change, run `git add .` + `git commit -m "chore: test"`, confirm lefthook runs and blocks on failure

### 14. README
- [ ] What it is, stack, tool table, folder structure, env vars, scripts, "to add a resource: edit spec.md, run Claude Code"

---

## Open Decisions
All resolved:
- [x] `bun.lock` committed (app project, lockfile tracked, text format)
- [x] Error classes in `src/errors/{name}.error.ts`, one per file, `http.error.ts` base
- [x] Health check on `GET /health`
- [x] JWT expiry from `JWT_EXPIRES_IN` env, default `7d`
- [x] Refresh tokens out of scope for v1, documented as v2 add-on
- [x] Entry point at `src/index.ts`
- [x] Tooling: Biome + commitlint + lefthook + fallow
- [x] **No decorators** — entities use `EntitySchema` (TypeORM). No `reflect-metadata`, no decorator TS flags, no decorator biome parser.

---

## Done When
- `bun dev` runs clean
- Register + login round-trip works
- Bad creds return 401, dup email return 409
- Global error handler maps all error classes correctly
- Pre-commit hook runs and blocks a deliberately broken commit
- A new dev can clone, `.env`, `bun install`, `bun dev` in under 5 min
