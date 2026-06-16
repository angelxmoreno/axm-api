import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Logger } from 'pino';
import { createErrorHandlerMiddleware } from '@/middlewares/error-handler.middleware';
import { createRequestTrackingMiddleware } from '@/middlewares/request-tracking.middleware';
import type { AppEnv } from '@/schemas/hono';
import { createCapturingLogger } from '../test-helpers/create-capturing-logger';

type BuildAppOptions = {
    isDevelopment: boolean;
    logger?: Logger;
};

const buildApp = (
    options: BuildAppOptions
): { app: Hono<AppEnv>; logs: ReturnType<typeof createCapturingLogger>['logs'] } => {
    const { logger, logs } = options.logger ? { logger: options.logger, logs: [] } : createCapturingLogger();
    const app = new Hono<AppEnv>();

    app.onError(createErrorHandlerMiddleware({ logger, isDevelopment: options.isDevelopment }));
    app.use(createRequestTrackingMiddleware());

    return { app, logs };
};

describe('createErrorHandlerMiddleware()', () => {
    it('returns the original status for an HTTPException', async () => {
        const { app } = buildApp({ isDevelopment: false });
        app.get('/not-found', () => {
            throw new HTTPException(404, { message: 'resource not found' });
        });

        const res = await app.request('/not-found');
        expect(res.status).toBe(404);

        const body = (await res.json()) as { errorMessage: string };
        expect(body.errorMessage).toBe('Internal Server Error');
    });

    it('returns 500 for a generic Error', async () => {
        const { app } = buildApp({ isDevelopment: false });
        app.get('/boom', () => {
            throw new Error('database exploded');
        });

        const res = await app.request('/boom');
        expect(res.status).toBe(500);

        const body = (await res.json()) as { errorMessage: string };
        expect(body.errorMessage).toBe('Internal Server Error');
    });

    it('exposes the message and stack in development', async () => {
        const { app } = buildApp({ isDevelopment: true });
        const error = new Error('dev visible error');
        app.get('/dev', () => {
            throw error;
        });

        const res = await app.request('/dev');
        expect(res.status).toBe(500);

        const body = (await res.json()) as { errorMessage: string; errorStack: string | undefined };
        expect(body.errorMessage).toBe('dev visible error');
        expect(body.errorStack).toBeDefined();
        expect(typeof body.errorStack).toBe('string');
    });

    it('hides the message and stack in production', async () => {
        const { app } = buildApp({ isDevelopment: false });
        app.get('/prod', () => {
            throw new Error('prod hidden error');
        });

        const res = await app.request('/prod');
        expect(res.status).toBe(500);

        const body = (await res.json()) as { errorMessage: string; errorStack: string | undefined };
        expect(body.errorMessage).toBe('Internal Server Error');
        expect(body.errorStack).toBeUndefined();
    });

    it('includes a requestId in the payload', async () => {
        const { app } = buildApp({ isDevelopment: false });
        app.get('/id', () => {
            throw new Error('boom');
        });

        const res = await app.request('/id');
        const body = (await res.json()) as { requestId: string };
        expect(typeof body.requestId).toBe('string');
        expect(body.requestId).toHaveLength(36);
    });

    it('logs the error payload', async () => {
        const { app, logs } = buildApp({ isDevelopment: true });
        app.get('/logged', () => {
            throw new Error('logged error');
        });

        await app.request('/logged');
        expect(logs).toHaveLength(1);
        expect(logs[0]?.errorMessage).toBe('logged error');
        expect(logs[0]?.statusCode).toBe(500);
    });

    it('still returns a response when the logger fails', async () => {
        const logger = {
            error: () => {
                throw new Error('logger down');
            },
        } as unknown as Logger;
        const { app } = buildApp({ isDevelopment: false, logger });
        app.get('/log-fail', () => {
            throw new Error('original error');
        });

        const res = await app.request('/log-fail');
        expect(res.status).toBe(500);

        const body = (await res.json()) as { errorMessage: string };
        expect(body.errorMessage).toBe('Internal Server Error');
    });
});
