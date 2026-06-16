import type { MiddlewareHandler } from 'hono';
import type { Logger } from 'pino';
import type { AppEnv } from '@/schemas/hono';
import { getOrCreateRequestId, getOrCreateRequestStartTime } from '@/utils/context-helpers';

export type RequestLoggerOptions = {
    logger: Logger;
};

export const createRequestLoggerMiddleware = (options: RequestLoggerOptions): MiddlewareHandler<AppEnv> => {
    const { logger } = options;
    return async (c, next) => {
        const startTime = getOrCreateRequestStartTime(c);

        try {
            await next();
        } finally {
            const durationMs = Date.now() - startTime;
            const requestId = getOrCreateRequestId(c);

            logger.info(
                {
                    requestId,
                    method: c.req.method,
                    path: c.req.path,
                    status: c.res?.status ?? 200,
                    durationMs,
                },
                'request'
            );
        }
    };
};
