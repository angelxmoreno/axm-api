# HTTP Server TODO

Items to consider for the `feat/hono-server` branch and future branches. Routes and auth middleware are intentionally out of scope for this branch and will be handled separately.

---

## Middleware to Add

1. **Rate limiter**
   - Use `hono-rate-limiter` or a simple in-memory token-bucket middleware.
   - Good for API hardening before exposing the server.

2. **Body size limit**
   - Hono has a built-in `bodyLimit` helper.
   - Prevents huge JSON/multipart payloads from hitting handlers.

3. **Timeout middleware**
   - Abort requests that run longer than a configured threshold.
   - Should probably return a typed error handled by the error middleware.

4. **Request ID response header**
   - Set `X-Request-Id` on every response from the tracking middleware or a dedicated finalizer middleware.
   - Makes tracing easier for clients.

5. **Hide `X-Powered-By: Hono`**
   - Hono adds this header by default.
   - Usually disabled in production APIs to avoid leaking framework info.

6. **Compress responses**
   - Use `hono/compress` for gzip where the client accepts it.

---

## HTTP Server Infrastructure

1. **Graceful shutdown**
   - Handle `SIGTERM` / `SIGINT`.
   - Stop accepting new requests, drain in-flight requests, then exit.

2. **Server start logging**
   - Log the bound `hostname:port`, `NODE_ENV`, and any relevant config on boot.

3. **Health check route**
   - `GET /health` or `/ping` returning a simple JSON status.
   - Borderline route work; decide whether it belongs in this branch or the routes branch.

4. **Custom 404 / not-found handler**
   - Wire `app.notFound` to return JSON with `requestId` and a consistent error shape.
   - Should reuse the error response format from the error handler middleware.

5. **OpenAPI / docs setup**
   - `hono-openapi` or `zod-openapi` scaffold.
   - Likely too large for this branch; defer until routes exist.

---

## Recommended Scope for This Branch

To keep `feat/hono-server` focused, finish with:

1. Set `X-Request-Id` response header.
2. Hide `X-Powered-By: Hono`.
3. Add a custom `app.notFound` JSON handler.

Everything else can wait for a later branch or be picked off individually.
