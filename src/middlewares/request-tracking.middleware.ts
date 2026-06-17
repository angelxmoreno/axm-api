import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@/schemas/hono';
import { getContextRequestId, getHeaderRequestId } from '@/utils/context-helpers';

const REQUEST_ID_HEADER = 'x-request-id';

export const createRequestTrackingMiddleware = (): MiddlewareHandler<AppEnv> => async (c, next) => {
    const contextRequestId = getContextRequestId(c);
    const headerRequestId = getHeaderRequestId(c);

    const requestId = contextRequestId ?? headerRequestId ?? Bun.randomUUIDv7();

    c.set('requestId', requestId);
    c.set('requestStartTime', Date.now());
    c.header(REQUEST_ID_HEADER, requestId);

    await next();
};
