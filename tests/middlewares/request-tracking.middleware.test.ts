import { describe, expect, it } from 'bun:test';
import { Hono, type MiddlewareHandler } from 'hono';
import { createRequestTrackingMiddleware } from '@/middlewares/request-tracking.middleware';
import type { AppEnv } from '@/schemas/hono';

type Captured = {
    requestId: string | undefined;
    requestStartTime: number | undefined;
};

const buildApp = (preset?: MiddlewareHandler<AppEnv>): { app: Hono<AppEnv>; captured: Captured } => {
    const app = new Hono<AppEnv>();
    const captured: Captured = { requestId: undefined, requestStartTime: undefined };

    if (preset) app.use(preset);
    app.use(createRequestTrackingMiddleware());
    app.get('/', (c) => {
        captured.requestId = c.get('requestId');
        captured.requestStartTime = c.get('requestStartTime');
        return c.text(captured.requestId ?? 'ok');
    });

    return { app, captured };
};

describe('createRequestTrackingMiddleware()', () => {
    it('generates a requestId when none is provided', async () => {
        const { app, captured } = buildApp();

        const res = await app.request('/');
        expect(res.status).toBe(200);
        expect(captured.requestId).toBeDefined();
        expect(typeof captured.requestId).toBe('string');
        expect(captured.requestId).toHaveLength(36);
    });

    it('uses the x-request-id header when present', async () => {
        const { app, captured } = buildApp();

        const res = await app.request('/', { headers: { 'x-request-id': 'header-id' } });
        expect(res.status).toBe(200);
        expect(captured.requestId).toBe('header-id');
    });

    it('prefers an existing requestId over the header', async () => {
        const { app, captured } = buildApp(async (c, next) => {
            c.set('requestId', 'existing-id');
            await next();
        });

        const res = await app.request('/', { headers: { 'x-request-id': 'header-id' } });
        expect(res.status).toBe(200);
        expect(captured.requestId).toBe('existing-id');
    });

    it('ignores an empty x-request-id header', async () => {
        const { app, captured } = buildApp();

        const res = await app.request('/', { headers: { 'x-request-id': '' } });
        expect(res.status).toBe(200);
        expect(captured.requestId).toBeDefined();
        expect(typeof captured.requestId).toBe('string');
    });

    it('sets x-request-id response header', async () => {
        const { app } = buildApp();

        const res = await app.request('/', { headers: { 'x-request-id': 'header-id' } });
        expect(res.headers.get('x-request-id')).toBe('header-id');
    });

    it('sets requestStartTime on the context', async () => {
        const { app, captured } = buildApp();

        const before = Date.now();
        await app.request('/');
        const after = Date.now();

        expect(captured.requestStartTime).toBeDefined();
        expect(typeof captured.requestStartTime).toBe('number');
        expect(captured.requestStartTime).toBeGreaterThanOrEqual(before);
        expect(captured.requestStartTime).toBeLessThanOrEqual(after);
    });
});
