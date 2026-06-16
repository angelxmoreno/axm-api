import type { Context } from 'hono';
import type { AppEnv } from '@/schemas/hono';

export const getRequestId = (c: Context<AppEnv>): string => {
    const requestId = c.get('requestId');
    if (typeof requestId === 'string' && requestId.length > 0) return requestId;
    throw new Error('requestId is not set on context');
};

export const getRequestStartTime = (c: Context<AppEnv>): number => {
    const requestStartTime = c.get('requestStartTime');
    if (typeof requestStartTime === 'number' && requestStartTime > 0) return requestStartTime;
    throw new Error('requestStartTime is not set on context');
};
