import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Logger } from 'pino';
import type { AppEnv } from '@/schemas/hono';
import { getOrCreateRequestId } from '@/utils/context-helpers';

const toHttpException = (error: unknown): HTTPException => {
    if (error instanceof HTTPException) return error;

    if (error instanceof Error) {
        return new HTTPException(500, { message: error.message, cause: error });
    }

    return new HTTPException(500, { message: 'Unknown error', cause: error });
};

export type ErrorHandlerOptions = {
    logger: Logger;
    isDevelopment: boolean;
};

export const createErrorHandlerMiddleware = (options: ErrorHandlerOptions): ErrorHandler<AppEnv> => {
    const { logger, isDevelopment } = options;
    return (error, c) => {
        const originalStack = error instanceof Error ? error.stack : undefined;
        const exception = toHttpException(error);
        const requestId = getOrCreateRequestId(c);

        const payload = {
            requestId,
            statusCode: exception.status,
            errorMessage: isDevelopment ? exception.message : 'Internal Server Error',
            errorStack: isDevelopment ? (originalStack ?? exception.stack) : undefined,
        };
        try {
            logger.error(payload);
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return c.json(payload, exception.status);
    };
};
