import { Hono } from 'hono';
import { appConfig } from '@/config/app.config';
import { createCorsMiddleware } from '@/middlewares/cors.middleware';
import { createSecureHeadersMiddleware } from '@/middlewares/secure-headers.middleware';
import type { HonoEnv } from '@/schemas/hono';

const app = new Hono<HonoEnv>();
app.use(createCorsMiddleware(appConfig.cors));
app.use(createSecureHeadersMiddleware(appConfig.secureHeaders));
export default {
    hostname: appConfig.app.hostname,
    port: appConfig.app.port,
    fetch: app.fetch,
};
