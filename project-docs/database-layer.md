# Database Layer Vocabulary

This document is a working draft for defining the database layer in the AXM API template. Nothing here is final until we agree on it in a follow-up session. Routes and auth are out of scope for the current `feat/hono-server` branch; this is preparation for the next phase.

---

## Problem

We are using the words "entity", "entity schema", and "database schema" to mean different things. We need a shared vocabulary before we create files.

---

## Candidate Vocabulary

Below are five things the codebase will need. For each, we propose a name and a location. These are proposals to debate, not decisions.

### 1. The object passed to `new EntitySchema(...)`

**Working name:** `EntitySchemaDefinition` or `EntityDefinition`.

**What it is:** A plain JavaScript object describing the TypeORM entity: `name`, `tableName`, `columns`, `relations`, etc.

**Example:**

```ts
const categoryEntitySchemaDefinition = {
    name: 'Category',
    tableName: 'categories',
    columns: {
        ...baseEntityColumns,
        name: { type: 'varchar' },
    },
};
```

**Proposed location:** `src/entities/category.entity.ts`.

**Alternative location:** `src/database/entity-schemas/category.schema.ts` — separates entity definitions from the repository layer.

---

### 2. The instance returned by `new EntitySchema<T>(...)`

**Working name:** `Entity` or `EntitySchemaInstance`.

**What it is:** The runtime `EntitySchema<Category>` object used by the TypeORM `DataSource` and by `dataSource.getRepository(...)`.

**Example:**

```ts
export const CategoryEntity = new EntitySchema<Category>(categoryEntitySchemaDefinition);
```

**Proposed location:** `src/entities/category.entity.ts`.

**Note:** This is usually exported from the same file as the definition and the TypeScript interface.

---

### 3. The TypeScript interface representing a database row

**Working name:** `Entity` or `DatabaseModel`.

**What it is:** The TypeScript type a repository returns and a service consumes.

**Example:**

```ts
export interface Category extends BaseEntity {
    name: string;
}
```

**Proposed location:** `src/entities/category.entity.ts`.

---

### 4. The Zod schemas for untrusted input / output shapes

**Working name:** `DtoSchemas` or `DataSchemas`.

**What it is:** Zod schemas for request bodies, response shapes, and service inputs. These are **not** the TypeORM entity. For example, a create payload does not include `id`, `createdAt`, or `updatedAt`.

**Example:**

```ts
export const CategorySelectSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export const CategoryCreateSchema = z.object({
    name: z.string(),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();
```

**Proposed location:** `src/schemas/category.schema.ts`.

**Alternative location:** `src/dtos/category.dto.ts` or `src/models/category.model.ts`.

---

### 5. The raw TypeORM repository

**Working name:** `TypeORMRepository` or `BaseRepository`.

**What it is:** `dataSource.getRepository(CategoryEntity)` — the repository object TypeORM gives us directly.

**Example:**

```ts
const categoryRepo = dataSource.getRepository(CategoryEntity);
```

**Proposed usage:** Hidden inside custom repository classes. Not exported directly to services or routes.

---

### 6. The custom repository class

**Working name:** `Repository`.

**What it is:** A class that wraps a TypeORM repository and exposes domain-specific methods like `findByName`, `createCategory`, `findById`, etc.

**Example:**

```ts
export class CategoryRepository {
    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(CategoryEntity);
    }

    async findByName(name: string): Promise<Category | null> {
        return this.repo.findOneBy({ name });
    }
}
```

**Proposed location:** `src/database/category.repository.ts`.

**Alternative location:** `src/repositories/category.repository.ts`.

---

## Open Decisions

These must be resolved in the next session before any files are created.

1. What do we call item 1? `EntitySchemaDefinition`, `EntityDefinition`, something else?
2. What do we call item 2? `Entity`, `EntitySchemaInstance`, something else?
3. Do the TypeORM interface and the `EntitySchema` definition live in `src/entities/`, or should they move to `src/database/`?
4. Where do Zod DTO schemas live? `src/schemas/`, `src/dtos/`, or `src/models/`?
5. What do we call Zod DTO schemas collectively? DTO schemas, data schemas, request/response schemas?
6. Do custom repository classes live in `src/database/` or `src/repositories/`?
7. How do repositories get wired into services?
   - Services take `DataSource` and create repositories internally?
   - Services take repository instances via constructor?
   - DI container resolves both `DataSource` and repositories/services?
8. Should there be a `src/database/repositories.ts` barrel that exports `userRepo = dataSource.getRepository(UserEntity)` for quick access, or do we always use custom repository classes?

---

## Current Proposed Folder Layout

Until decisions are finalized, the working proposal is:

```text
src/
  database/
    data-source.ts              # TypeORM DataSource singleton
    category.repository.ts      # Custom repository class
  entities/
    category.entity.ts          # TypeORM interface + definition + EntitySchema instance
  schemas/
    category.schema.ts          # Zod select/create/update schemas
  services/
    category.service.ts         # Business logic
  routes/
    category.route.ts           # Hono routes
```

This is a draft. Do not treat it as final.
