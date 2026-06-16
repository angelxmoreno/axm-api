import { Hono } from 'hono';
import type { Logger } from 'pino';
import { appConfig } from '@/config/app.config';
import { appContainer } from '@/config/app.container';
import { createCorsMiddleware } from '@/middlewares/cors.middleware';
import { createRequestLogger } from '@/middlewares/request-logger.middleware';
import { createSecureHeadersMiddleware } from '@/middlewares/secure-headers.middleware';
import type { AppEnv } from '@/schemas/hono';

const logger = appContainer.resolveType<Logger>().child({ module: 'http-server' });
const app = new Hono<AppEnv>();

app.use(createRequestLogger({ logger }));
app.use(createCorsMiddleware(appConfig.cors));
app.use(createSecureHeadersMiddleware(appConfig.secureHeaders));
export default {
    hostname: appConfig.app.hostname,
    port: appConfig.app.port,
    fetch: app.fetch,
};
