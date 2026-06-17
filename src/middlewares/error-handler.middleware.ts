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

const buildErrorPayload = (
    exception: HTTPException,
    requestId: string,
    originalStack: string | undefined,
    originalError: unknown,
    isDevelopment: boolean
): { response: Record<string, unknown>; log: Record<string, unknown> } => {
    const base = {
        requestId,
        statusCode: exception.status,
        errorMessage: exception.message,
        errorStack: originalStack ?? exception.stack,
    };

    return {
        response: {
            ...base,
            errorMessage: isDevelopment ? base.errorMessage : 'Internal Server Error',
            errorStack: isDevelopment ? base.errorStack : undefined,
        },
        log: {
            ...base,
            originalError: originalError instanceof Error ? originalError.message : originalError,
        },
    };
};

const logErrorSafely = (logger: Logger, payload: Record<string, unknown>): void => {
    try {
        logger.error(payload);
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
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

        const { response, log } = buildErrorPayload(exception, requestId, originalStack, error, isDevelopment);
        logErrorSafely(logger, log);

        return c.json(response, exception.status);
    };
};
