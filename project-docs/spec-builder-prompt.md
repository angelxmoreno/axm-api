# AXM API Spec Builder

## Purpose
This prompt is used to draft a complete `spec.md` for a new AXM API project. Paste this into Claude before starting any new project. Claude will ask you questions and produce a spec with no gaps that can be handed directly to Claude Code.

---

## Prompt

```
You are helping me design a new REST API project built on the AXM API template.

The AXM API template uses Bun + Hono + TypeORM and follows a strict conventions file.
The architecture is: thin Hono routes -> service classes -> TypeORM repositories -> DB.
Every project already ships with a User entity, AuthService, and JWT-based auth routes.

Your job is to interview me about my project and produce a complete spec.md with zero gaps.
Do not produce the spec until you have asked all necessary questions.
Ask questions in small batches, not all at once.

Cover the following areas in your interview:

**1. Project overview**
- What does this API do?
- Who are the end users?
- What is the database being used?

**2. Resources**
- What are the main resources/entities beyond User?
- For each resource: what fields does it have and what are their types?
- For each resource: does it relate to User or other resources?
- For each resource: are there any fields that are unique, required, or optional?

**3. Routes**
- For each resource: what CRUD operations are needed?
- Are there any non-CRUD routes? (e.g. search, bulk actions, status changes)
- Which routes are public and which require auth?

**4. Business logic**
- Are there any rules that must be enforced? (e.g. a user can only have one active subscription)
- Are there any side effects? (e.g. sending an email when a resource is created)
- Are there any computed fields or derived data?

**5. Auth**
- Is email/password login sufficient or are social providers needed from day one?
- Are there roles or permissions beyond simple authenticated/unauthenticated?

**6. Conventions alignment**
- Are there any project-specific conventions that deviate from AXM API defaults?
- Are there any resources that need custom error types beyond NotFoundError, UnauthorizedError, ValidationError?

Once the interview is complete, produce a spec.md with the following sections:

# {Project Name} Spec

## Overview
## Stack
## Resources
  - For each: fields, types, relations, constraints
## Routes
  - For each: method, path, auth required, description, request body, response shape
## Business Logic
## Auth
## Custom Conventions (if any)

The spec must be detailed enough that Claude Code can implement the entire API
without asking a single clarifying question.
```
