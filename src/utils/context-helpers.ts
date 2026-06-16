import type { Context } from 'hono';
import type { AppEnv } from '@/schemas/hono';

const REQUEST_ID_HEADER = 'x-request-id';

const normalizeRequestId = (requestId: unknown): string | undefined => {
    return typeof requestId === 'string' && requestId.length > 0 ? requestId : undefined;
};

export const getHeaderRequestId = (c: Context<AppEnv>): string | undefined =>
    normalizeRequestId(c.req.header(REQUEST_ID_HEADER));

export const getContextRequestId = (c: Context<AppEnv>): string | undefined => normalizeRequestId(c.get('requestId'));

export const hasRequestId = (c: Context<AppEnv>): boolean => normalizeRequestId(c.get('requestId')) !== undefined;

export const getOrCreateRequestId = (c: Context<AppEnv>): string => {
    const requestId = normalizeRequestId(c.get('requestId'));
    if (typeof requestId === 'string' && requestId.length > 0) return requestId;

    const newId = Bun.randomUUIDv7();
    c.set('requestId', newId);
    return newId;
};

export const getOrCreateRequestStartTime = (c: Context<AppEnv>): number => {
    const requestStartTime = c.get('requestStartTime');
    if (typeof requestStartTime === 'number' && requestStartTime > 0) return requestStartTime;

    const timeNow = Date.now();
    c.set('requestStartTime', timeNow);
    return timeNow;
};
