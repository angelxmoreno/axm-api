import { describe, expect, it } from 'bun:test';
import { type Context, Hono } from 'hono';
import type { AppEnv } from '@/schemas/hono';
import { getRequestId, getRequestStartTime } from '@/utils/context-helpers';

const captureThrow = (fn: () => void): Error | undefined => {
    try {
        fn();
    } catch (e) {
        return e as Error;
    }
    return undefined;
};

const assertThrowsInRoute = async (fn: (c: Context<AppEnv>) => void, expectedMessage: string): Promise<void> => {
    const app = new Hono<AppEnv>();
    let thrownError: Error | undefined;

    app.get('/', (c) => {
        thrownError = captureThrow(() => fn(c));
        return c.text('ok');
    });

    await app.request('/');
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError?.message).toBe(expectedMessage);
};

describe('getRequestId()', () => {
    it('returns an existing requestId', async () => {
        const app = new Hono<AppEnv>();
        let capturedId: string | undefined;

        app.use(async (c, next) => {
            c.set('requestId', 'existing-id');
            await next();
        });
        app.get('/', (c) => {
            capturedId = getRequestId(c);
            return c.text(capturedId);
        });

        await app.request('/');
        expect(capturedId).toBe('existing-id');
    });

    it('throws when requestId is not set', async () => {
        await assertThrowsInRoute((c) => getRequestId(c), 'requestId is not set on context');
    });
});

describe('getRequestStartTime()', () => {
    it('returns an existing start time', async () => {
        const app = new Hono<AppEnv>();
        let capturedStartTime: number | undefined;

        app.use(async (c, next) => {
            c.set('requestStartTime', 1_000);
            await next();
        });
        app.get('/', (c) => {
            capturedStartTime = getRequestStartTime(c);
            return c.json({ startTime: capturedStartTime });
        });

        await app.request('/');
        expect(capturedStartTime).toBe(1_000);
    });

    it('throws when requestStartTime is not set', async () => {
        await assertThrowsInRoute((c) => getRequestStartTime(c), 'requestStartTime is not set on context');
    });
});
