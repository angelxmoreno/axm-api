import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { createRateLimiterMiddleware } from '@/middlewares/rate-limiter.middleware';
import type { AppEnv } from '@/schemas/hono';

const buildApp = (limit: number, windowMs: number): Hono<AppEnv> => {
    const app = new Hono<AppEnv>();
    app.use(createRateLimiterMiddleware({ limit, windowMs }));
    app.get('/', (c) => c.text('ok'));
    return app;
};

const requestStatuses = async (
    app: Hono<AppEnv>,
    count: number,
    headers?: Record<string, string>
): Promise<number[]> => {
    const statuses: number[] = [];
    for (let index = 0; index < count; index++) {
        const res = await app.request('/', { headers });
        statuses.push(res.status);
    }
    return statuses;
};

describe('createRateLimiterMiddleware()', () => {
    it('allows requests under the limit', async () => {
        const app = buildApp(2, 60_000);

        const statuses = await requestStatuses(app, 2, { 'x-real-ip': '1.2.3.4' });
        expect(statuses).toEqual([200, 200]);
    });

    it('blocks requests over the limit', async () => {
        const app = buildApp(1, 60_000);

        const statuses = await requestStatuses(app, 2, { 'x-real-ip': '1.2.3.4' });
        expect(statuses).toEqual([200, 429]);
    });

    it('tracks clients independently by IP', async () => {
        const app = buildApp(1, 60_000);

        const firstClient = await requestStatuses(app, 1, { 'x-real-ip': '1.2.3.4' });
        const secondClient = await requestStatuses(app, 1, { 'x-real-ip': '5.6.7.8' });
        expect([...firstClient, ...secondClient]).toEqual([200, 200]);
    });

    it('uses the first x-forwarded-for IP when present', async () => {
        const app = buildApp(1, 60_000);

        const statuses = await requestStatuses(app, 2, { 'x-forwarded-for': '1.2.3.4, 9.9.9.9' });
        expect(statuses).toEqual([200, 429]);
    });

    it('applies default values when config is empty', async () => {
        const app = new Hono<AppEnv>();
        app.use(createRateLimiterMiddleware({ limit: 1, windowMs: 60_000 }));
        app.get('/', (c) => c.text('ok'));

        const statuses = await requestStatuses(app, 1);
        expect(statuses).toEqual([200]);
    });
});
