# CLAUDE.md

This file is auto-loaded by Claude Code when working in this repo. It orients the agent to the current build state of the AXM API template and the workflow we follow.

This is **not** the file shipped to downstream users — that role is held by `project-docs/PROJECT_INSTRUCTIONS.md`.

---

## What This Repo Is
AXM API template — a reusable scaffold for Hono + TypeORM + Bun REST APIs. We are currently **building the template itself**, not a downstream project.

## What This Repo Is Not
- Not a finished template yet — see `project-docs/implementation.md` for build order
- Not a downstream user-facing project — those would have their own `spec.md` filled in

## State of the Build (as of last session)
- `package.json` — scripts in place (dev, build, start, lint, type checks, fallow checks), `prepare` installs lefthook
- `biome.json` — configured (4 spaces, single quotes, semicolons, **no decorator parser** — entities use `EntitySchema`)
- `lefthook.yml` — pre-commit runs lint+types+dead-code+dupes+health in parallel; commit-msg runs commitlint
- `.commitlintrc.json` — extends `@commitlint/config-conventional`
- `tsconfig.json` — ESM, strict, `types: ["bun"]`. No decorator flags.
- `src/` — folders scaffolded, `index.ts` is a stub, no real code yet
- `project-docs/` — holds `PROJECT_INSTRUCTIONS.md` (downstream-facing), `conventions.md` (rules, includes tooling), `implementation.md` (build order), `spec.md` (template — empty), `spec-builder-prompt.md`

## What Is NOT Done Yet
- Runtime deps not installed (`hono`, `typeorm`, `jsonwebtoken`, `bcrypt`, `dotenv`, `mysql2`)
- **No `reflect-metadata`** — entities use `EntitySchema`, not decorators
- No `data-source.ts`, no entities (must use `EntitySchema` not `@Entity`), no services, no routes, no middlewares, no error classes
- No `.env.example` yet
- No smoke test run end-to-end

## Build Order
Follow `project-docs/implementation.md` top to bottom. Do not skip steps. Do not parallelize steps that have order dependencies.

## Conventions
Read `project-docs/conventions.md` before writing any code. Hard rules:
- **No decorators on entities** — use `EntitySchema` (TypeORM)
- Routes thin, services fat
- No `any` type
- Services throw typed errors from `src/errors/`, never raw TypeORM errors
- Repos injected via constructor — never `import { AppDataSource }` in a service
- Kebab-case filenames, type suffix (`.entity.ts`, `.service.ts`, `.route.ts`, `.middleware.ts`, `.error.ts`)

## Tooling Notes
- **Biome** is the only linter/formatter. No ESLint, no Prettier.
- **Fallow** is the code health tool. 4 commands: dead-code, dupes, health, audit. `check:audit` is not in the pre-commit hook (only dead-code, dupes, health are).
- **commitlint** enforces conventional commits. Commits like `wip` or `fix` alone will be rejected.
- **lefthook** runs on `git commit`. To bypass in emergency: `git commit --no-verify` (avoid).
- **No `bun.lockb`** — this project uses text-format `bun.lock`, which is committed for reproducible builds.

## Workflow
1. User asks for a change or we hit a build step
2. Read `project-docs/conventions.md` if writing code, `project-docs/implementation.md` if doing a build step
3. Make the change
4. If it's a code change, run `bun lint:fix` and `bun check:types` before committing
5. If it touches a build step, update `project-docs/implementation.md` to check the box
6. Commit with conventional format: `type(scope): subject`

## Don't Do
- Don't add a `package.json` dependency without updating `project-docs/implementation.md` step 2
- Don't change tooling configs (`biome.json`, `lefthook.yml`, `.commitlintrc.json`) without flagging — these are load-bearing
- Don't write code in the project root outside `src/`
- Don't put business logic in route handlers
- Don't commit without running pre-commit checks (they should pass automatically)

## File Roles
| File | Audience | Purpose |
|---|---|---|
| `CLAUDE.md` (this) | Claude Code, building the template | Current build state, workflow |
| `project-docs/PROJECT_INSTRUCTIONS.md` | Downstream users of the template | What exists, what to follow |
| `project-docs/conventions.md` | Both | Hard rules — never deviate |
| `project-docs/implementation.md` | Claude Code, building the template | Build order, checkboxes |
| `project-docs/spec.md` | Downstream users | Their project spec (currently empty) |
| `project-docs/spec-builder-prompt.md` | Downstream users | How to fill `spec.md` |
| `README.md` | Downstream users | Quick start, scripts, env vars |
