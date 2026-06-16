import type { Context } from 'hono';
import type { AppEnv } from '@/schemas/hono';

export const getRequestId = (c: Context<AppEnv>): string => {
    const requestId = c.get('requestId');
    if (typeof requestId === 'string' && requestId.length > 0) return requestId;
    const uuid = Bun.randomUUIDv7();
    c.set('requestId', uuid);
    return uuid;
};

export const getRequestStartTime = (c: Context<AppEnv>): number => {
    const requestStartTime = c.get('requestStartTime');
    if (typeof requestStartTime === 'number' && requestStartTime > 0) return requestStartTime;
    const startTime = Date.now();
    c.set('requestStartTime', startTime);
    return startTime;
};
