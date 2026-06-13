import { z } from 'zod';
import { LogLevelSchema } from '@/utils/create-logger';
import { safeZodParser } from '@/utils/safe-zod-parser';

const NodeEnvSchema = z.enum(['development', 'production', 'test']);

const UrlOrUndefinedSchema = z
    .union([z.url(), z.literal('').transform(() => undefined)])
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const AppConfigSchema = z
    .object({
        HTTP_HOSTNAME: z.string().default('localhost'),
        HTTP_PORT: z.coerce.number().default(3001),
        APP_NAME: z.string(),
        SENTRY_DSN: UrlOrUndefinedSchema,
        NODE_ENV: NodeEnvSchema,
        LOGGER_USE_PRETTY: z.stringbool(),
        LOGGER_LEVEL: LogLevelSchema,
        LOGGER_LOKI_URL: UrlOrUndefinedSchema,
    })
    .transform((v) => ({
        app: {
            name: v.APP_NAME,
            nodeEnv: v.NODE_ENV,
            hostname: v.HTTP_HOSTNAME,
            port: v.HTTP_PORT,
        },
        sentry: {
            dsn: v.SENTRY_DSN,
        },
        logger: {
            usePretty: v.LOGGER_USE_PRETTY,
            level: v.LOGGER_LEVEL,
            lokiUrl: v.LOGGER_LOKI_URL,
        },
    }));

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const createConfig = (env: Record<string, string | undefined>): AppConfig => {
    return safeZodParser(env, AppConfigSchema, 'AppConfig');
};
