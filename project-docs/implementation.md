# Implementation

Internal build steps for AXM API template. Follow in order. Terse on purpose.

---

## Goal
Scaffold the template so a downstream dev can `bun install`, set `.env`, run `bun dev`, and get a working auth-protected REST API skeleton.

---

## Order of Operations

### 1. Project init
- [ ] `bun init` (accept defaults, TS)
- [ ] Confirm `package.json` exists, `bun.lockb` will appear after first install
- [ ] Create folder structure per `conventions.md`:
  - `src/entities/`
  - `src/services/`
  - `src/routes/`
  - `src/middlewares/`

### 2. Install deps
- [ ] Runtime: `hono`, `typeorm`, `reflect-metadata`, `jsonwebtoken`, `bcrypt`, `dotenv`
- [ ] Dev: `typescript`, `@types/jsonwebtoken`, `@types/bcrypt`, `bun-types`
- [ ] DB driver: `mysql2` (MariaDB default; swap later if needed)
- [ ] Verify `package.json` scripts: `dev`, `build`, `start`

### 3. Config files
- [ ] `tsconfig.json` — enable `experimentalDecorators`, `emitDecoratorMetadata`, `strict`, target ESNext, module ESNext, moduleResolution bundler
- [ ] `.env.example` — DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, JWT_EXPIRES_IN, PORT
- [ ] `.env` — copy from `.env.example`, fill real values (gitignored)
- [ ] `.gitignore` — node_modules, .env, dist, src/**/*.js

### 4. Data source
- [ ] `src/data-source.ts` — TypeORM `DataSource` instance, env-driven config, entity glob `src/entities/*.entity.ts`
- [ ] Export `AppDataSource` as singleton
- [ ] Initialize connection before Hono starts in `index.ts`

### 5. Base entity
- [ ] `src/entities/base.entity.ts`
  - `@PrimaryGeneratedColumn` `id: number`
  - `@CreateDateColumn` `createdAt: Date`
  - `@UpdateDateColumn` `updatedAt: Date`
  - Export class, no decorator on class itself (subclasses set `@Entity`)

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
  - Extends `BaseEntity`
  - `@Entity('users')`
  - `email: string` — `@Column({ unique: true })`
  - `passwordHash: string` — `@Column`

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
  - `const authService = new AuthService(AppDataSource.getRepository(User))`
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
- [ ] `index.ts`
  - `import 'reflect-metadata'`
  - `import { Hono } from 'hono'`
  - `import { AppDataSource } from './src/data-source'`
  - `import { errorMiddleware } from './src/middlewares/error.middleware'`
  - `import authRoutes from './src/routes/auth.route'`
  - Initialize `AppDataSource` (await)
  - `const app = new Hono()`
  - Register `errorMiddleware`
  - `app.route('/v1/auth', authRoutes)`
  - Health check `GET /health` → `{ status: 'ok' }`
  - `app.route('/v1/*', authMiddleware)` — NO, wrong. Auth is per-route, not global. Skip this.
  - Start Bun server: `Bun.serve({ port, fetch: app.fetch })`

### 13. Smoke test
- [ ] `bun dev` starts without errors
- [ ] `curl localhost:PORT/health` → `{ status: 'ok' }`
- [ ] `curl -X POST localhost:PORT/v1/auth/register -d '{"email":"a@b.c","password":"pw"}' -H 'content-type: application/json'` → 200 with user + token
- [ ] `curl -X POST localhost:PORT/v1/auth/login ...` → 200 with token
- [ ] Bad creds → 401
- [ ] Duplicate email → 409

### 14. README
- [ ] What it is, stack, folder structure, env vars, scripts, "to add a resource: edit spec.md, run Claude Code"

---

## Open Decisions
All resolved:
- [x] `bun.lockb` committed (app project, lockfile tracked)
- [x] Error classes in `src/errors/{name}.error.ts`, one per file, `http.error.ts` base
- [x] Health check on `GET /health`
- [x] JWT expiry from `JWT_EXPIRES_IN` env, default `7d`
- [x] Refresh tokens out of scope for v1, documented as v2 add-on

---

## Done When
- `bun dev` runs clean
- Register + login round-trip works
- Bad creds return 401, dup email returns 409
- Global error handler maps all error classes correctly
- A new dev can clone, `.env`, `bun install`, `bun dev` in under 5 min
