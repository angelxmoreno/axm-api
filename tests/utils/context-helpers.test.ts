import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import type { AppEnv } from '@/schemas/hono';
import { getOrCreateRequestId, getOrCreateRequestStartTime, hasRequestId } from '@/utils/context-helpers';

const runInRoute = async <T>(fn: (c: Context) => T): Promise<T> => {
    const app = new Hono<AppEnv>();
    let captured: T | undefined;

    app.get('/', (c) => {
        captured = fn(c);
        return c.text('ok');
    });

    await app.request('/');
    return captured as T;
};

import type { Context } from 'hono';

describe('getOrCreateRequestId()', () => {
    it('returns an existing requestId', async () => {
        const app = new Hono<AppEnv>();
        let capturedId: string | undefined;

        app.use(async (c, next) => {
            c.set('requestId', 'existing-id');
            await next();
        });
        app.get('/', (c) => {
            capturedId = getOrCreateRequestId(c);
            return c.text(capturedId);
        });

        await app.request('/');
        expect(capturedId).toBe('existing-id');
    });

    it('generates and stores a requestId when none is set', async () => {
        const generatedId = await runInRoute((c) => getOrCreateRequestId(c));

        expect(generatedId).toBeDefined();
        expect(typeof generatedId).toBe('string');
        expect(generatedId).toHaveLength(36);
    });

    it('returns the same requestId on repeated calls', async () => {
        const app = new Hono<AppEnv>();
        let first: string | undefined;
        let second: string | undefined;

        app.get('/', (c) => {
            first = getOrCreateRequestId(c);
            second = getOrCreateRequestId(c);
            return c.text(first);
        });

        await app.request('/');
        expect(first).toBe(second);
    });
});

describe('getOrCreateRequestStartTime()', () => {
    it('returns an existing start time', async () => {
        const app = new Hono<AppEnv>();
        let capturedStartTime: number | undefined;

        app.use(async (c, next) => {
            c.set('requestStartTime', 1_000);
            await next();
        });
        app.get('/', (c) => {
            capturedStartTime = getOrCreateRequestStartTime(c);
            return c.json({ startTime: capturedStartTime });
        });

        await app.request('/');
        expect(capturedStartTime).toBe(1_000);
    });

    it('generates and stores a start time when none is set', async () => {
        const before = Date.now();
        const generatedStartTime = await runInRoute((c) => getOrCreateRequestStartTime(c));
        const after = Date.now();

        expect(generatedStartTime).toBeDefined();
        expect(typeof generatedStartTime).toBe('number');
        expect(generatedStartTime).toBeGreaterThanOrEqual(before);
        expect(generatedStartTime).toBeLessThanOrEqual(after);
    });

    it('returns the same start time on repeated calls', async () => {
        const app = new Hono<AppEnv>();
        let first: number | undefined;
        let second: number | undefined;

        app.get('/', (c) => {
            first = getOrCreateRequestStartTime(c);
            second = getOrCreateRequestStartTime(c);
            return c.text('ok');
        });

        await app.request('/');
        expect(first).toBe(second);
    });
});

describe('hasRequestId()', () => {
    it('returns true when a requestId is set', async () => {
        const app = new Hono<AppEnv>();
        let result: boolean | undefined;

        app.use(async (c, next) => {
            c.set('requestId', 'existing-id');
            await next();
        });
        app.get('/', (c) => {
            result = hasRequestId(c);
            return c.text('ok');
        });

        await app.request('/');
        expect(result).toBe(true);
    });

    it('returns false when no requestId is set', async () => {
        const result = await runInRoute((c) => hasRequestId(c));
        expect(result).toBe(false);
    });
});
