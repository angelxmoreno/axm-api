import { Hono } from 'hono';
import { appConfig } from '@/config/app.config';
import type { HonoEnv } from '@/schemas/hono';

const app = new Hono<HonoEnv>();

export default {
    hostname: appConfig.app.hostname,
    port: appConfig.app.port,
    fetch: app.fetch,
};
