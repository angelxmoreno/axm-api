import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import type { AppEnv } from '@/schemas/hono';
import { getRequestId, getRequestStartTime } from '@/utils/context-helpers';

describe('getRequestId()', () => {
    it('returns an existing requestId when one is set', () => {
        const app = new Hono<AppEnv>();
        app.use(async (c, next) => {
            c.set('requestId', 'existing-id');
            await next();
        });
        app.get('/', (c) => {
            return c.text(getRequestId(c));
        });

        const res = app.request('/');
        expect(res).resolves.toMatchObject({ status: 200 });
    });

    it('generates and stores a new requestId when none is set', async () => {
        const app = new Hono<AppEnv>();
        let capturedId: string | undefined;

        app.get('/', (c) => {
            capturedId = getRequestId(c);
            return c.text(capturedId);
        });

        await app.request('/');
        expect(capturedId).toBeDefined();
        expect(typeof capturedId).toBe('string');
        expect(capturedId).toHaveLength(36);
    });

    it('returns the same requestId on repeated calls', async () => {
        const app = new Hono<AppEnv>();
        let first: string | undefined;
        let second: string | undefined;

        app.get('/', (c) => {
            first = getRequestId(c);
            second = getRequestId(c);
            return c.text(first);
        });

        await app.request('/');
        expect(first).toBe(second);
    });
});

describe('getRequestStartTime()', () => {
    it('returns an existing start time when one is set', () => {
        const app = new Hono<AppEnv>();
        app.use(async (c, next) => {
            c.set('requestStartTime', 1_000);
            await next();
        });
        app.get('/', (c) => {
            return c.json({ startTime: getRequestStartTime(c) });
        });

        expect(app.request('/')).resolves.toMatchObject({ status: 200 });
    });

    it('generates and stores a new start time when none is set', async () => {
        const app = new Hono<AppEnv>();
        let capturedStartTime: number | undefined;

        app.get('/', (c) => {
            capturedStartTime = getRequestStartTime(c);
            return c.text('ok');
        });

        const before = Date.now();
        await app.request('/');
        const after = Date.now();

        expect(capturedStartTime).toBeDefined();
        expect(typeof capturedStartTime).toBe('number');
        expect(capturedStartTime).toBeGreaterThanOrEqual(before);
        expect(capturedStartTime).toBeLessThanOrEqual(after);
    });

    it('returns the same start time on repeated calls', async () => {
        const app = new Hono<AppEnv>();
        let first: number | undefined;
        let second: number | undefined;

        app.get('/', (c) => {
            first = getRequestStartTime(c);
            second = getRequestStartTime(c);
            return c.text('ok');
        });

        await app.request('/');
        expect(first).toBe(second);
    });
});
