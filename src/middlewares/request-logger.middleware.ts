import type { MiddlewareHandler } from 'hono';
import type { Logger } from 'pino';
import type { AppEnv } from '@/schemas/hono';
import { getRequestId, getRequestStartTime } from '@/utils/context-helpers';

export type RequestLoggerOptions = {
    logger: Logger;
};

export const createRequestLogger = (options: RequestLoggerOptions): MiddlewareHandler<AppEnv> => {
    const { logger } = options;
    return async (c, next) => {
        const startTime = getRequestStartTime(c);

        try {
            await next();
        } finally {
            const durationMs = Date.now() - startTime;
            const requestId = getRequestId(c);

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
