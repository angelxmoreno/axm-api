# AXM API Conventions

## Project Overview
AXM API is a reusable Hono + TypeORM template for building user-facing REST APIs with Bun. It is database-agnostic by design. The default database is MariaDB but swapping to any TypeORM-supported database requires changing one line in the data source config.

---

## Stack
- **Runtime:** Bun
- **Framework:** Hono
- **ORM:** TypeORM
- **Language:** TypeScript
- **Default DB:** MariaDB

---

## Folder Structure
```
src/
  entities/        TypeORM entity classes
  routes/          Hono route apps, one file per resource
  services/        Business logic classes, one file per resource
  middlewares/     Shared middleware (auth, error handling)
index.ts           App entry point, mounts all routes
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

---

## Entities

- One class per file
- Use TypeORM decorators (`@Entity`, `@Column`, `@PrimaryGeneratedColumn`, etc.)
- Every entity extends a `BaseEntity` class that provides `id`, `createdAt`, `updatedAt`
- Entity class names are PascalCase and singular (`User`, `Post`, `BlogPost`)
- Table names are snake_case and plural (`users`, `posts`, `blog_posts`)

```ts
// src/entities/user.entity.ts
@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string
}
```

---

## Services

- One class per resource, named `{Resource}Service` in PascalCase
- TypeORM repositories are **injected via constructor** -- services never import the data source directly
- All business logic lives here -- routes never contain logic beyond calling a service method and returning a response
- Service methods are `async` and throw typed errors -- they never return raw TypeORM errors to the caller
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
- Mounted in `index.ts` under a versioned prefix (e.g. `/v1/users`)
- Route handlers are thin -- one service call, one response
- Instantiate the service inside the route file, passing the TypeORM repository

```ts
// src/routes/user.route.ts
const userRoutes = new Hono()
const userService = new UserService(AppDataSource.getRepository(User))

userRoutes.get('/:id', async (c) => {
  const user = await userService.findById(Number(c.req.param('id')))
  return c.json(user)
})

export default userRoutes
```

```ts
// index.ts
app.route('/v1/users', userRoutes)
app.route('/v1/auth', authRoutes)
```

---

## Error Handling

- A global error handler middleware is registered in `index.ts`
- Services throw typed error classes (`NotFoundError`, `UnauthorizedError`, `ValidationError`, etc.)
- The error middleware maps error types to HTTP status codes
- Routes never contain try/catch -- errors bubble up to the global handler

---

## Auth

- JWT-based, issued on login
- `auth.middleware.ts` verifies the token and attaches the user to context
- Protected routes use the auth middleware directly on the route or router
- Auth is designed to extend to OAuth providers without modifying the email/password flow
- Passwords are hashed with `bcrypt` -- plain text passwords never touch the database

---

## What Claude Code Should Generate Per Resource

When given a `spec.md`, Claude Code generates the following per resource:

1. `src/entities/{resource}.entity.ts`
2. `src/services/{resource}.service.ts`
3. `src/routes/{resource}.route.ts`
4. Registers the route in `index.ts`

Claude Code must follow all conventions in this file exactly. If a convention is ambiguous for a specific case, prefer the pattern that keeps routes thin and services fat.

---

## What Claude Code Must Never Do

- Put business logic in route handlers
- Import the data source directly inside a service
- Use `any` as a type
- Skip error handling in service methods
- Create files outside the defined folder structure
- Deviate from kebab-case file naming
