import { Hono } from 'hono';
import { trimTrailingSlash } from 'hono/trailing-slash';
import type { Logger } from 'pino';
import { appConfig } from '@/config/app.config';
import { appContainer } from '@/config/app.container';
import { createCorsMiddleware } from '@/middlewares/cors.middleware';
import { createErrorHandlerMiddleware } from '@/middlewares/error-handler.middleware';
import { createRequestLoggerMiddleware } from '@/middlewares/request-logger.middleware';
import { createRequestTrackingMiddleware } from '@/middlewares/request-tracking.middleware';
import { createSecureHeadersMiddleware } from '@/middlewares/secure-headers.middleware';
import type { AppEnv } from '@/schemas/hono';

const logger = appContainer.resolveType<Logger>().child({ module: 'http-server' });
const app = new Hono<AppEnv>();

app.onError(
    createErrorHandlerMiddleware({
        logger,
        isDevelopment: appConfig.app.nodeEnv === 'development',
    })
);
app.use(createRequestTrackingMiddleware());
app.use(trimTrailingSlash());
app.use(createSecureHeadersMiddleware(appConfig.secureHeaders));
app.use(createCorsMiddleware(appConfig.cors));
app.use(createRequestLoggerMiddleware({ logger }));

export default {
    hostname: appConfig.app.hostname,
    port: appConfig.app.port,
    fetch: app.fetch,
};
