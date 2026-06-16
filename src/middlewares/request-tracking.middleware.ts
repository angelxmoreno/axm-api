import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@/schemas/hono';

const REQUEST_ID_HEADER = 'x-request-id';

const generateRequestId = (): string => Bun.randomUUIDv7();

const normalizeRequestId = (requestId: unknown): string | undefined => {
    if (typeof requestId === 'string' && requestId.length > 0) {
        return requestId;
    }

    return undefined;
};

export const createRequestTracking = (): MiddlewareHandler<AppEnv> => async (c, next) => {
    const existingRequestId = normalizeRequestId(c.get('requestId'));
    const headerRequestId = c.req.header(REQUEST_ID_HEADER);
    const requestId = existingRequestId ?? normalizeRequestId(headerRequestId) ?? generateRequestId();

    c.set('requestId', requestId);
    c.set('requestStartTime', Date.now());

    await next();
};
