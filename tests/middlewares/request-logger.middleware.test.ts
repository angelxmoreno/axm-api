import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import pino, { type Logger } from 'pino';
import { createRequestLogger } from '@/middlewares/request-logger.middleware';
import { createRequestTracking } from '@/middlewares/request-tracking.middleware';
import type { AppEnv } from '@/schemas/hono';

type CapturedLog = {
    requestId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    msg: string;
};

const createCapturingLogger = (): { logger: Logger; logs: CapturedLog[] } => {
    const logs: CapturedLog[] = [];
    const stream = {
        write: (line: string) => {
            const parsed = JSON.parse(line) as CapturedLog;
            logs.push(parsed);
        },
    };
    const logger = pino({ level: 'info' }, stream as unknown as pino.DestinationStream);
    return { logger, logs };
};

describe('createRequestLogger()', () => {
    it('logs request details after the handler runs', async () => {
        const { logger, logs } = createCapturingLogger();
        const app = new Hono<AppEnv>();
        app.use(createRequestTracking());
        app.use(createRequestLogger({ logger }));
        app.get('/hello', (c) => c.text('world'));

        const res = await app.request('/hello');
        expect(res.status).toBe(200);
        expect(logs).toHaveLength(1);

        const [log] = logs;
        expect(log.method).toBe('GET');
        expect(log.path).toBe('/hello');
        expect(log.status).toBe(200);
        expect(log.msg).toBe('request');
        expect(typeof log.requestId).toBe('string');
        expect(typeof log.durationMs).toBe('number');
        expect(log.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('logs even when the handler throws', async () => {
        const { logger, logs } = createCapturingLogger();
        const app = new Hono<AppEnv>();
        app.onError(() => new Response('Internal Server Error', { status: 500 }));
        app.use(createRequestTracking());
        app.use(createRequestLogger({ logger }));
        app.get('/error', () => {
            throw new Error('boom');
        });

        const res = await app.request('/error');
        expect(res.status).toBe(500);
        expect(logs).toHaveLength(1);

        const [log] = logs;
        expect(log.method).toBe('GET');
        expect(log.path).toBe('/error');
        expect(log.status).toBe(500);
    });

    it('reuses an existing requestId if one is already set', async () => {
        const { logger, logs } = createCapturingLogger();
        const app = new Hono<AppEnv>();
        app.use(async (c, next) => {
            c.set('requestId', 'preset-id');
            c.set('requestStartTime', Date.now());
            await next();
        });
        app.use(createRequestLogger({ logger }));
        app.get('/with-id', (c) => c.text('ok'));

        await app.request('/with-id');
        expect(logs[0]?.requestId).toBe('preset-id');
    });
});
